-- MediQueue Database Views
-- This file contains all views to simplify complex queries across the application

-- ========================================
-- VIEW 1: Admin Dashboard Statistics
-- ========================================
CREATE VIEW vw_AdminDashboard AS
SELECT 
    (SELECT COUNT(*) FROM Patients) AS TotalPatients,
    (SELECT COUNT(*) FROM Doctors) AS TotalDoctors,
    (SELECT COUNT(*) FROM Appointments) AS TotalAppointments,
    (SELECT COUNT(*) FROM Appointments WHERE AppointmentDate = CAST(GETDATE() AS DATE)) AS TodayAppointments,
    (SELECT COUNT(*) FROM DoctorLeaves WHERE LeaveStatusID = 1) AS PendingLeaves,
    (SELECT COUNT(*) FROM Patients WHERE IsBlacklisted = 1) AS BlacklistedPatients;

-- ========================================
-- VIEW 2: Patient Profile with User Info
-- ========================================
CREATE VIEW vw_PatientProfile AS
SELECT 
    p.PatientID,
    p.FullName,
    p.ContactNumber,
    p.CNIC,
    p.ProfilePictureURL,
    p.TotalVisits,
    p.SuccessfulVisits,
    p.MissedVisits,
    p.IsBlacklisted,
    u.Email,
    u.IsActive,
    u.CreatedAt
FROM Patients p 
JOIN Users u ON p.PatientID = u.UserID;

-- ========================================
-- VIEW 3: Doctor Profile with User Info
-- ========================================
CREATE VIEW vw_DoctorProfile AS
SELECT 
    d.DoctorID,
    d.FullName,
    d.Specialization,
    d.ConsultationFee,
    d.IsAvailable,
    u.Email,
    u.IsActive,
    u.CreatedAt
FROM Doctors d 
JOIN Users u ON d.DoctorID = u.UserID;

-- ========================================
-- VIEW 4: Complete Appointment Details
-- ========================================
CREATE VIEW vw_AppointmentDetails AS
SELECT 
    a.AppointmentID,
    a.PatientID,
    a.DoctorID,
    a.AppointmentDate,
    a.TimeSlot,
    a.TokenNumber,
    a.AppointmentStatusID,
    a.DoctorRemarks,
    a.QueuePosition,
    a.CreatedAt,
    p.FullName AS PatientName,
    p.ContactNumber AS PatientContact,
    p.CNIC AS PatientCNIC,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization,
    d.ConsultationFee,
    s.StatusName AS Status
FROM Appointments a
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID
JOIN AppointmentStatuses s ON a.AppointmentStatusID = s.StatusID;

-- ========================================
-- VIEW 5: Medical Record Details
-- ========================================
CREATE VIEW vw_MedicalRecordDetails AS
SELECT 
    mr.RecordID,
    mr.AppointmentID,
    mr.PatientID,
    mr.DoctorID,
    mr.Diagnosis,
    mr.Prescription,
    mr.Notes,
    mr.CreatedAt,
    p.FullName AS PatientName,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization,
    a.AppointmentDate,
    a.TimeSlot
FROM MedicalRecords mr
JOIN Patients p ON mr.PatientID = p.PatientID
JOIN Doctors d ON mr.DoctorID = d.DoctorID
JOIN Appointments a ON mr.AppointmentID = a.AppointmentID;

-- ========================================
-- VIEW 6: Complete Billing Details
-- ========================================
CREATE VIEW vw_BillingDetails AS
SELECT 
    b.BillID,
    b.AppointmentID,
    b.Amount,
    b.FeeSlipURL,
    b.PaymentDate,
    b.CreatedAt AS BillCreatedAt,
    ps.StatusName AS PaymentStatus,
    a.PatientID,
    a.DoctorID,
    a.AppointmentDate,
    a.TimeSlot,
    a.TokenNumber,
    p.FullName AS PatientName,
    p.CNIC AS PatientCNIC,
    p.ContactNumber AS PatientContact,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization
FROM Billing b
JOIN Appointments a ON b.AppointmentID = a.AppointmentID
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID
JOIN PaymentStatuses ps ON b.PaymentStatusID = ps.StatusID;

-- ========================================
-- VIEW 7: Doctor Schedule with Day Names
-- ========================================
CREATE VIEW vw_DoctorSchedule AS
SELECT 
    ds.ScheduleID,
    ds.DoctorID,
    ds.DayOfWeekID,
    dw.DayName,
    ds.StartTime,
    ds.EndTime,
    d.FullName AS DoctorName,
    d.Specialization
