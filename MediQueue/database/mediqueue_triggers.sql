-- ========================================
-- MediQueue Active Triggers
-- Contains only the 6 ENABLED triggers currently in production
-- ========================================

USE MediQueue;
GO

-- ========================================
-- STEP 1: Create Audit Tables (Required for triggers)
-- ========================================

-- Audit table for appointment changes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog_Appointments')
BEGIN
    CREATE TABLE AuditLog_Appointments (
        AuditID INT PRIMARY KEY IDENTITY(1,1),
        AppointmentID INT,
        Action VARCHAR(50),  -- INSERT, UPDATE, DELETE
        OldStatus VARCHAR(50),
        NewStatus VARCHAR(50),
        ChangedBy VARCHAR(255),
        ChangedAt DATETIME DEFAULT GETDATE(),
        Details VARCHAR(500)
    );
    PRINT '✓ Created AuditLog_Appointments table';
END

-- Audit table for patient changes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog_Patients')
BEGIN
    CREATE TABLE AuditLog_Patients (
        AuditID INT PRIMARY KEY IDENTITY(1,1),
        PatientID INT,
        Action VARCHAR(50),  -- INSERT, UPDATE, DELETE
        FieldChanged VARCHAR(100),
        OldValue VARCHAR(255),
        NewValue VARCHAR(255),
        ChangedAt DATETIME DEFAULT GETDATE(),
        Details VARCHAR(500)
    );
    PRINT '✓ Created AuditLog_Patients table';
END

-- Audit table for doctor changes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog_Doctors')
BEGIN
    CREATE TABLE AuditLog_Doctors (
        AuditID INT PRIMARY KEY IDENTITY(1,1),
        DoctorID INT,
        Action VARCHAR(50),  -- INSERT, UPDATE, DELETE
        FieldChanged VARCHAR(100),
        OldValue VARCHAR(255),
        NewValue VARCHAR(255),
        ChangedAt DATETIME DEFAULT GETDATE(),
        Details VARCHAR(500)
    );
    PRINT '✓ Created AuditLog_Doctors table';
END

-- Audit table for general logs (used by critical triggers)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        AuditID INT PRIMARY KEY IDENTITY(1,1),
        TableName NVARCHAR(100) NOT NULL,
        RecordID INT NOT NULL,
        Action NVARCHAR(50) NOT NULL,
        OldValue NVARCHAR(MAX),
        NewValue NVARCHAR(MAX),
        ChangedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✓ Created AuditLog table';
END

GO

-- ========================================
-- TRIGGER 1: trg_Audit_AppointmentInsert 
-- Purpose: Log new appointment bookings
-- ========================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Audit_AppointmentInsert')
    DROP TRIGGER trg_Audit_AppointmentInsert;
GO

CREATE TRIGGER trg_Audit_AppointmentInsert
ON Appointments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO AuditLog_Appointments (AppointmentID, Action, NewStatus, Details)
    SELECT 
        i.AppointmentID,
        'INSERT',
        ast.StatusName,
        CONCAT('New appointment created - Token: ', i.TokenNumber, 
               ', Queue Position: ', i.QueuePosition)
    FROM inserted i
    LEFT JOIN AppointmentStatuses ast ON i.AppointmentStatusID = ast.StatusID;
END;
GO

PRINT '✓ Trigger 1 created: trg_Audit_AppointmentInsert';

-- ========================================
-- TRIGGER 2: trg_Audit_AppointmentUpdate 
-- Purpose: Log appointment status changes
-- ========================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Audit_AppointmentUpdate')
    DROP TRIGGER trg_Audit_AppointmentUpdate;
GO

CREATE TRIGGER trg_Audit_AppointmentUpdate
ON Appointments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only log if status actually changed
    IF UPDATE(AppointmentStatusID)
    BEGIN
        INSERT INTO AuditLog_Appointments (AppointmentID, Action, OldStatus, NewStatus, Details)
        SELECT 
            i.AppointmentID,
            'UPDATE',
            old_status.StatusName,
            new_status.StatusName,
            CONCAT('Status changed from "', old_status.StatusName, 
                   '" to "', new_status.StatusName, '"')
        FROM inserted i
        INNER JOIN deleted d ON i.AppointmentID = d.AppointmentID
        LEFT JOIN AppointmentStatuses old_status ON d.AppointmentStatusID = old_status.StatusID
        LEFT JOIN AppointmentStatuses new_status ON i.AppointmentStatusID = new_status.StatusID
        WHERE i.AppointmentStatusID != d.AppointmentStatusID;
    END
END;
GO

PRINT '✓ Trigger 2 created: trg_Audit_AppointmentUpdate';

-- ========================================
-- TRIGGER 3: trg_Audit_DoctorAvailability 
-- Purpose: Log doctor availability changes
-- ========================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Audit_DoctorAvailability')
    DROP TRIGGER trg_Audit_DoctorAvailability;
GO

