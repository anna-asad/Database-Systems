-- ========================================
-- MediQueue Stored Procedures
-- Critical business logic procedures for enhanced data consistency and performance
-- ========================================

-- ========================================
-- STORED PROCEDURE 1: Book Appointment with Queue Management
-- ========================================
CREATE PROCEDURE sp_BookAppointment
    @PatientID INT,
    @DoctorID INT,
    @AppointmentDate DATE,
    @TimeSlot TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TokenNumber INT;
    DECLARE @QueuePosition INT;
    DECLARE @IsBlacklisted BIT;
    DECLARE @ConsultationFee DECIMAL(10,2);
    DECLARE @AppointmentID INT;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check if patient is blacklisted
        SELECT @IsBlacklisted = IsBlacklisted 
        FROM Patients 
        WHERE PatientID = @PatientID;
        
        IF @IsBlacklisted = 1
        BEGIN
            RAISERROR('Cannot book appointment: Patient is blacklisted. Contact admin.', 16, 1);
            RETURN;
        END
        
        -- Check if doctor exists and is available
        IF NOT EXISTS (SELECT 1 FROM Doctors WHERE DoctorID = @DoctorID AND IsAvailable = 1)
        BEGIN
            RAISERROR('Doctor is not available for appointments.', 16, 1);
            RETURN;
        END
        
        -- Check for duplicate time slot booking
        IF EXISTS (SELECT 1 FROM Appointments 
                   WHERE DoctorID = @DoctorID 
                   AND AppointmentDate = @AppointmentDate 
                   AND TimeSlot = @TimeSlot 
                   AND AppointmentStatusID IN (1, 4)) -- Scheduled or Walk-in
        BEGIN
            RAISERROR('This time slot is already booked for this doctor.', 16, 1);
            RETURN;
        END
        
        -- Generate token number (next available for that doctor/date)
        SELECT @TokenNumber = COALESCE(MAX(TokenNumber), 0) + 1 
        FROM Appointments 
        WHERE DoctorID = @DoctorID AND AppointmentDate = @AppointmentDate;
        
        -- Calculate queue position (count of active appointments + 1)
        SELECT @QueuePosition = COUNT(*) + 1 
        FROM Appointments 
        WHERE DoctorID = @DoctorID 
        AND AppointmentDate = @AppointmentDate 
        AND AppointmentStatusID IN (1, 4); -- Scheduled or Walk-in
        
        -- Get doctor's consultation fee
        SELECT @ConsultationFee = ConsultationFee 
        FROM Doctors 
        WHERE DoctorID = @DoctorID;
        
        -- Insert appointment
        INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, TimeSlot, 
                                 TokenNumber, AppointmentStatusID, QueuePosition)
        VALUES (@PatientID, @DoctorID, @AppointmentDate, @TimeSlot, 
                @TokenNumber, 1, @QueuePosition); -- Status 1 = Scheduled
        
        SET @AppointmentID = SCOPE_IDENTITY();
        
        -- Create billing record
        INSERT INTO Billing (AppointmentID, Amount, PaymentStatusID)
        VALUES (@AppointmentID, @ConsultationFee, 1); -- Status 1 = Pending
        
        -- Create notification for patient
        INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
        VALUES (@PatientID, 'Appointment Booked', 
                CONCAT('Your appointment with doctor on ', FORMAT(@AppointmentDate, 'yyyy-MM-dd'), 
                       ' at ', FORMAT(@TimeSlot, 'HH:mm'), ' has been confirmed. Token: ', @TokenNumber), 
                'Appointment', @AppointmentID);
        
        COMMIT TRANSACTION;
        
        -- Return appointment details
        SELECT 
            @AppointmentID AS AppointmentID,
            @TokenNumber AS TokenNumber,
            @QueuePosition AS QueuePosition,
            @ConsultationFee AS Amount,
            'Appointment booked successfully' AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- ========================================
