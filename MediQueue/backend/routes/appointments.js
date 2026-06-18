const express = require('express');
const { getPool, sql } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// POST /api/appointments - book a new appointment (using stored procedure)
router.post('/', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const { doctorID, appointmentDate, timeSlot } = req.body;
        const patientID = req.user.userID;

        if (!doctorID || !appointmentDate || !timeSlot) {
            return res.status(400).json({ message: 'Doctor, date and time slot are required.' });
        }

        // Format time slot to HH:MM:SS if it's only HH:MM
        let formattedTimeSlot = timeSlot;
        if (timeSlot.split(':').length === 2) {
            formattedTimeSlot = timeSlot + ':00';
        }

        const pool = getPool();

        // Call stored procedure for atomic appointment booking
        const result = await pool.request()
            .input('PatientID', sql.Int, patientID)
            .input('DoctorID', sql.Int, doctorID)
            .input('AppointmentDate', sql.Date, appointmentDate)
            .input('TimeSlot', sql.Time, formattedTimeSlot)
            .execute('sp_BookAppointment');

        const appointmentData = result.recordset[0];

        res.status(201).json({
            message: appointmentData.Message,
            appointmentID: appointmentData.AppointmentID,
            tokenNumber: appointmentData.TokenNumber,
            queuePosition: appointmentData.QueuePosition,
            amount: appointmentData.Amount
        });
    } catch (err) {
        console.error('Appointment booking error:', err);
        
        // Extract error message from SQL Server error object
        const errorMessage = err.message || err.originalError?.info?.message || '';
        
        // Handle stored procedure specific errors
        if (errorMessage.includes('blacklisted')) {
            return res.status(403).json({ message: errorMessage });
        }
        if (errorMessage.includes('not available')) {
            return res.status(400).json({ message: errorMessage });
        }
        if (errorMessage.includes('already booked')) {
            return res.status(400).json({ message: errorMessage });
        }
        
        res.status(500).json({ message: 'Server error: ' + errorMessage });
    }
});