CREATE TRIGGER trg_Audit_DoctorAvailability
ON Doctors
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only log if availability changed
    IF UPDATE(IsAvailable)
    BEGIN
        INSERT INTO AuditLog_Doctors (DoctorID, Action, FieldChanged, OldValue, NewValue, Details)
        SELECT 
            i.DoctorID,
            'UPDATE',
            'IsAvailable',
            CASE WHEN d.IsAvailable = 1 THEN 'Available' ELSE 'Unavailable' END,
            CASE WHEN i.IsAvailable = 1 THEN 'Available' ELSE 'Unavailable' END,
            CONCAT('Dr. ', i.FullName, ' is now ', 
                   CASE WHEN i.IsAvailable = 1 THEN 'available' ELSE 'unavailable' END,
                   ' for appointments')
        FROM inserted i
        INNER JOIN deleted d ON i.DoctorID = d.DoctorID
        WHERE i.IsAvailable != d.IsAvailable;
    END
END;
GO

PRINT '✓ Trigger 3 created: trg_Audit_DoctorAvailability';

-- ========================================
-- TRIGGER 4: TR_AuditBlacklistChanges 
-- Purpose: Audit log for blacklist changes
-- ========================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_AuditBlacklistChanges')
    DROP TRIGGER TR_AuditBlacklistChanges;
GO

CREATE TRIGGER TR_AuditBlacklistChanges
ON Patients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO AuditLog (TableName, RecordID, Action, OldValue, NewValue, ChangedAt)
    SELECT 
        'Patients',
        i.PatientID,
        'BLACKLIST_CHANGE',
        CONCAT('Blacklisted: ', d.IsBlacklisted, ', Missed: ', d.MissedVisits),
        CONCAT('Blacklisted: ', i.IsBlacklisted, ', Missed: ', i.MissedVisits),
        GETDATE()
    FROM inserted i
    INNER JOIN deleted d ON i.PatientID = d.PatientID
    WHERE i.IsBlacklisted != d.IsBlacklisted
    OR i.MissedVisits != d.MissedVisits;
END;
GO

PRINT '✓ Trigger 4 created: TR_AuditBlacklistChanges';

-- ========================================
-- TRIGGER 5: TR_CancelFutureAppointments_Blacklist 
-- Purpose: Cancel future appointments when patient is blacklisted
-- ========================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_CancelFutureAppointments_Blacklist')
    DROP TRIGGER TR_CancelFutureAppointments_Blacklist;
GO

CREATE TRIGGER TR_CancelFutureAppointments_Blacklist
ON Patients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(IsBlacklisted)
    BEGIN
        -- Cancel future appointments for newly blacklisted patients
        UPDATE Appointments
        SET AppointmentStatusID = 5, -- Cancelled
            QueuePosition = NULL
        FROM Appointments a
        INNER JOIN inserted i ON a.PatientID = i.PatientID
        INNER JOIN deleted d ON i.PatientID = d.PatientID
        WHERE i.IsBlacklisted = 1 
        AND d.IsBlacklisted = 0 -- Just blacklisted
        AND a.AppointmentDate > CAST(GETDATE() AS DATE)
        AND a.AppointmentStatusID IN (1, 4); -- Active only
        
        -- Create notification for blacklisted patients
        INSERT INTO Notifications (UserID, Title, Message, RelatedType, RelatedID, CreatedAt)
        SELECT 
            i.PatientID,
            'Account Blacklisted',
            CONCAT('Your account has been blacklisted due to ', i.MissedVisits, 
                   ' missed appointments. All future appointments cancelled. Contact admin.'),
            'Blacklist',
            i.PatientID,
            GETDATE()
        FROM inserted i
        INNER JOIN deleted d ON i.PatientID = d.PatientID
        WHERE i.IsBlacklisted = 1 
        AND d.IsBlacklisted = 0;
    END
END;
GO

PRINT '✓ Trigger 5 created: TR_CancelFutureAppointments_Blacklist';

-- ========================================
-- TRIGGER 6: trg_Audit_PatientBlacklist 
-- Purpose: Log patient blacklist changes
-- ========================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Audit_PatientBlacklist')
    DROP TRIGGER trg_Audit_PatientBlacklist;
GO

CREATE TRIGGER trg_Audit_PatientBlacklist
ON Patients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only log if blacklist status changed
    IF UPDATE(IsBlacklisted)
    BEGIN
        INSERT INTO AuditLog_Patients (PatientID, Action, FieldChanged, OldValue, NewValue, Details)
        SELECT 
            i.PatientID,
            'UPDATE',
            'IsBlacklisted',
            CASE WHEN d.IsBlacklisted = 1 THEN 'Blacklisted' ELSE 'Active' END,
            CASE WHEN i.IsBlacklisted = 1 THEN 'Blacklisted' ELSE 'Active' END,
            CASE 
                WHEN i.IsBlacklisted = 1 THEN 
                    CONCAT('Patient blacklisted - Missed Visits: ', i.MissedVisits)
                ELSE 
                    'Patient removed from blacklist'
            END
        FROM inserted i
        INNER JOIN deleted d ON i.PatientID = d.PatientID
        WHERE i.IsBlacklisted != d.IsBlacklisted;
    END
END;
GO

PRINT '✓ Trigger 6 created: trg_Audit_PatientBlacklist';