-- STORED PROCEDURE 2: Reschedule Appointment with Queue Management
-- ========================================
CREATE PROCEDURE sp_RescheduleAppointment
    @AppointmentID INT,
    @NewDate DATE,
    @NewTimeSlot TIME,
    @PatientID INT = NULL -- Optional for authorization check
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @OldDoctorID INT;
    DECLARE @OldDate DATE;
    DECLARE @NewTokenNumber INT;
    DECLARE @NewQueuePosition INT;
    DECLARE @CurrentPatientID INT;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get current appointment details
        SELECT @CurrentPatientID = PatientID, @OldDoctorID = DoctorID, @OldDate = AppointmentDate
        FROM Appointments 
        WHERE AppointmentID = @AppointmentID;
        
        IF @CurrentPatientID IS NULL
        BEGIN
            RAISERROR('Appointment not found.', 16, 1);
            RETURN;
        END
        
        -- Authorization check (if PatientID provided)
        IF @PatientID IS NOT NULL AND @CurrentPatientID != @PatientID
        BEGIN
            RAISERROR('You can only reschedule your own appointments.', 16, 1);
            RETURN;
        END
        
        -- Check if new time slot is available
        IF EXISTS (SELECT 1 FROM Appointments 
                   WHERE DoctorID = @OldDoctorID 
                   AND AppointmentDate = @NewDate 
                   AND TimeSlot = @NewTimeSlot 
                   AND AppointmentStatusID IN (1, 4)
                   AND AppointmentID != @AppointmentID)
        BEGIN
            RAISERROR('The new time slot is already booked.', 16, 1);
            RETURN;
        END
        
        -- Generate new token number
        SELECT @NewTokenNumber = COALESCE(MAX(TokenNumber), 0) + 1 
        FROM Appointments 
        WHERE DoctorID = @OldDoctorID AND AppointmentDate = @NewDate;
        
        -- Calculate new queue position
        SELECT @NewQueuePosition = COUNT(*) + 1 
        FROM Appointments 
        WHERE DoctorID = @OldDoctorID 
        AND AppointmentDate = @NewDate 
        AND AppointmentStatusID IN (1, 4)
        AND AppointmentID != @AppointmentID;
        
        -- Update appointment
        UPDATE Appointments 
        SET AppointmentDate = @NewDate,
            TimeSlot = @NewTimeSlot,
            TokenNumber = @NewTokenNumber,
            QueuePosition = @NewQueuePosition
        WHERE AppointmentID = @AppointmentID;
        
        -- Recalculate queue positions for old date (if different)
        IF @OldDate != @NewDate
        BEGIN
            WITH RankedAppointments AS (
                SELECT AppointmentID, 
                       ROW_NUMBER() OVER (ORDER BY TokenNumber) as NewPosition
                FROM Appointments
                WHERE DoctorID = @OldDoctorID 
                AND AppointmentDate = @OldDate
                AND AppointmentStatusID IN (1, 4)
            )
            UPDATE a
            SET QueuePosition = ra.NewPosition
            FROM Appointments a
            INNER JOIN RankedAppointments ra ON a.AppointmentID = ra.AppointmentID;
        END
        
        -- Recalculate queue positions for new date
        WITH RankedAppointments AS (
            SELECT AppointmentID, 
                   ROW_NUMBER() OVER (ORDER BY TokenNumber) as NewPosition
            FROM Appointments
            WHERE DoctorID = @OldDoctorID 
            AND AppointmentDate = @NewDate
            AND AppointmentStatusID IN (1, 4)
        )
        UPDATE a
        SET QueuePosition = ra.NewPosition
        FROM Appointments a
        INNER JOIN RankedAppointments ra ON a.AppointmentID = ra.AppointmentID;
        
        -- Create notification
        INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
        VALUES (@CurrentPatientID, 'Appointment Rescheduled', 
                CONCAT('Your appointment has been rescheduled to ', FORMAT(@NewDate, 'yyyy-MM-dd'), 
                       ' at ', FORMAT(@NewTimeSlot, 'HH:mm'), '. New token: ', @NewTokenNumber), 
                'Appointment', @AppointmentID);
        
        COMMIT TRANSACTION;
        
        -- Return results
        SELECT 
            @AppointmentID AS AppointmentID,
            @NewTokenNumber AS NewTokenNumber,
            @NewQueuePosition AS NewQueuePosition,
            'Appointment rescheduled successfully' AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- ========================================
