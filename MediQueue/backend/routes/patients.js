const express = require('express');
const { getPool, sql } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/patients/profile - get own profile
router.get('/profile', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_PatientProfile view instead of JOIN query
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query('SELECT * FROM vw_PatientProfile WHERE PatientID = @patientID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/patients/profile - update own profile
router.put('/profile', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const { fullName, contactNumber } = req.body;
        const pool = getPool();

        await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .input('fullName', sql.VarChar, fullName)
            .input('contactNumber', sql.VarChar, contactNumber)
            .query('UPDATE Patients SET FullName = @fullName, ContactNumber = @contactNumber WHERE PatientID = @patientID');

        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/patients/history - get appointment history
router.get('/history', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_AppointmentDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query('SELECT * FROM vw_AppointmentDetails WHERE PatientID = @patientID ORDER BY AppointmentDate DESC, TimeSlot DESC');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/patients/medical-records - get own medical records
router.get('/medical-records', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_MedicalRecordDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query('SELECT * FROM vw_MedicalRecordDetails WHERE PatientID = @patientID ORDER BY CreatedAt DESC');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/patients/bills - get own billing history
router.get('/bills', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        // Using vw_BillingDetails view instead of complex JOIN query
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query('SELECT * FROM vw_BillingDetails WHERE PatientID = @patientID ORDER BY AppointmentDate DESC');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/patients/notifications - get patient notifications
router.get('/notifications', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
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

// PUT /api/patients/notifications/:id/read - mark notification as read
router.put('/notifications/:id/read', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
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

// PUT /api/patients/profile-picture - update profile picture
router.put('/profile-picture', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const { profilePictureURL } = req.body;
        const pool = getPool();

        await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .input('profilePictureURL', sql.VarChar, profilePictureURL || null)
            .query('UPDATE Patients SET ProfilePictureURL = @profilePictureURL WHERE PatientID = @patientID');

        res.json({ message: 'Profile picture updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/patients/stats - get patient visit statistics
router.get('/stats', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query(`SELECT FullName, CNIC, TotalVisits, SuccessfulVisits, MissedVisits, IsBlacklisted
                    FROM Patients
                    WHERE PatientID = @patientID`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;