FROM DoctorSchedules ds
JOIN DaysOfWeek dw ON ds.DayOfWeekID = dw.DayID
JOIN Doctors d ON ds.DoctorID = d.DoctorID;

-- ========================================
-- VIEW 8: Doctor Leaves with Status Names
-- ========================================
CREATE VIEW vw_DoctorLeaves AS
SELECT 
    dl.LeaveID,
    dl.DoctorID,
    dl.StartDate,
    dl.EndDate,
    dl.Reason,
    dl.LeaveStatusID,
    dl.CreatedAt,
    ls.StatusName AS Status,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization
FROM DoctorLeaves dl
JOIN LeaveStatuses ls ON dl.LeaveStatusID = ls.StatusID
JOIN Doctors d ON dl.DoctorID = d.DoctorID;

-- ========================================
-- VIEW 9: Queue Status Information
-- ========================================
CREATE VIEW vw_QueueStatus AS
SELECT 
    a.DoctorID,
    a.AppointmentDate,
    COUNT(*) AS TotalInQueue,
    MIN(a.QueuePosition) AS NextPosition,
    MAX(a.QueuePosition) AS LastPosition,
    d.FullName AS DoctorName,
    d.Specialization
FROM Appointments a
JOIN Doctors d ON a.DoctorID = d.DoctorID
WHERE a.AppointmentStatusID IN (1, 4) -- Scheduled or Walk-in
AND a.QueuePosition IS NOT NULL
GROUP BY a.DoctorID, a.AppointmentDate, d.FullName, d.Specialization;

-- ========================================
-- VIEW 10: User Authentication Details
-- ========================================
CREATE VIEW vw_UserAuth AS
SELECT 
    u.UserID,
    u.Email,
    u.PasswordHash,
    u.IsActive,
    u.CreatedAt,
    r.RoleID,
    r.RoleName
FROM Users u 
JOIN Roles r ON u.RoleID = r.RoleID;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- Example 1: Get admin dashboard stats
-- SELECT * FROM vw_AdminDashboard;

-- Example 2: Get patient profile
-- SELECT * FROM vw_PatientProfile WHERE PatientID = 1;

-- Example 3: Get doctor's today appointments
-- SELECT * FROM vw_AppointmentDetails WHERE DoctorID = 11 AND AppointmentDate = CAST(GETDATE() AS DATE);

-- Example 4: Get patient's medical history
-- SELECT * FROM vw_MedicalRecordDetails WHERE PatientID = 1 ORDER BY CreatedAt DESC;

-- Example 5: Get billing information
-- SELECT * FROM vw_BillingDetails WHERE AppointmentID = 1;

-- ========================================
-- BILLING-SPECIFIC VIEWS
-- ========================================

-- ========================================
-- VIEW 11: All Bills with Complete Details
-- ========================================
CREATE VIEW vw_AllBills AS
SELECT 
    b.BillID,
    b.AppointmentID,
    b.Amount,
    b.PaymentDate,
    b.CreatedAt AS BillCreatedAt,
    b.PaymentStatusID,
    ps.StatusName AS PaymentStatus,
    a.PatientID,
    a.DoctorID,
    a.AppointmentDate,
    a.TimeSlot,
    a.TokenNumber,
    a.AppointmentStatusID,
    ast.StatusName AS AppointmentStatus,
    p.FullName AS PatientName,
    p.ContactNumber AS PatientContact,
    p.CNIC AS PatientCNIC,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization,
    CASE 
        WHEN a.AppointmentStatusID = 2 AND b.PaymentStatusID = 1 THEN 'Due'
        WHEN b.PaymentStatusID = 2 THEN 'Paid'
        WHEN a.AppointmentStatusID IN (1, 4) THEN 'Pending Appointment'
        WHEN a.AppointmentStatusID = 3 THEN 'Missed - No Payment Required'
        WHEN a.AppointmentStatusID = 5 THEN 'Cancelled - Refund Due'
        ELSE 'Unknown'
    END AS BillStatus
FROM Billing b
JOIN PaymentStatuses ps ON b.PaymentStatusID = ps.StatusID
JOIN Appointments a ON b.AppointmentID = a.AppointmentID
JOIN AppointmentStatuses ast ON a.AppointmentStatusID = ast.StatusID
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID;