-- STORED PROCEDURE 3: Process Doctor Leave with Appointment Cancellation
-- ========================================
CREATE PROCEDURE sp_ProcessDoctorLeave
    @LeaveID INT,
    @ApprovalStatus NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StatusID INT;
    DECLARE @DoctorID INT;
    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;
    DECLARE @DoctorName NVARCHAR(100);
    DECLARE @CancelledCount INT = 0;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get status ID
        SELECT @StatusID = StatusID 
        FROM LeaveStatuses 
        WHERE LOWER(StatusName) = LOWER(TRIM(@ApprovalStatus));
        
        IF @StatusID IS NULL
        BEGIN
            RAISERROR('Invalid leave status.', 16, 1);
            RETURN;
        END
        
        -- Update leave status
        UPDATE DoctorLeaves 
        SET LeaveStatusID = @StatusID 
        WHERE LeaveID = @LeaveID;
        
        -- Get leave details
        SELECT @DoctorID = dl.DoctorID, 
               @StartDate = dl.StartDate, 
               @EndDate = dl.EndDate,
               @DoctorName = d.FullName
        FROM DoctorLeaves dl
        JOIN Doctors d ON dl.DoctorID = d.DoctorID
        WHERE dl.LeaveID = @LeaveID;
        
        -- If leave is approved, cancel affected appointments
        IF LOWER(TRIM(@ApprovalStatus)) = 'approved'
        BEGIN
            -- Cancel appointments and count them
            UPDATE Appointments 
            SET AppointmentStatusID = 5, -- Cancelled
                QueuePosition = NULL
            WHERE DoctorID = @DoctorID 
            AND AppointmentDate BETWEEN @StartDate AND @EndDate
            AND AppointmentStatusID IN (1, 4); -- Scheduled or Walk-in
            
            SET @CancelledCount = @@ROWCOUNT;
            
            -- Create notifications for affected patients
            INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
            SELECT 
                a.PatientID,
                'Appointment Cancelled - Doctor Leave',
                CONCAT('Your appointment with Dr. ', @DoctorName, ' on ', 
                       FORMAT(a.AppointmentDate, 'yyyy-MM-dd'), ' at ', 
                       FORMAT(a.TimeSlot, 'HH:mm'), 
                       ' has been cancelled due to doctor leave. Please reschedule.'),
                'Leave',
                @LeaveID
            FROM Appointments a
            WHERE a.DoctorID = @DoctorID 
            AND a.AppointmentDate BETWEEN @StartDate AND @EndDate
            AND a.AppointmentStatusID = 5; -- Just cancelled
            
            -- Notify doctor
            INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
            VALUES (@DoctorID, 'Leave Approved', 
                    CONCAT('Your leave from ', FORMAT(@StartDate, 'yyyy-MM-dd'), 
                           ' to ', FORMAT(@EndDate, 'yyyy-MM-dd'), 
                           ' has been approved. ', @CancelledCount, ' appointments were cancelled.'),
                    'Leave', @LeaveID);
        END
        ELSE
        BEGIN
            -- Notify doctor of rejection/other status
            INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
            VALUES (@DoctorID, 'Leave Status Updated', 
                    CONCAT('Your leave request status has been updated to: ', @ApprovalStatus),
                    'Leave', @LeaveID);
        END
        
        COMMIT TRANSACTION;
        
        -- Return results
        SELECT 
            @LeaveID AS LeaveID,
            @ApprovalStatus AS Status,
            @CancelledCount AS CancelledAppointments,
            @DoctorName AS DoctorName,
            'Leave processed successfully' AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- ========================================
