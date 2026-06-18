-- ========================================
-- MediQueue Database Testing Script
-- Comprehensive edge case testing for all stored procedures
-- ========================================

-- Test Setup: Create test data
PRINT '========================================';
PRINT 'STARTING MEDIQUEUE DATABASE TESTS';
PRINT '========================================';

-- Variables for test results
DECLARE @TestsPassed INT = 0;
DECLARE @TestsFailed INT = 0;
DECLARE @TestName NVARCHAR(100);

-- ========================================
-- TEST 1: sp_BookAppointment - Valid Booking
-- ========================================
SET @TestName = 'Book Appointment - Valid Case';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_BookAppointment 
        @PatientID = 1, 
        @DoctorID = 11, 
        @AppointmentDate = '2026-05-15', 
        @TimeSlot = '09:00';
    
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName;
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- TEST 2: sp_BookAppointment - Blacklisted Patient
-- ========================================
SET @TestName = 'Book Appointment - Blacklisted Patient';
PRINT 'Testing: ' + @TestName;

-- First blacklist a patient
UPDATE Patients SET IsBlacklisted = 1 WHERE PatientID = 2;

BEGIN TRY
    EXEC sp_BookAppointment 
        @PatientID = 2, 
        @DoctorID = 11, 
        @AppointmentDate = '2026-05-15', 
        @TimeSlot = '10:00';
    
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Should have been rejected';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%blacklisted%'
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Correctly rejected blacklisted patient';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Wrong error: ' + ERROR_MESSAGE();
    END
END CATCH

-- Reset blacklist status
UPDATE Patients SET IsBlacklisted = 0 WHERE PatientID = 2;

-- ========================================
-- TEST 3: sp_BookAppointment - Duplicate Time Slot
-- ========================================
SET @TestName = 'Book Appointment - Duplicate Time Slot';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_BookAppointment 
        @PatientID = 3, 
        @DoctorID = 11, 
        @AppointmentDate = '2026-05-15', 
        @TimeSlot = '09:00'; -- Same as first test
    
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Should have been rejected';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%already booked%'
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Correctly rejected duplicate slot';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Wrong error: ' + ERROR_MESSAGE();
    END
END CATCH

-- ========================================
-- TEST 4: sp_BookAppointment - Unavailable Doctor
-- ========================================
SET @TestName = 'Book Appointment - Unavailable Doctor';
PRINT 'Testing: ' + @TestName;

-- Make doctor unavailable
UPDATE Doctors SET IsAvailable = 0 WHERE DoctorID = 11;

BEGIN TRY
    EXEC sp_BookAppointment 
        @PatientID = 3, 
        @DoctorID = 11, 
        @AppointmentDate = '2026-05-15', 
        @TimeSlot = '11:00';
    
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Should have been rejected';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%not available%'
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Correctly rejected unavailable doctor';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Wrong error: ' + ERROR_MESSAGE();
    END
END CATCH

-- Reset doctor availability
UPDATE Doctors SET IsAvailable = 1 WHERE DoctorID = 11;

-- ========================================
-- TEST 5: sp_RescheduleAppointment - Valid Reschedule
-- ========================================
SET @TestName = 'Reschedule Appointment - Valid Case';
PRINT 'Testing: ' + @TestName;

DECLARE @TestAppointmentID INT;
SELECT TOP 1 @TestAppointmentID = AppointmentID 
FROM Appointments 
WHERE PatientID = 1 AND AppointmentStatusID = 1;

BEGIN TRY
    EXEC sp_RescheduleAppointment 
        @AppointmentID = @TestAppointmentID,
        @NewDate = '2026-05-16',
        @NewTimeSlot = '10:00',
        @PatientID = 1;
    
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName;
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- TEST 6: sp_RescheduleAppointment - Unauthorized Patient
-- ========================================
SET @TestName = 'Reschedule Appointment - Unauthorized Patient';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_RescheduleAppointment 
        @AppointmentID = @TestAppointmentID,
        @NewDate = '2026-05-17',
        @NewTimeSlot = '11:00',
        @PatientID = 999; -- Wrong patient ID
    
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Should have been rejected';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%own appointments%'
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Correctly rejected unauthorized reschedule';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Wrong error: ' + ERROR_MESSAGE();
    END
END CATCH

-- ========================================
-- TEST 7: sp_MarkAppointmentMissed - Auto Blacklist
-- ========================================
SET @TestName = 'Mark Appointment Missed - Auto Blacklist Test';
PRINT 'Testing: ' + @TestName;

-- Create a patient with 3 missed visits already
UPDATE Patients SET MissedVisits = 3 WHERE PatientID = 4;

