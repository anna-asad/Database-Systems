const express = require('express');
const { getPool, sql } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/billing - get all bills (admin/reception view)
router.get('/', authenticateToken, authorizeRoles('Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_AllBills view for comprehensive bill listing
        const result = await pool.request()
            .query('SELECT * FROM vw_AllBills ORDER BY BillCreatedAt DESC');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/stats - get billing statistics (admin/reception)
router.get('/stats', authenticateToken, authorizeRoles('Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_BillingStats view for dashboard statistics
        const result = await pool.request()
            .query('SELECT * FROM vw_BillingStats');

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/revenue - get daily revenue summary (admin)
router.get('/revenue', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_DailyRevenue view for revenue analytics
        const result = await pool.request()
            .query(`
                SELECT TOP 30 * 
                FROM vw_DailyRevenue 
                ORDER BY PaymentDate DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/patient/:patientId - get bills for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const patientId = parseInt(req.params.patientId, 10);
        if (isNaN(patientId)) return res.status(400).json({ message: 'Invalid patient ID.' });

        // Patients can only view their own bills; Admin/Reception can view any
        if (req.user.role === 'Patient' && patientId !== req.user.userID) {
            return res.status(403).json({ message: 'You can only view your own bills.' });
        }

        // Using vw_PatientBills view for patient-specific billing
        const result = await pool.request()
            .input('patientID', sql.Int, patientId)
            .query(`
                SELECT * FROM vw_PatientBills 
                WHERE PatientID = @patientID 
                ORDER BY BillCreatedAt DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/pending - get all pending bills (admin/reception)
router.get('/pending', authenticateToken, authorizeRoles('Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_PendingBills view for pending payments
        const result = await pool.request()
            .query('SELECT * FROM vw_PendingBills ORDER BY AppointmentDate DESC');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/overdue - get overdue bills (admin/reception)
router.get('/overdue', authenticateToken, authorizeRoles('Admin', 'Reception'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_PendingBills view with overdue filter
        const result = await pool.request()
            .query(`
                SELECT * FROM vw_PendingBills 
                WHERE DaysOverdue > 0 
                ORDER BY DaysOverdue DESC, AppointmentDate DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/my-bills - get current patient's bills
router.get('/my-bills', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_PatientBills view for patient's own bills
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query(`
                SELECT * FROM vw_PatientBills 
                WHERE PatientID = @patientID 
                ORDER BY BillCreatedAt DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/my-due - get current patient's due bills only
router.get('/my-due', authenticateToken, authorizeRoles('Patient'), async (req, res) => {
    try {
        const pool = getPool();
        
        // Using vw_PatientBills view for patient's due bills
        const result = await pool.request()
            .input('patientID', sql.Int, req.user.userID)
            .query(`
                SELECT * FROM vw_PatientBills 
                WHERE PatientID = @patientID 
                AND IsPaymentDue = 1
                ORDER BY AppointmentDate DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/:appointmentId - get bill for an appointment
router.get('/:appointmentId', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const appointmentId = parseInt(req.params.appointmentId, 10);
        if (isNaN(appointmentId)) return res.status(400).json({ message: 'Invalid appointment ID.' });

        // Using vw_BillingDetails view for single appointment bill
        const result = await pool.request()
            .input('appointmentID', sql.Int, appointmentId)
            .query('SELECT * FROM vw_BillingDetails WHERE AppointmentID = @appointmentID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Bill not found.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/billing/:id/pay - mark bill as paid
router.put('/:id/pay', authenticateToken, authorizeRoles('Reception', 'Admin'), async (req, res) => {
    try {
        const pool = getPool();
        const billId = parseInt(req.params.id, 10);
        if (isNaN(billId)) return res.status(400).json({ message: 'Invalid bill ID.' });

        // Get bill details before updating using view
        const billResult = await pool.request()
            .input('billID', sql.Int, billId)
            .query(`
                SELECT BillID, Amount, PatientID, PatientName, PaymentStatus
                FROM vw_AllBills 
                WHERE BillID = @billID AND PaymentStatusID = 1
            `);

        if (billResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Bill not found or already paid.' });
        }

        const bill = billResult.recordset[0];

        // Update payment status
        await pool.request()
            .input('billID', sql.Int, billId)
            .query('UPDATE Billing SET PaymentStatusID = 2, PaymentDate = GETDATE() WHERE BillID = @billID');

        // Create notification for patient
        await pool.request()
            .input('patientID', sql.Int, bill.PatientID)
            .input('amount', sql.Decimal, bill.Amount)
            .query(`
                INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
                VALUES (@patientID, 'Payment Received', 
                        CONCAT('Your payment of $', @amount, ' has been processed successfully.'), 
                        'Payment', @billID)
            `);

        res.json({ 
            message: 'Payment recorded successfully.',
            patientName: bill.PatientName,
            amount: bill.Amount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/billing/doctor/:doctorId - get bills for a specific doctor (admin/doctor)
router.get('/doctor/:doctorId', authenticateToken, authorizeRoles('Admin', 'Reception', 'Doctor'), async (req, res) => {
    try {
        const pool = getPool();
        const doctorId = parseInt(req.params.doctorId, 10);
        if (isNaN(doctorId)) return res.status(400).json({ message: 'Invalid doctor ID.' });

        // Doctors can only view their own bills; Admin/Reception can view any
        if (req.user.role === 'Doctor' && doctorId !== req.user.userID) {
            return res.status(403).json({ message: 'You can only view your own appointment bills.' });
        }

        // Using vw_AllBills view for doctor-specific billing
        const result = await pool.request()
            .input('doctorID', sql.Int, doctorId)
            .query(`
                SELECT * FROM vw_AllBills 
                WHERE DoctorID = @doctorID 
                ORDER BY BillCreatedAt DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
