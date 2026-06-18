const express = require('express');
const { getPool, sql } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// all admin routes require Admin or Reception role
router.use(authenticateToken, authorizeRoles('Admin', 'Reception'));

// GET /api/admin/stats - dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const pool = getPool();

        // Using vw_AdminDashboard view instead of 6 separate COUNT queries
        const result = await pool.request().query('SELECT * FROM vw_AdminDashboard');
        const stats = result.recordset[0];

        res.json({
            totalPatients: stats.TotalPatients,
            totalDoctors: stats.TotalDoctors,
            totalAppointments: stats.TotalAppointments,
            todayAppointments: stats.TodayAppointments,
            pendingLeaves: stats.PendingLeaves,
            blacklistedPatients: stats.BlacklistedPatients
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/patients - list all patients
router.get('/patients', async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_PatientProfile view instead of JOIN query
        const result = await pool.request().query('SELECT * FROM vw_PatientProfile');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/doctors - list all doctors
router.get('/doctors', async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_DoctorProfile view instead of JOIN query
        const result = await pool.request().query('SELECT * FROM vw_DoctorProfile');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/admin/patients/:id/blacklist - toggle blacklist status
router.put('/patients/:id/blacklist', async (req, res) => {
    try {
        const pool = getPool();
        const patientId = parseInt(req.params.id, 10);
        if (isNaN(patientId)) return res.status(400).json({ message: 'Invalid patient ID.' });

        const { blacklist } = req.body; // true or false

        // UPDATE: Patients table
        await pool.request()
            .input('patientID', sql.Int, patientId)
            .input('blacklist', sql.Bit, blacklist ? 1 : 0)
            .query('UPDATE Patients SET IsBlacklisted = @blacklist WHERE PatientID = @patientID');

        res.json({ message: blacklist ? 'Patient blacklisted.' : 'Patient removed from blacklist.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/leaves - get all pending leaves
router.get('/leaves', async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_DoctorLeaves view instead of triple JOIN query
        const result = await pool.request()
            .query('SELECT * FROM vw_DoctorLeaves ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/admin/leaves/:id - approve or reject leave (using stored procedure)
router.put('/leaves/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const pool = getPool();
        const leaveId = parseInt(req.params.id, 10);
        
        if (isNaN(leaveId)) return res.status(400).json({ message: 'Invalid leave ID.' });
        if (!status) return res.status(400).json({ message: 'Status is required.' });

        // Call stored procedure for atomic leave processing
        const result = await pool.request()
            .input('LeaveID', sql.Int, leaveId)
            .input('ApprovalStatus', sql.NVarChar(50), status.trim())
            .execute('sp_ProcessDoctorLeave');

        const leaveData = result.recordset[0];

        res.json({
            message: leaveData.Message,
            leaveID: leaveData.LeaveID,
            status: leaveData.Status,
            cancelledAppointments: leaveData.CancelledAppointments,
            doctorName: leaveData.DoctorName
        });
    } catch (err) {
        console.error('Process leave error:', err);
        
        // Handle stored procedure specific errors
        if (err.message && err.message.includes('Invalid leave status')) {
            return res.status(400).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET /api/admin/appointments - list all appointments
router.get('/appointments', async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_AppointmentDetails view instead of complex JOIN query
        const result = await pool.request()
            .query('SELECT * FROM vw_AppointmentDetails ORDER BY AppointmentDate DESC, TimeSlot');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/admin/doctors/:id/availability - toggle doctor availability
router.put('/doctors/:id/availability', async (req, res) => {
    try {
        const pool = getPool();
        const doctorId = parseInt(req.params.id, 10);
        if (isNaN(doctorId)) return res.status(400).json({ message: 'Invalid doctor ID.' });

        const { isAvailable } = req.body;
        
        if (isAvailable === undefined || isAvailable === null) {
            return res.status(400).json({ message: 'isAvailable field is required.' });
        }

        // UPDATE: Doctors table
        const result = await pool.request()
            .input('doctorID', sql.Int, doctorId)
            .input('isAvailable', sql.Bit, isAvailable ? 1 : 0)
            .query('UPDATE Doctors SET IsAvailable = @isAvailable WHERE DoctorID = @doctorID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        res.json({ 
            message: isAvailable ? 'Doctor is now available.' : 'Doctor is now unavailable.',
            doctorID: doctorId,
            isAvailable: isAvailable ? 1 : 0
        });
    } catch (err) {
        console.error('Set doctor availability error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// PUT /api/admin/profile - update admin profile
router.put('/profile', async (req, res) => {
    try {
        const { fullName, contactNumber, cnic } = req.body;
        const pool = getPool();

        // UPDATE: AdminStaff table
        await pool.request()
            .input('adminID', sql.Int, req.user.userID)
            .input('fullName', sql.VarChar(255), fullName)
            .input('contactNumber', sql.VarChar(20), contactNumber)
            .input('cnic', sql.VarChar(20), cnic)
            .query('UPDATE AdminStaff SET FullName = @fullName, ContactNumber = @contactNumber, CNIC = @cnic WHERE AdminID = @adminID');

        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/blacklist - get all blacklisted patients
router.get('/blacklist', authenticateToken, authorizeRoles('Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        // SELECT: Patients table (blacklisted only)
        const result = await pool.request()
            .query(`SELECT p.PatientID, p.FullName, p.CNIC, p.ContactNumber,
                    p.TotalVisits, p.SuccessfulVisits, p.MissedVisits
                    FROM Patients p
                    WHERE p.IsBlacklisted = 1
                    ORDER BY p.FullName`);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/admin/blacklist/:id/remove - remove blacklist status
router.put('/blacklist/:id/remove', authenticateToken, authorizeRoles('Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        const patientId = parseInt(req.params.id, 10);
        if (isNaN(patientId)) return res.status(400).json({ message: 'Invalid patient ID.' });

        // UPDATE: Patients table (remove blacklist)
        await pool.request()
            .input('patientID', sql.Int, patientId)
            .query(`UPDATE Patients SET IsBlacklisted = 0 WHERE PatientID = @patientID`);

        res.json({ message: 'Blacklist removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});
module.exports = router;
