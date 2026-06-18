const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const pool = getPool();
    const transaction = pool.transaction();
    
    try {
        const { email, password, role, fullName, contactNumber, cnic, specialization, consultationFee } = req.body;

        if (!email || !password || !role || !fullName) {
            return res.status(400).json({ message: 'Email, password, role and full name are required.' });
        }

        // check if email already exists
        const existing = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT UserID FROM Users WHERE Email = @email');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // get role id
        const roleResult = await pool.request()
            .input('roleName', sql.VarChar, role)
            .query('SELECT RoleID FROM Roles WHERE RoleName = @roleName');

        if (roleResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        const roleID = roleResult.recordset[0].RoleID;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        await transaction.begin();

        // insert user
        const userResult = await transaction.request()
            .input('email', sql.VarChar, email)
            .input('passwordHash', sql.VarChar, hashedPassword)
            .input('roleID', sql.Int, roleID)
            .query('INSERT INTO Users (Email, PasswordHash, RoleID) OUTPUT INSERTED.UserID VALUES (@email, @passwordHash, @roleID)');

        const userID = userResult.recordset[0].UserID;

        // insert into role-specific table
        if (role === 'Patient') {
            if (!cnic) {
                await transaction.rollback();
                return res.status(400).json({ message: 'CNIC is required for patients.' });
            }
            await transaction.request()
                .input('patientID', sql.Int, userID)
                .input('fullName', sql.VarChar, fullName)
                .input('contactNumber', sql.VarChar, contactNumber || null)
                .input('cnic', sql.VarChar, cnic)
                .query('INSERT INTO Patients (PatientID, FullName, ContactNumber, CNIC) VALUES (@patientID, @fullName, @contactNumber, @cnic)');
        } else if (role === 'Doctor') {
            if (!consultationFee) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Consultation fee is required for doctors.' });
            }
            await transaction.request()
                .input('doctorID', sql.Int, userID)
                .input('fullName', sql.VarChar, fullName)
                .input('specialization', sql.VarChar, specialization || null)
                .input('consultationFee', sql.Decimal(10, 2), consultationFee)
                .query('INSERT INTO Doctors (DoctorID, FullName, Specialization, ConsultationFee) VALUES (@doctorID, @fullName, @specialization, @consultationFee)');
        } else if (role === 'Admin' || role === 'Reception') {
            if (!cnic) {
                await transaction.rollback();
                return res.status(400).json({ message: 'CNIC is required for admin/staff.' });
            }
            await transaction.request()
                .input('adminID', sql.Int, userID)
                .input('fullName', sql.VarChar, fullName)
                .input('contactNumber', sql.VarChar, contactNumber || null)
                .input('cnic', sql.VarChar, cnic)
                .input('department', sql.VarChar, role === 'Admin' ? 'Management' : 'Reception')
                .query('INSERT INTO AdminStaff (AdminID, FullName, ContactNumber, CNIC, Department) VALUES (@adminID, @fullName, @contactNumber, @cnic, @department)');
        }

        // Commit transaction
        await transaction.commit();

        res.status(201).json({ message: 'Registration successful.', userID });
    } catch (err) {
        // Rollback on error
        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error('Rollback error:', rollbackErr);
        }
        
        console.error('Register error:', err);
        console.error('Error details:', {
            message: err.message,
            number: err.number,
            state: err.state
        });
        
        // Handle specific SQL errors
        if (err.number === 2627) {
            return res.status(400).json({ message: 'CNIC already exists. Please use a different CNIC.' });
        }
        
        res.status(500).json({ message: 'Server error during registration: ' + err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const pool = getPool();

        // Using vw_UserAuth view instead of JOIN query
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM vw_UserAuth WHERE Email = @email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = result.recordset[0];

        if (!user.IsActive) {
            return res.status(403).json({ message: 'Account is deactivated.' });
        }

        const validPassword = await bcrypt.compare(password, user.PasswordHash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { userID: user.UserID, email: user.Email, role: user.RoleName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: { userID: user.UserID, email: user.Email, role: user.RoleName }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// GET /api/auth/me - get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const { userID, role } = req.user;

        let profileQuery = '';
        if (role === 'Patient') {
            // Using vw_PatientProfile view instead of complex JOIN
            profileQuery = 'SELECT * FROM vw_PatientProfile WHERE PatientID = @userID';
        } else if (role === 'Doctor') {
            // Using vw_DoctorProfile view instead of complex JOIN
            profileQuery = 'SELECT * FROM vw_DoctorProfile WHERE DoctorID = @userID';
        } else if (role === 'Admin' || role === 'Reception') {
            // Keep original query for AdminStaff (no view created yet)
            profileQuery = `SELECT u.UserID, u.Email, r.RoleName, a.FullName, a.ContactNumber, 
                           a.CNIC, a.Department
                           FROM Users u JOIN Roles r ON u.RoleID = r.RoleID 
                           JOIN AdminStaff a ON u.UserID = a.AdminID
                           WHERE u.UserID = @userID`;
        } else {
            // Using vw_UserAuth view for basic user info
            profileQuery = 'SELECT UserID, Email, RoleName FROM vw_UserAuth WHERE UserID = @userID';
        }

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(profileQuery);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