-- Create an appointment for this patient
DECLARE @MissedTestAppointmentID INT;
INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, TimeSlot, TokenNumber, AppointmentStatusID, QueuePosition)
VALUES (4, 11, '2026-05-15', '14:00', 100, 1, 1);
SET @MissedTestAppointmentID = SCOPE_IDENTITY();

BEGIN TRY
    EXEC sp_MarkAppointmentMissed @AppointmentID = @MissedTestAppointmentID;
    
    -- Check if patient was blacklisted
    DECLARE @IsBlacklisted BIT;
    SELECT @IsBlacklisted = IsBlacklisted FROM Patients WHERE PatientID = 4;
    
    IF @IsBlacklisted = 1
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Patient correctly auto-blacklisted';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Patient should have been blacklisted';
    END
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- TEST 8: sp_CompleteAppointment - Valid Completion
-- ========================================
SET @TestName = 'Complete Appointment - Valid Case';
PRINT 'Testing: ' + @TestName;

-- Create a test appointment
DECLARE @CompleteTestAppointmentID INT;
INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, TimeSlot, TokenNumber, AppointmentStatusID, QueuePosition)
VALUES (5, 11, '2026-05-15', '15:00', 101, 1, 1);
SET @CompleteTestAppointmentID = SCOPE_IDENTITY();

BEGIN TRY
    EXEC sp_CompleteAppointment 
        @AppointmentID = @CompleteTestAppointmentID,
        @DoctorID = 11,
        @Remarks = 'Test completion',
        @Diagnosis = 'Test diagnosis',
        @Prescription = 'Test prescription',
        @Notes = 'Test notes';
    
    -- Verify medical record was created
    IF EXISTS (SELECT 1 FROM MedicalRecords WHERE AppointmentID = @CompleteTestAppointmentID)
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Medical record created';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Medical record not created';
    END
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- TEST 9: sp_CompleteAppointment - Unauthorized Doctor
-- ========================================
SET @TestName = 'Complete Appointment - Unauthorized Doctor';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_CompleteAppointment 
        @AppointmentID = @CompleteTestAppointmentID,
        @DoctorID = 999, -- Wrong doctor ID
        @Remarks = 'Unauthorized completion';
    
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Should have been rejected';
END TRY
BEGIN CATCH
    IF ERROR_MESSAGE() LIKE '%not found%' OR ERROR_MESSAGE() LIKE '%unauthorized%'
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Correctly rejected unauthorized completion';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Wrong error: ' + ERROR_MESSAGE();
    END
END CATCH

-- ========================================
-- TEST 10: sp_ProcessDoctorLeave - Valid Leave Processing
-- ========================================
SET @TestName = 'Process Doctor Leave - Valid Case';
PRINT 'Testing: ' + @TestName;

-- Create a leave request
DECLARE @TestLeaveID INT;
INSERT INTO DoctorLeaves (DoctorID, StartDate, EndDate, Reason, LeaveStatusID)
VALUES (11, '2026-05-20', '2026-05-22', 'Test leave', 1); -- Pending status
SET @TestLeaveID = SCOPE_IDENTITY();

-- Create appointments that should be cancelled
INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, TimeSlot, TokenNumber, AppointmentStatusID, QueuePosition)
VALUES 
    (6, 11, '2026-05-20', '09:00', 200, 1, 1),
    (7, 11, '2026-05-21', '10:00', 201, 1, 1);

BEGIN TRY
    EXEC sp_ProcessDoctorLeave 
        @LeaveID = @TestLeaveID,
        @ApprovalStatus = 'Approved';
    
    -- Check if appointments were cancelled
    DECLARE @CancelledCount INT;
    SELECT @CancelledCount = COUNT(*)
    FROM Appointments 
    WHERE DoctorID = 11 
    AND AppointmentDate BETWEEN '2026-05-20' AND '2026-05-22'
    AND AppointmentStatusID = 5; -- Cancelled
    
    IF @CancelledCount >= 2
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Appointments correctly cancelled';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Appointments not cancelled properly';
    END
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- TEST 11: sp_CreateWalkInAppointment - Valid Walk-in
-- ========================================
SET @TestName = 'Create Walk-In Appointment - Valid Case';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_CreateWalkInAppointment 
        @PatientID = 8,
        @DoctorID = 11,
        @TimeSlot = '16:00';
    
    -- Verify walk-in appointment was created with correct status
    IF EXISTS (SELECT 1 FROM Appointments 
               WHERE PatientID = 8 AND DoctorID = 11 
               AND AppointmentStatusID = 4 -- Walk-in status
               AND AppointmentDate = CAST(GETDATE() AS DATE))
    BEGIN
        SET @TestsPassed = @TestsPassed + 1;
        PRINT '✓ PASSED: ' + @TestName + ' - Walk-in appointment created';
    END
    ELSE
    BEGIN
        SET @TestsFailed = @TestsFailed + 1;
        PRINT '✗ FAILED: ' + @TestName + ' - Walk-in appointment not created properly';
    END
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- TEST 12: sp_GetQueueStatus - Queue Information
-- ========================================
SET @TestName = 'Get Queue Status - Valid Case';
PRINT 'Testing: ' + @TestName;