-- STORED PROCEDURE 4: Mark Appointment as Missed with Auto-Blacklist
-- ========================================
CREATE PROCEDURE sp_MarkAppointmentMissed
    @AppointmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PatientID INT;
    DECLARE @DoctorID INT;
    DECLARE @AppointmentDate DATE;
    DECLARE @MissedVisits INT;
    DECLARE @WasBlacklisted BIT = 0;
    DECLARE @PatientName NVARCHAR(100);
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get appointment details
        SELECT @PatientID = PatientID, @DoctorID = DoctorID, @AppointmentDate = AppointmentDate
        FROM Appointments 
        WHERE AppointmentID = @AppointmentID;
        
        IF @PatientID IS NULL
        BEGIN
            RAISERROR('Appointment not found.', 16, 1);
            RETURN;
        END
        
        -- Mark appointment as missed (status 3)
        UPDATE Appointments 
        SET AppointmentStatusID = 3, 
            QueuePosition = NULL
        WHERE AppointmentID = @AppointmentID;
        
        -- Update patient visit statistics
        UPDATE Patients 
        SET MissedVisits = MissedVisits + 1,
            TotalVisits = TotalVisits + 1
        WHERE PatientID = @PatientID;
        
        -- Get updated missed visits count and patient name
        SELECT @MissedVisits = MissedVisits, @PatientName = FullName
        FROM Patients 
        WHERE PatientID = @PatientID;
        
        -- Auto-blacklist if missed visits > 3
        IF @MissedVisits > 3
        BEGIN
            UPDATE Patients 
            SET IsBlacklisted = 1 
            WHERE PatientID = @PatientID AND IsBlacklisted = 0;
            
            IF @@ROWCOUNT > 0
            BEGIN
                SET @WasBlacklisted = 1;
                
                -- Notify patient of blacklist
                INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
                VALUES (@PatientID, 'Account Blacklisted', 
                        CONCAT('Your account has been blacklisted due to ', @MissedVisits, 
                               ' missed appointments. Contact admin to resolve.'),
                        'Blacklist', @PatientID);
                
                -- Cancel all future appointments for blacklisted patient
                UPDATE Appointments 
                SET AppointmentStatusID = 5, -- Cancelled
                    QueuePosition = NULL
                WHERE PatientID = @PatientID 
                AND AppointmentDate > GETDATE()
                AND AppointmentStatusID IN (1, 4); -- Scheduled or Walk-in
            END
        END
        ELSE
        BEGIN
            -- Just notify about missed appointment
            INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
            VALUES (@PatientID, 'Missed Appointment', 
                    CONCAT('You missed your appointment on ', FORMAT(@AppointmentDate, 'yyyy-MM-dd'), 
                           '. Total missed: ', @MissedVisits, '. Please be punctual for future appointments.'),
                    'Appointment', @AppointmentID);
        END
        
        -- Recalculate queue positions for remaining appointments on that date
        WITH RankedAppointments AS (
            SELECT AppointmentID, 
                   ROW_NUMBER() OVER (ORDER BY TokenNumber) as NewPosition
            FROM Appointments
            WHERE DoctorID = @DoctorID 
            AND AppointmentDate = @AppointmentDate
            AND AppointmentStatusID IN (1, 4)
        )
        UPDATE a
        SET QueuePosition = ra.NewPosition
        FROM Appointments a
        INNER JOIN RankedAppointments ra ON a.AppointmentID = ra.AppointmentID;
        
        COMMIT TRANSACTION;
        
        -- Return results
        SELECT 
            @AppointmentID AS AppointmentID,
            @PatientID AS PatientID,
            @PatientName AS PatientName,
            @MissedVisits AS MissedVisitCount,
            @WasBlacklisted AS WasBlacklisted,
            'Appointment marked as missed' AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- ========================================