-- ========================================
-- VIEW 12: Pending Bills (Completed Appointments, Unpaid)
-- ========================================
CREATE VIEW vw_PendingBills AS
SELECT 
    b.BillID,
    b.AppointmentID,
    b.Amount,
    b.CreatedAt AS BillCreatedAt,
    a.PatientID,
    a.DoctorID,
    a.AppointmentDate,
    a.TimeSlot,
    a.TokenNumber,
    p.FullName AS PatientName,
    p.ContactNumber AS PatientContact,
    p.CNIC AS PatientCNIC,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization,
    DATEDIFF(DAY, a.AppointmentDate, GETDATE()) AS DaysOverdue
FROM Billing b
JOIN Appointments a ON b.AppointmentID = a.AppointmentID
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID
WHERE b.PaymentStatusID = 1  -- Pending payment
AND a.AppointmentStatusID = 2;  -- Completed appointments only

-- ========================================
-- VIEW 13: Patient Bills Summary
-- ========================================
CREATE VIEW vw_PatientBills AS
SELECT 
    a.PatientID,
    p.FullName AS PatientName,
    p.ContactNumber,
    b.BillID,
    b.AppointmentID,
    b.Amount,
    b.PaymentDate,
    b.CreatedAt AS BillCreatedAt,
    ps.StatusName AS PaymentStatus,
    d.FullName AS DoctorName,
    d.Specialization AS DoctorSpecialization,
    a.AppointmentDate,
    a.TimeSlot,
    ast.StatusName AS AppointmentStatus,
    CASE 
        WHEN a.AppointmentStatusID = 2 AND b.PaymentStatusID = 1 THEN 'Due'
        WHEN b.PaymentStatusID = 2 THEN 'Paid'
        WHEN a.AppointmentStatusID IN (1, 4) THEN 'Pending Appointment'
        WHEN a.AppointmentStatusID = 3 THEN 'Missed'
        WHEN a.AppointmentStatusID = 5 THEN 'Cancelled'
        ELSE 'Unknown'
    END AS BillStatus,
    CASE 
        WHEN a.AppointmentStatusID = 2 AND b.PaymentStatusID = 1 THEN 1
        ELSE 0
    END AS IsPaymentDue
FROM Billing b
JOIN PaymentStatuses ps ON b.PaymentStatusID = ps.StatusID
JOIN Appointments a ON b.AppointmentID = a.AppointmentID
JOIN AppointmentStatuses ast ON a.AppointmentStatusID = ast.StatusID
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID;

-- ========================================
-- VIEW 14: Billing Statistics Summary
-- ========================================
CREATE VIEW vw_BillingStats AS
SELECT 
    (SELECT COUNT(*) FROM Billing) AS TotalBills,
    (SELECT COUNT(*) FROM Billing WHERE PaymentStatusID = 1) AS PendingBills,
    (SELECT COUNT(*) FROM Billing WHERE PaymentStatusID = 2) AS PaidBills,
    (SELECT COALESCE(SUM(Amount), 0) FROM Billing WHERE PaymentStatusID = 1) AS PendingAmount,
    (SELECT COALESCE(SUM(Amount), 0) FROM Billing WHERE PaymentStatusID = 2) AS PaidAmount,
    (SELECT COALESCE(SUM(Amount), 0) FROM Billing) AS TotalAmount,
    (SELECT COUNT(*) FROM vw_PendingBills) AS OverdueBills,
    (SELECT COALESCE(SUM(Amount), 0) FROM vw_PendingBills WHERE DaysOverdue > 0) AS OverdueAmount;

-- ========================================
-- VIEW 15: Daily Revenue Summary
-- ========================================
CREATE VIEW vw_DailyRevenue AS
SELECT 
    CAST(b.PaymentDate AS DATE) AS PaymentDate,
    COUNT(*) AS PaymentsCount,
    SUM(b.Amount) AS DailyRevenue,
    AVG(b.Amount) AS AveragePayment,
    MIN(b.Amount) AS MinPayment,
    MAX(b.Amount) AS MaxPayment
FROM Billing b
WHERE b.PaymentStatusID = 2  -- Paid bills only
AND b.PaymentDate IS NOT NULL
GROUP BY CAST(b.PaymentDate AS DATE);

PRINT 'Billing views created successfully!';
PRINT 'Added 5 specialized billing views for comprehensive billing management';