// PUT /api/appointments/:id/cancel - cancel appointment
router.put('/:id/cancel', authenticateToken, authorizeRoles('Patient', 'Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        const appointmentId = parseInt(req.params.id, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // Get appointment details before cancelling
        const apptResult = await pool.request()
            .input('appointmentID', sql.Int, appointmentId)
            .query('SELECT DoctorID, AppointmentDate FROM Appointments WHERE AppointmentID = @appointmentID');

        if (apptResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const { DoctorID, AppointmentDate } = apptResult.recordset[0];

        // Cancel the appointment
        await pool.request()
            .input('appointmentID', sql.Int, appointmentId)
            .query('UPDATE Appointments SET AppointmentStatusID = 5, QueuePosition = NULL WHERE AppointmentID = @appointmentID');

        // Recalculate queue positions for remaining appointments
        await pool.request()
            .input('doctorID', sql.Int, DoctorID)
            .input('date', sql.Date, AppointmentDate)
            .query(`
                WITH RankedAppointments AS (
                    SELECT AppointmentID, 
                           ROW_NUMBER() OVER (ORDER BY TokenNumber) as NewPosition
                    FROM Appointments
                    WHERE DoctorID = @doctorID 
                    AND AppointmentDate = @date
                    AND AppointmentStatusID IN (1, 4)
                )
                UPDATE a
                SET QueuePosition = ra.NewPosition
                FROM Appointments a
                INNER JOIN RankedAppointments ra ON a.AppointmentID = ra.AppointmentID
            `);

        res.json({ message: 'Appointment cancelled.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/appointments/:id/reschedule - reschedule appointment (using stored procedure)
router.put('/:id/reschedule', authenticateToken, authorizeRoles('Patient', 'Admin', 'Reception'), async (req, res) => {
    try {
        const { newDate, newTimeSlot } = req.body;
        if (!newDate || !newTimeSlot) {
            return res.status(400).json({ message: 'New date and time slot are required.' });
        }

        // Format time slot to HH:MM:SS if it's only HH:MM
        let formattedTimeSlot = newTimeSlot;
        if (newTimeSlot.split(':').length === 2) {
            formattedTimeSlot = newTimeSlot + ':00';
        }

        const pool = getPool();
        const appointmentId = parseInt(req.params.id, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // For patients, pass their ID for authorization check
        const patientID = req.user.role === 'Patient' ? req.user.userID : null;

        // Call stored procedure for atomic appointment rescheduling
        const result = await pool.request()
            .input('AppointmentID', sql.Int, appointmentId)
            .input('NewDate', sql.Date, newDate)
            .input('NewTimeSlot', sql.Time, formattedTimeSlot)
            .input('PatientID', sql.Int, patientID)
            .execute('sp_RescheduleAppointment');

        const rescheduleData = result.recordset[0];

        res.json({
            message: rescheduleData.Message,
            appointmentID: rescheduleData.AppointmentID,
            newToken: rescheduleData.NewTokenNumber,
            newQueuePosition: rescheduleData.NewQueuePosition
        });
    } catch (err) {
        console.error('Appointment reschedule error:', err);
        
        // Handle stored procedure specific errors
        if (err.message && err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message && err.message.includes('own appointments')) {
            return res.status(403).json({ message: err.message });
        }
        if (err.message && err.message.includes('already booked')) {
            return res.status(400).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET /api/appointments/:id/status - get appointment status with queue info (using utility stored procedure)
router.get('/:id/status', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const appointmentId = parseInt(req.params.id, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // Call utility stored procedure for comprehensive queue status
        const result = await pool.request()
            .input('AppointmentID', sql.Int, appointmentId)
            .execute('sp_GetQueueStatus');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const queueData = result.recordset[0];

        res.json({
            appointmentID: queueData.AppointmentID,
            tokenNumber: queueData.TokenNumber,
            currentToken: queueData.CurrentToken,
            queuePosition: queueData.QueuePosition,
            patientsAhead: queueData.PatientsAhead,
            estimatedWaitTime: queueData.EstimatedWaitMinutes,
            status: queueData.AppointmentStatus,
            doctorName: queueData.DoctorName,
            patientName: queueData.PatientName,
            appointmentDate: queueData.AppointmentDate,
            timeSlot: queueData.TimeSlot
        });
    } catch (err) {
        console.error('Queue status error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET /api/appointments/queue/:doctorId/:date - get queue for a doctor on a date
router.get('/queue/:doctorId/:date', async (req, res) => {
    try {
        const pool = getPool();
        const doctorId = parseInt(req.params.doctorId, 10);
        if (isNaN(doctorId)) return res.status(400).json({ message: 'Invalid doctor ID.' });

        const result = await pool.request()
            .input('doctorID', sql.Int, doctorId)
            .input('date', sql.Date, req.params.date)
            .query(`SELECT * FROM vw_AppointmentDetails 
                    WHERE DoctorID = @doctorID AND AppointmentDate = @date
                    AND AppointmentStatusID IN (1, 4)
                    ORDER BY QueuePosition`);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/appointments/:id/miss - mark as missed (using stored procedure)
router.put('/:id/miss', authenticateToken, authorizeRoles('Doctor', 'Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        const appointmentId = parseInt(req.params.id, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // Call stored procedure for atomic missed appointment processing
        const result = await pool.request()
            .input('AppointmentID', sql.Int, appointmentId)
            .execute('sp_MarkAppointmentMissed');

        const missedData = result.recordset[0];

        res.json({
            message: missedData.Message,
            appointmentID: missedData.AppointmentID,
            patientName: missedData.PatientName,
            missedVisitCount: missedData.MissedVisitCount,
            wasBlacklisted: missedData.WasBlacklisted
        });
    } catch (err) {
        console.error('Mark missed error:', err);
        
        // Handle stored procedure specific errors
        if (err.message && err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST /api/appointments/walkin - walk-in appointment (using stored procedure)
router.post('/walkin', authenticateToken, authorizeRoles('Reception', 'Admin'), async (req, res) => {
    try {
        const { patientID, doctorID, timeSlot } = req.body;
        
        if (!patientID || !doctorID || !timeSlot) {
            return res.status(400).json({ message: 'Patient ID, Doctor ID, and time slot are required.' });
        }

        // Format time slot to HH:MM:SS if it's only HH:MM
        let formattedTimeSlot = timeSlot;
        if (timeSlot.split(':').length === 2) {
            formattedTimeSlot = timeSlot + ':00';
        }

        const pool = getPool();

        // Call stored procedure for atomic walk-in appointment creation
        const result = await pool.request()
            .input('PatientID', sql.Int, patientID)
            .input('DoctorID', sql.Int, doctorID)
            .input('TimeSlot', sql.Time, formattedTimeSlot)
            .execute('sp_CreateWalkInAppointment');

        const walkInData = result.recordset[0];

        res.status(201).json({
            message: walkInData.Message,
            appointmentID: walkInData.AppointmentID,
            tokenNumber: walkInData.TokenNumber,
            queuePosition: walkInData.QueuePosition
        });
    } catch (err) {
        console.error('Walk-in appointment error:', err);
        
        // Handle stored procedure specific errors
        if (err.message && err.message.includes('blacklisted')) {
            return res.status(403).json({ message: err.message });
        }
        if (err.message && err.message.includes('not available')) {
            return res.status(400).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