-- STORED PROCEDURE 5: Complete Appointment with Medical Record
-- ========================================
CREATE PROCEDURE sp_CompleteAppointment
    @AppointmentID INT,
    @DoctorID INT,
    @Remarks NVARCHAR(500) = NULL,
    @Diagnosis NVARCHAR(500) = NULL,
    @Prescription NVARCHAR(1000) = NULL,
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PatientID INT;
    DECLARE @AppointmentDate DATE;
    DECLARE @RecordID INT = NULL;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Verify appointment belongs to doctor and get details
        SELECT @PatientID = PatientID, @AppointmentDate = AppointmentDate
        FROM Appointments 
        WHERE AppointmentID = @AppointmentID AND DoctorID = @DoctorID;
        
        IF @PatientID IS NULL
        BEGIN
            RAISERROR('Appointment not found or unauthorized.', 16, 1);
            RETURN;
        END
        
        -- Mark appointment as completed (status 2)
        UPDATE Appointments 
        SET AppointmentStatusID = 2, 
            DoctorRemarks = @Remarks,
            QueuePosition = NULL
        WHERE AppointmentID = @AppointmentID;
        
        -- Create medical record if diagnosis provided
        IF @Diagnosis IS NOT NULL
        BEGIN
            INSERT INTO MedicalRecords (AppointmentID, PatientID, DoctorID, Diagnosis, Prescription, Notes, CreatedAt)
            VALUES (@AppointmentID, @PatientID, @DoctorID, @Diagnosis, @Prescription, @Notes, GETDATE());
            
            SET @RecordID = SCOPE_IDENTITY();
        END
        
        -- Update patient visit statistics (successful visit)
        UPDATE Patients 
        SET SuccessfulVisits = SuccessfulVisits + 1,
            TotalVisits = TotalVisits + 1
        WHERE PatientID = @PatientID;
        
        -- Recalculate queue positions for remaining appointments
        WITH RankedAppointments AS (
            SELECT AppointmentID, 
                   ROW_NUMBER() OVER (ORDER BY TokenNumber) as NewPosition
            FROM Appointments
            WHERE DoctorID = @DoctorID 
            AND AppointmentDate = @AppointmentDate
            AND AppointmentStatusID IN (1, 4) -- Scheduled or Walk-in
        )
        UPDATE a
        SET QueuePosition = ra.NewPosition
        FROM Appointments a
        INNER JOIN RankedAppointments ra ON a.AppointmentID = ra.AppointmentID;
        
        -- Create notification for patient
        INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
        VALUES (@PatientID, 'Appointment Completed', 
                CONCAT('Your appointment on ', FORMAT(@AppointmentDate, 'yyyy-MM-dd'), 
                       ' has been completed. ', 
                       CASE WHEN @RecordID IS NOT NULL THEN 'Medical record created.' ELSE '' END),
                'Appointment', @AppointmentID);
        
        COMMIT TRANSACTION;
        
        -- Return results
        SELECT 
            @AppointmentID AS AppointmentID,
            @PatientID AS PatientID,
            @RecordID AS MedicalRecordID,
            'Appointment completed successfully' AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- ========================================
-- UTILITY PROCEDURES
-- ========================================

-- Procedure to get queue status for a specific appointment
CREATE PROCEDURE sp_GetQueueStatus
    @AppointmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AppointmentID,
        a.TokenNumber,
        a.QueuePosition,
        a.AppointmentDate,
        a.TimeSlot,
        d.FullName AS DoctorName,
        p.FullName AS PatientName,
        ast.StatusName AS AppointmentStatus,
        -- Current token being served
        (SELECT MAX(TokenNumber) 
         FROM Appointments 
         WHERE DoctorID = a.DoctorID 
         AND AppointmentDate = a.AppointmentDate 
         AND AppointmentStatusID = 2) AS CurrentToken,
        -- Patients ahead in queue
        (SELECT COUNT(*) 
         FROM Appointments 
         WHERE DoctorID = a.DoctorID 
         AND AppointmentDate = a.AppointmentDate 
         AND QueuePosition < a.QueuePosition
         AND AppointmentStatusID IN (1, 4)) AS PatientsAhead,
        -- Estimated wait time (15 minutes per patient)
        (SELECT COUNT(*) * 15 
         FROM Appointments 
         WHERE DoctorID = a.DoctorID 
         AND AppointmentDate = a.AppointmentDate 
         AND QueuePosition < a.QueuePosition
         AND AppointmentStatusID IN (1, 4)) AS EstimatedWaitMinutes
    FROM Appointments a
    JOIN Doctors d ON a.DoctorID = d.DoctorID
    JOIN Patients p ON a.PatientID = p.PatientID
    JOIN AppointmentStatuses ast ON a.AppointmentStatusID = ast.StatusID
    WHERE a.AppointmentID = @AppointmentID;
