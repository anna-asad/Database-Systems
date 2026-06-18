-- Create Database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MediQueue')
BEGIN
    CREATE DATABASE MediQueue;
END
GO

USE MediQueue;
GO


-- Create User and Role if not exists
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'mediqueue_user')
BEGIN
    CREATE LOGIN mediqueue_user WITH PASSWORD = 'MediQueue123!';
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'mediqueue_user')
BEGIN
    CREATE USER mediqueue_user FOR LOGIN mediqueue_user;
    ALTER ROLE db_owner ADD MEMBER mediqueue_user;
END
GO

-- Lookup Tables
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        RoleID INT PRIMARY KEY IDENTITY(1,1),
        RoleName VARCHAR(50) UNIQUE NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DaysOfWeek')
BEGIN
    CREATE TABLE DaysOfWeek (
        DayID INT PRIMARY KEY IDENTITY(1,1),
        DayName VARCHAR(20) UNIQUE NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LeaveStatuses')
BEGIN
    CREATE TABLE LeaveStatuses (
        StatusID INT PRIMARY KEY IDENTITY(1,1),
        StatusName VARCHAR(50) UNIQUE NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AppointmentStatuses')
BEGIN
    CREATE TABLE AppointmentStatuses (
        StatusID INT PRIMARY KEY IDENTITY(1,1),
        StatusName VARCHAR(50) UNIQUE NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentStatuses')
BEGIN
    CREATE TABLE PaymentStatuses (
        StatusID INT PRIMARY KEY IDENTITY(1,1),
        StatusName VARCHAR(50) UNIQUE NOT NULL
    );
END

-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID INT PRIMARY KEY IDENTITY(1,1),
        Email VARCHAR(255) UNIQUE NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        RoleID INT NOT NULL FOREIGN KEY REFERENCES Roles(RoleID),
        CreatedAt DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END

-- Patients, Doctors, and AdminStaff
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patients')
BEGIN
    CREATE TABLE Patients (
        PatientID INT PRIMARY KEY FOREIGN KEY REFERENCES Users(UserID),
        FullName VARCHAR(255) NOT NULL,
        ContactNumber VARCHAR(20),
        CNIC VARCHAR(20) UNIQUE NOT NULL,
        ProfilePictureURL VARCHAR(500),
        TotalVisits INT DEFAULT 0,
        SuccessfulVisits INT DEFAULT 0,
        MissedVisits INT DEFAULT 0,
        IsBlacklisted BIT DEFAULT 0 
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Doctors')
BEGIN
    CREATE TABLE Doctors (
        DoctorID INT PRIMARY KEY FOREIGN KEY REFERENCES Users(UserID),
        FullName VARCHAR(255) NOT NULL,
        Specialization VARCHAR(255),
        ConsultationFee DECIMAL(10,2) NOT NULL,
        IsAvailable BIT DEFAULT 1
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminStaff')
BEGIN
    CREATE TABLE AdminStaff (
        AdminID INT PRIMARY KEY FOREIGN KEY REFERENCES Users(UserID),
        FullName VARCHAR(255) NOT NULL,
        ContactNumber VARCHAR(20),
        CNIC VARCHAR(20) UNIQUE NOT NULL,
        Department VARCHAR(100),  -- e.g., Reception, Management, IT
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Doctor Schedules and Leaves
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DoctorSchedules')
BEGIN
    CREATE TABLE DoctorSchedules (
        ScheduleID INT PRIMARY KEY IDENTITY(1,1),
        DoctorID INT NOT NULL FOREIGN KEY REFERENCES Doctors(DoctorID),
        DayOfWeekID INT NOT NULL FOREIGN KEY REFERENCES DaysOfWeek(DayID),
        StartTime TIME NOT NULL,
        EndTime TIME NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DoctorLeaves')
BEGIN
    CREATE TABLE DoctorLeaves (
        LeaveID INT PRIMARY KEY IDENTITY(1,1),
        DoctorID INT NOT NULL FOREIGN KEY REFERENCES Doctors(DoctorID),
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        Reason NVARCHAR(MAX),
        LeaveStatusID INT NOT NULL FOREIGN KEY REFERENCES LeaveStatuses(StatusID),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Appointments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
    CREATE TABLE Appointments (
        AppointmentID INT PRIMARY KEY IDENTITY(1,1),
        PatientID INT NOT NULL FOREIGN KEY REFERENCES Patients(PatientID),
        DoctorID INT NOT NULL FOREIGN KEY REFERENCES Doctors(DoctorID),
        AppointmentDate DATE NOT NULL,
        TimeSlot TIME NOT NULL,
        TokenNumber INT NOT NULL,
        AppointmentStatusID INT NOT NULL FOREIGN KEY REFERENCES AppointmentStatuses(StatusID),
        DoctorRemarks NVARCHAR(MAX),
        QueuePosition INT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_Doctor_Date_Token UNIQUE (DoctorID, AppointmentDate, TokenNumber)
    );
END

-- Allow re-booking a cancelled slot:
-- Enforce unique (DoctorID, AppointmentDate, TimeSlot) ONLY for active appointments (Scheduled=1, Walk-In=4).
-- This keeps history rows (Cancelled/Completed/etc.) without blocking new bookings.
IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE [name] = 'UQ_Doctor_Date_Time'
      AND parent_object_id = OBJECT_ID('dbo.Appointments')
)
BEGIN
    ALTER TABLE dbo.Appointments DROP CONSTRAINT UQ_Doctor_Date_Time;
END

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = 'UX_Appointments_ActiveSlot'
      AND object_id = OBJECT_ID('dbo.Appointments')
)
BEGIN
    CREATE UNIQUE INDEX UX_Appointments_ActiveSlot
    ON dbo.Appointments (DoctorID, AppointmentDate, TimeSlot)
    WHERE AppointmentStatusID IN (1, 4);
END

-- Medical Records
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicalRecords')
BEGIN
    CREATE TABLE MedicalRecords (
        RecordID INT PRIMARY KEY IDENTITY(1,1),
        AppointmentID INT NOT NULL FOREIGN KEY REFERENCES Appointments(AppointmentID),
        PatientID INT NOT NULL FOREIGN KEY REFERENCES Patients(PatientID),
        DoctorID INT NOT NULL FOREIGN KEY REFERENCES Doctors(DoctorID),
        Diagnosis NVARCHAR(MAX),
        Prescription NVARCHAR(MAX),
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Notifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        NotificationID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
        Title NVARCHAR(255) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        IsRead BIT DEFAULT 0,
        RelatedType NVARCHAR(50) NULL,  -- e.g., 'Leave', 'Appointment'
        RelatedID INT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Billing
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Billing')
BEGIN
    CREATE TABLE Billing (
        BillID INT PRIMARY KEY IDENTITY(1,1),
        AppointmentID INT UNIQUE NOT NULL FOREIGN KEY REFERENCES Appointments(AppointmentID),
        Amount DECIMAL(10,2) NOT NULL,
        FeeSlipURL VARCHAR(500),
        PaymentStatusID INT NOT NULL FOREIGN KEY REFERENCES PaymentStatuses(StatusID),
        PaymentDate DATETIME NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- inserting lookup data
IF NOT EXISTS (SELECT * FROM Roles)
    INSERT INTO Roles (RoleName) VALUES ('Patient'), ('Doctor'), ('Admin'), ('Reception');

IF NOT EXISTS (SELECT * FROM DaysOfWeek)
    INSERT INTO DaysOfWeek (DayName) VALUES ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday'), ('Friday'), ('Saturday'), ('Sunday');

IF NOT EXISTS (SELECT * FROM LeaveStatuses)
    INSERT INTO LeaveStatuses (StatusName) VALUES ('Pending'), ('Approved'), ('Rejected');

IF NOT EXISTS (SELECT * FROM AppointmentStatuses)
    INSERT INTO AppointmentStatuses (StatusName) VALUES ('Scheduled'), ('Completed'), ('Missed'), ('Walk-In'), ('Cancelled'), ('Rescheduled');

IF NOT EXISTS (SELECT * FROM PaymentStatuses)
    INSERT INTO PaymentStatuses (StatusName) VALUES ('Pending'), ('Paid');

-- sample users
-- All sample users use password: password123
-- (bcrypt hash generated in backend with bcrypt.hash('password123', 10))
-- $2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW
-- patients
INSERT INTO Users (Email, PasswordHash, RoleID, IsActive) VALUES
('patient1@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1), ('patient2@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1),
('patient3@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1), ('patient4@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1),
('patient5@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1), ('patient6@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1),
('patient7@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1), ('patient8@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1),
('patient9@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1), ('patient10@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 1, 1);

-- doctors
INSERT INTO Users (Email, PasswordHash, RoleID, IsActive) VALUES
('dr.ahmed@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1), ('dr.fatima@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1),
('dr.tariq@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1), ('dr.sana@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1),
('dr.imran@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1), ('dr.ayesha@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1),
('dr.fahad@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1), ('dr.hina@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1),
('dr.kamran@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1), ('dr.nadia@clinic.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 2, 1);

-- sample admin (UserID 21)
INSERT INTO Users (Email, PasswordHash, RoleID, IsActive) VALUES ('admin@test.com', '$2b$10$s17vthaEWpKomRFsj/IogewFi2EB.0fMpVcDOLrZ/MO0LllBSSKrW', 3, 1);


-- patient profiles (UserIDs 1-10)
INSERT INTO Patients (PatientID, FullName, ContactNumber, CNIC, TotalVisits, SuccessfulVisits, MissedVisits, IsBlacklisted) VALUES
(1, 'Hamza Sheikh', '0300-1111111', '35201-1111111-1', 2, 2, 0, 0),
(2, 'Mariam Javed', '0300-2222222', '35201-2222222-2', 5, 4, 1, 0),
(3, 'Rizwan Aslam', '0300-3333333', '35201-3333333-3', 1, 1, 0, 0),
(4, 'Noman Iqbal', '0300-4444444', '35201-4444444-4', 6, 2, 4, 1), -- blacklisted (missed 4 times)
(5, 'Ali Khan', '0300-5555555', '35201-5555555-5', 0, 0, 0, 0),
(6, 'Sara Ahmed', '0300-6666666', '35201-6666666-6', 3, 3, 0, 0),
(7, 'Usman Tariq', '0300-7777777', '35201-7777777-7', 1, 0, 1, 0),
(8, 'Zainab Bibi', '0300-8888888', '35201-8888888-8', 4, 4, 0, 0),
(9, 'Bilal Raza', '0300-9999999', '35201-9999999-9', 2, 1, 1, 0),
(10, 'Hassan Ali', '0300-0000000', '35201-0000000-0', 8, 8, 0, 0);


-- doctor profiles (UserIDs 11-20)
INSERT INTO Doctors (DoctorID, FullName, Specialization, ConsultationFee, IsAvailable) VALUES
(11, 'Dr. Ahmed Raza', 'Cardiologist', 2500.00, 1),
(12, 'Dr. Fatima Noor', 'Dermatologist', 2000.00, 1),
(13, 'Dr. Tariq Jamil', 'Neurologist', 3000.00, 1),
(14, 'Dr. Sana Khan', 'Pediatrician', 1500.00, 1),
(15, 'Dr. Imran Qureshi', 'Orthopedic', 2500.00, 1),
(16, 'Dr. Ayesha Malik', 'Gynecologist', 2000.00, 0), -- unavailable
(17, 'Dr. Fahad Mustafa', 'ENT Specialist', 1800.00, 1),
(18, 'Dr. Hina Rabbani', 'Psychiatrist', 3500.00, 1),
(19, 'Dr. Kamran Akmal', 'General Physician', 1000.00, 1),
(20, 'Dr. Nadia Hussain', 'Dentist', 1500.00, 1);


-- schedules
INSERT INTO DoctorSchedules (DoctorID, DayOfWeekID, StartTime, EndTime) VALUES
(11, 1, '09:00', '14:00'),
(12, 2, '10:00', '15:00'),
(13, 3, '11:00', '16:00'),
(14, 4, '09:00', '13:00'),
(15, 5, '15:00', '20:00'),
(16, 1, '10:00', '14:00'),
(17, 2, '14:00', '19:00'),
(18, 3, '08:00', '12:00'),
(19, 4, '17:00', '22:00'),
(20, 5, '09:00', '17:00');


-- leaves
INSERT INTO DoctorLeaves (DoctorID, StartDate, EndDate, Reason, LeaveStatusID) VALUES
(11, '2026-03-01', '2026-03-03', 'Attending Cardiology Conference', 2),
(12, '2026-03-05', '2026-03-06', 'Personal reason', 1),
(13, '2026-03-10', '2026-03-15', 'Annual Leave', 2),
(14, '2026-03-12', '2026-03-12', 'Sick leave', 1),
(15, '2026-03-20', '2026-03-25', 'Family emergency', 2),
(16, '2026-04-01', '2026-04-02', 'Out of station', 3),
(17, '2026-04-05', '2026-04-10', 'Vacation', 1),
(18, '2026-04-15', '2026-04-16', 'Sick leave', 2),
(19, '2026-04-20', '2026-04-22', 'Workshop', 2),
(20, '2026-05-01', '2026-05-05', 'Annual Leave', 1);


-- appointments
INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, TimeSlot, TokenNumber, AppointmentStatusID, DoctorRemarks, QueuePosition) VALUES
(1, 11, '2026-03-01', '09:00', 1, 1, NULL, 1),
(2, 12, '2026-03-01', '10:00', 1, 2, 'Patient recovering well.', NULL),
(3, 13, '2026-03-01', '11:00', 1, 3, 'Patient did not show up.', NULL),
(4, 14, '2026-03-02', '09:00', 1, 4, 'Walked in after missing appt', 5),
(5, 15, '2026-03-02', '15:00', 1, 5, NULL, NULL),
(6, 16, '2026-03-02', '10:00', 1, 6, NULL, NULL),
(7, 17, '2026-03-03', '14:00', 1, 1, NULL, 1),
(8, 18, '2026-03-03', '08:00', 1, 2, 'Prescribed new medication.', NULL),
(9, 19, '2026-03-04', '17:00', 1, 1, NULL, 1),
(10, 20, '2026-03-04', '09:00', 1, 1, NULL, 2);


-- medical records
INSERT INTO MedicalRecords (AppointmentID, PatientID, DoctorID, Diagnosis, Prescription, Notes) VALUES
(1, 1, 11, 'Routine Checkup', 'None', 'Patient is healthy'),
(2, 2, 12, 'Acne', 'Isotretinoin 20mg', 'Take once daily after meals'),
(3, 3, 13, 'Migraine', 'Ibuprofen 400mg', 'Use only during severe attacks'),
(4, 4, 14, 'Viral Fever', 'Paracetamol 500mg', 'Rest for 3 days'),
(5, 5, 15, 'Knee Pain', 'Painkillers, Physiotherapy', 'Avoid heavy lifting'),
(6, 6, 16, 'PCOS', 'Hormonal therapy', 'Follow up in 3 months'),
(7, 7, 17, 'Throat Infection', 'Amoxicillin 500mg', 'Complete 5-day course'),
(8, 8, 18, 'Anxiety', 'Escitalopram 10mg', 'Therapy recommended'),
(9, 9, 19, 'Hypertension', 'Amlodipine 5mg', 'Monitor BP daily'),
(10, 10, 20, 'Cavity', 'Fluoride toothpaste', 'Needs filling next visit');

-- billing
INSERT INTO Billing (AppointmentID, Amount, PaymentStatusID, PaymentDate) VALUES
(1, 2500.00, 1, NULL),
(2, 2000.00, 2, '2026-03-01 10:30:00'),
(3, 3000.00, 1, NULL),
(4, 1500.00, 2, '2026-03-02 09:45:00'),
(5, 2500.00, 1, NULL),
(6, 2000.00, 1, NULL),
(7, 1800.00, 1, NULL),
(8, 3500.00, 2, '2026-03-03 08:45:00'),
(9, 1000.00, 1, NULL),
(10, 1500.00, 1, NULL);