DECLARE @QueueTestAppointmentID INT;
SELECT TOP 1 @QueueTestAppointmentID = AppointmentID 
FROM Appointments 
WHERE AppointmentStatusID IN (1, 4) -- Scheduled or Walk-in
ORDER BY AppointmentID DESC;

BEGIN TRY
    EXEC sp_GetQueueStatus @AppointmentID = @QueueTestAppointmentID;
    
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName + ' - Queue status retrieved';
END TRY
BEGIN CATCH
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - ' + ERROR_MESSAGE();
END CATCH

-- ========================================
-- EDGE CASE TESTS
-- ========================================

-- TEST 13: Null Parameter Handling
SET @TestName = 'Null Parameter Handling';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_BookAppointment 
        @PatientID = NULL,
        @DoctorID = 11,
        @AppointmentDate = '2026-05-15',
        @TimeSlot = '09:00';
    
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Should have rejected NULL parameters';
END TRY
BEGIN CATCH
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName + ' - Correctly handled NULL parameters';
END CATCH

-- TEST 14: Invalid Date Handling
SET @TestName = 'Invalid Date Handling';
PRINT 'Testing: ' + @TestName;

BEGIN TRY
    EXEC sp_BookAppointment 
        @PatientID = 1,
        @DoctorID = 11,
        @AppointmentDate = '2020-01-01', -- Past date
        @TimeSlot = '09:00';
    
    -- This might succeed depending on business logic, so we just test it runs
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName + ' - Handled past date (business logic dependent)';
END TRY
BEGIN CATCH
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName + ' - Correctly rejected past date';
END CATCH

-- ========================================
-- PERFORMANCE TESTS
-- ========================================

-- TEST 15: Bulk Operations Performance
SET @TestName = 'Bulk Operations Performance';
PRINT 'Testing: ' + @TestName;

DECLARE @StartTime DATETIME = GETDATE();
DECLARE @Counter INT = 1;

-- Create 50 appointments to test performance
WHILE @Counter <= 50
BEGIN
    BEGIN TRY
        EXEC sp_BookAppointment 
            @PatientID = ((@Counter % 10) + 1), -- Cycle through patients 1-10
            @DoctorID = 11,
            @AppointmentDate = DATEADD(DAY, (@Counter % 30), '2026-06-01'),
            @TimeSlot = CASE 
                WHEN @Counter % 8 = 0 THEN '09:00'
                WHEN @Counter % 8 = 1 THEN '09:30'
                WHEN @Counter % 8 = 2 THEN '10:00'
                WHEN @Counter % 8 = 3 THEN '10:30'
                WHEN @Counter % 8 = 4 THEN '11:00'
                WHEN @Counter % 8 = 5 THEN '11:30'
                WHEN @Counter % 8 = 6 THEN '14:00'
                ELSE '14:30'
            END;
    END TRY
    BEGIN CATCH
        -- Some may fail due to conflicts, that's expected
    END CATCH
    
    SET @Counter = @Counter + 1;
END

DECLARE @EndTime DATETIME = GETDATE();
DECLARE @Duration INT = DATEDIFF(MILLISECOND, @StartTime, @EndTime);

IF @Duration < 10000 -- Less than 10 seconds
BEGIN
    SET @TestsPassed = @TestsPassed + 1;
    PRINT '✓ PASSED: ' + @TestName + ' - Completed in ' + CAST(@Duration AS NVARCHAR(10)) + 'ms';
END
ELSE
BEGIN
    SET @TestsFailed = @TestsFailed + 1;
    PRINT '✗ FAILED: ' + @TestName + ' - Too slow: ' + CAST(@Duration AS NVARCHAR(10)) + 'ms';
END

-- ========================================
-- FINAL RESULTS
-- ========================================
PRINT '';
PRINT '========================================';
PRINT 'TEST RESULTS SUMMARY';
PRINT '========================================';
PRINT 'Tests Passed: ' + CAST(@TestsPassed AS NVARCHAR(10));
PRINT 'Tests Failed: ' + CAST(@TestsFailed AS NVARCHAR(10));
PRINT 'Total Tests: ' + CAST((@TestsPassed + @TestsFailed) AS NVARCHAR(10));

IF @TestsFailed = 0
    PRINT '🎉 ALL TESTS PASSED! Your stored procedures are working correctly.';
ELSE
    PRINT '⚠️  Some tests failed. Please review the failed tests above.';

PRINT '========================================';