END;
GO

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Index for queue management queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Queue_Management')
CREATE INDEX IX_Appointments_Queue_Management 
ON Appointments (DoctorID, AppointmentDate, AppointmentStatusID, TokenNumber);

-- Index for patient statistics
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Patient_Stats')
CREATE INDEX IX_Appointments_Patient_Stats 
ON Appointments (PatientID, AppointmentStatusID);

-- Index for doctor leave processing
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Appointments_Leave_Processing')
CREATE INDEX IX_Appointments_Leave_Processing 
ON Appointments (DoctorID, AppointmentDate, AppointmentStatusID);

PRINT 'MediQueue Stored Procedures created successfully!';
PRINT 'Created 5 main procedures + 1 utility procedure + performance indexes';

-- ========================================
-- STORED PROCEDURE 6: Create Walk-In Appointment
-- ========================================
CREATE PROCEDURE sp_CreateWalkInAppointment
    @PatientID INT,
    @DoctorID INT,
    @TimeSlot TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TokenNumber INT;
    DECLARE @QueuePosition INT;
    DECLARE @IsBlacklisted BIT;
    DECLARE @ConsultationFee DECIMAL(10,2);
    DECLARE @AppointmentID INT;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check if patient is blacklisted
        SELECT @IsBlacklisted = IsBlacklisted 
        FROM Patients 
        WHERE PatientID = @PatientID;
        
        IF @IsBlacklisted = 1
        BEGIN
            RAISERROR('Cannot create walk-in appointment: Patient is blacklisted. Contact admin.', 16, 1);
            RETURN;
        END
        
        -- Check if doctor exists and is available
        IF NOT EXISTS (SELECT 1 FROM Doctors WHERE DoctorID = @DoctorID AND IsAvailable = 1)
        BEGIN
            RAISERROR('Doctor is not available for walk-in appointments.', 16, 1);
            RETURN;
        END
        
        -- Generate token number (next available for that doctor/today)
        SELECT @TokenNumber = COALESCE(MAX(TokenNumber), 0) + 1 
        FROM Appointments 
        WHERE DoctorID = @DoctorID AND AppointmentDate = @Today;
        
        -- Calculate queue position (count of active appointments + 1)
        SELECT @QueuePosition = COUNT(*) + 1 
        FROM Appointments 
        WHERE DoctorID = @DoctorID 
        AND AppointmentDate = @Today 
        AND AppointmentStatusID IN (1, 4); -- Scheduled or Walk-in
        
        -- Get doctor's consultation fee
        SELECT @ConsultationFee = ConsultationFee 
        FROM Doctors 
        WHERE DoctorID = @DoctorID;
        
        -- Insert walk-in appointment (status 4 = Walk-in)
        INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, TimeSlot, 
                                 TokenNumber, AppointmentStatusID, QueuePosition)
        VALUES (@PatientID, @DoctorID, @Today, @TimeSlot, 
                @TokenNumber, 4, @QueuePosition);
        
        SET @AppointmentID = SCOPE_IDENTITY();
        
        -- Create billing record
        INSERT INTO Billing (AppointmentID, Amount, PaymentStatusID)
        VALUES (@AppointmentID, @ConsultationFee, 1); -- Status 1 = Pending
        
        -- Create notification for patient
        INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID)
        VALUES (@PatientID, 'Walk-In Appointment Created', 
                CONCAT('Your walk-in appointment has been registered. Token: ', @TokenNumber, 
                       ', Queue Position: ', @QueuePosition), 
                'Appointment', @AppointmentID);
        
        COMMIT TRANSACTION;
        
        -- Return appointment details
        SELECT 
            @AppointmentID AS AppointmentID,
            @TokenNumber AS TokenNumber,
            @QueuePosition AS QueuePosition,
            'Walk-in appointment created successfully' AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Walk-in appointment stored procedure added successfully!';
PRINT 'Total stored procedures: 6 main procedures + 1 utility procedure';