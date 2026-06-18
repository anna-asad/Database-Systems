const express = require('express');
const { getPool, sql } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/doctors - list all doctors (public)
router.get('/', async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_DoctorProfile view instead of JOIN query
        const result = await pool.request()
            .query('SELECT * FROM vw_DoctorProfile WHERE IsActive = 1');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/:id/schedule - get doctor schedule
router.get('/:id/schedule', async (req, res) => {
    try {
        const pool = getPool();
        const doctorId = parseInt(req.params.id, 10);
        if (isNaN(doctorId)) return res.status(400).json({ message: 'Invalid doctor ID.' });

        // Using vw_DoctorSchedule view instead of JOIN query
        const result = await pool.request()
            .input('doctorID', sql.Int, doctorId)
            .query('SELECT * FROM vw_DoctorSchedule WHERE DoctorID = @doctorID');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/dashboard - doctor's today appointments
router.get('/dashboard', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_AppointmentDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .query(`SELECT * FROM vw_AppointmentDetails 
                    WHERE DoctorID = @doctorID AND AppointmentDate = CAST(GETDATE() AS DATE)
                    ORDER BY TokenNumber`);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/appointments/cancelled - get all cancelled appointments
router.get('/appointments/cancelled', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_AppointmentDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .query(`SELECT * FROM vw_AppointmentDetails 
                    WHERE DoctorID = @doctorID AND AppointmentStatusID = 5
                    ORDER BY AppointmentDate DESC, TokenNumber DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Cancelled appointments error:', err);
        res.status(500).json({ message: 'Server error loading cancelled appointments.' });
    }
});

// GET /api/doctors/appointments/future - get future appointments (must come before /:id routes)
router.get('/appointments/future', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_AppointmentDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .query(`SELECT * FROM vw_AppointmentDetails 
                    WHERE DoctorID = @doctorID AND AppointmentDate > CAST(GETDATE() AS DATE)
                    ORDER BY AppointmentDate, TokenNumber`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Future appointments error:', err);
        res.status(500).json({ message: 'Server error loading future appointments.' });
    }
});

// PUT /api/doctors/appointments/:id/complete - mark appointment as completed (using stored procedure)
router.put('/appointments/:id/complete', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const { remarks, diagnosis, prescription, notes } = req.body;
        const pool = getPool();
        const appointmentId = parseInt(req.params.id, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // Call stored procedure for atomic appointment completion
        const result = await pool.request()
            .input('AppointmentID', sql.Int, appointmentId)
            .input('DoctorID', sql.Int, req.user.userID)
            .input('Remarks', sql.NVarChar(500), remarks || null)
            .input('Diagnosis', sql.NVarChar(500), diagnosis || null)
            .input('Prescription', sql.NVarChar(1000), prescription || null)
            .input('Notes', sql.NVarChar(1000), notes || null)
            .execute('sp_CompleteAppointment');

        const completionData = result.recordset[0];

        res.json({
            message: completionData.Message,
            appointmentID: completionData.AppointmentID,
            patientID: completionData.PatientID,
            medicalRecordID: completionData.MedicalRecordID
        });
    } catch (err) {
        console.error('Complete appointment error:', err);
        
        // Handle stored procedure specific errors
        if (err.message && err.message.includes('not found')) {
            return res.status(404).json({ message: err.message });
        }
        if (err.message && err.message.includes('unauthorized')) {
            return res.status(403).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST /api/doctors/leaves - apply for leave
router.post('/leaves', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required.' });
        }

        const pool = getPool();
        await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('reason', sql.NVarChar, reason || null)
            .query(`INSERT INTO DoctorLeaves (DoctorID, StartDate, EndDate, Reason, LeaveStatusID)
                    VALUES (@doctorID, @startDate, @endDate, @reason, 1)`);

        res.status(201).json({ message: 'Leave request submitted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/leaves - get own leaves
router.get('/leaves', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_DoctorLeaves view instead of JOIN query
        const result = await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .query('SELECT * FROM vw_DoctorLeaves WHERE DoctorID = @doctorID ORDER BY StartDate DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/leaves/:id/summary - get cancelled appointments for a leave
router.get('/leaves/:id/summary', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        const leaveId = parseInt(req.params.id, 10);
        if (isNaN(leaveId)) return res.status(400).json({ message: 'Invalid leave ID.' });

        // Verify the leave belongs to this doctor
        const leaveCheck = await pool.request()
            .input('leaveID', sql.Int, leaveId)
            .input('doctorID', sql.Int, req.user.userID)
            .query('SELECT LeaveID FROM DoctorLeaves WHERE LeaveID = @leaveID AND DoctorID = @doctorID');

        if (leaveCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Leave not found or unauthorized.' });
        }

        const result = await pool.request()
            .input('leaveID', sql.Int, leaveId)
            .query(`SELECT a.AppointmentID, a.AppointmentDate, a.TimeSlot, a.TokenNumber,
                    p.FullName as PatientName, p.ContactNumber, a.CreatedAt
                    FROM Appointments a
                    JOIN Patients p ON a.PatientID = p.PatientID
                    WHERE a.AppointmentStatusID = 5
                    AND a.DoctorID = (SELECT DoctorID FROM DoctorLeaves WHERE LeaveID = @leaveID)
                    AND a.AppointmentDate BETWEEN (SELECT StartDate FROM DoctorLeaves WHERE LeaveID = @leaveID)
                                            AND (SELECT EndDate FROM DoctorLeaves WHERE LeaveID = @leaveID)
                    ORDER BY a.AppointmentDate, a.TimeSlot`);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/notifications - get doctor notifications
router.get('/notifications', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('userID', sql.Int, req.user.userID)
            .query(`SELECT NotificationID, Title, Message, IsRead, RelatedType, RelatedID, CreatedAt
                    FROM Notifications
                    WHERE UserID = @userID
                    ORDER BY CreatedAt DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/doctors/notifications/:id/read - mark notification as read
router.put('/notifications/:id/read', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        const notificationId = parseInt(req.params.id, 10);
        if (isNaN(notificationId)) return res.status(400).json({ message: 'Invalid notification ID.' });

        await pool.request()
            .input('notificationID', sql.Int, notificationId)
            .input('userID', sql.Int, req.user.userID)
            .query('UPDATE Notifications SET IsRead = 1 WHERE NotificationID = @notificationID AND UserID = @userID');

        res.json({ message: 'Notification marked as read.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/doctors/schedule - update own schedule
router.put('/schedule', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const { schedules } = req.body; // array of { dayOfWeekID, startTime, endTime }
        const pool = getPool();

        // delete existing schedules
        await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .query('DELETE FROM DoctorSchedules WHERE DoctorID = @doctorID');

        // insert new ones
        for (const s of schedules) {
            await pool.request()
                .input('doctorID', sql.Int, req.user.userID)
                .input('dayOfWeekID', sql.Int, s.dayOfWeekID)
                .input('startTime', sql.Time, s.startTime)
                .input('endTime', sql.Time, s.endTime)
                .query(`INSERT INTO DoctorSchedules (DoctorID, DayOfWeekID, StartTime, EndTime)
                        VALUES (@doctorID, @dayOfWeekID, @startTime, @endTime)`);
        }

        res.json({ message: 'Schedule updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/doctors/profile - update doctor profile
router.put('/profile', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const { fullName, specialization, consultationFee } = req.body;
        const pool = getPool();

        await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .input('fullName', sql.VarChar, fullName)
            .input('specialization', sql.VarChar, specialization)
            .input('consultationFee', sql.Decimal(10, 2), consultationFee)
            .query('UPDATE Doctors SET FullName = @fullName, Specialization = @specialization, ConsultationFee = @consultationFee WHERE DoctorID = @doctorID');

        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/doctors/my-schedule - get own schedule
router.get('/my-schedule', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_DoctorSchedule view instead of JOIN query
        const result = await pool.request()
            .input('doctorID', sql.Int, req.user.userID)
            .query('SELECT * FROM vw_DoctorSchedule WHERE DoctorID = @doctorID ORDER BY DayOfWeekID');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/doctors/appointments/:id/call - call next patient (validate appointment)
router.put('/appointments/:id/call', authenticateToken, authorizeRoles('Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        const appointmentId = parseInt(req.params.id, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // Using vw_AppointmentDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('appointmentID', sql.Int, appointmentId)
            .input('doctorID', sql.Int, req.user.userID)
            .query(`SELECT * FROM vw_AppointmentDetails 
                    WHERE AppointmentID = @appointmentID AND DoctorID = @doctorID
                    AND AppointmentDate = CAST(GETDATE() AS DATE)`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized.' });
        }

        res.json({ message: 'Patient called.', appointment: result.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
