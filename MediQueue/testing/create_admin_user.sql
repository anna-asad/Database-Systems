-- ========================================
-- Create Admin User for Testing - Updated with Correct Column Names
-- ========================================

-- The roles should already exist from mediqueue.sql, but let's verify
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Admin');
    PRINT 'Admin role created';
END

-- Create admin user
DECLARE @AdminUserID INT;

-- Check if admin user already exists
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@mediqueue.com')
BEGIN
    -- Insert admin user with proper bcrypt hash for 'admin123'
    -- Hash generated with: bcrypt.hashSync('admin123', 10)
    -- Using a fresh bcrypt hash that should work
    INSERT INTO Users (Email, PasswordHash, RoleID, IsActive) 
    VALUES ('admin@mediqueue.com', '$2b$10$Ll7j6F8kgtQ..HFWxfOXc.4ZU/pb9mpHml9aHASZEhf8UVTIQpKJ6', 
            (SELECT RoleID FROM Roles WHERE RoleName = 'Admin'), 1);
    
    SET @AdminUserID = SCOPE_IDENTITY();
    
    -- Insert into AdminStaff table with correct column names
    INSERT INTO AdminStaff (AdminID, FullName, ContactNumber, CNIC, Department)
    VALUES (@AdminUserID, 'System Administrator', '03001234567', '12345-1234567-1', 'Management');
    
    PRINT 'Admin user created successfully!';
    PRINT 'Email: admin@mediqueue.com';
    PRINT 'Password: admin123';
END
ELSE
BEGIN
    PRINT 'Admin user already exists!';
    SELECT 'Existing admin user:' as Message, Email, IsActive FROM Users WHERE Email = 'admin@mediqueue.com';
END

-- Create a test doctor for appointment testing
DECLARE @DoctorUserID INT;

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'doctor@mediqueue.com')
BEGIN
    -- Insert doctor user with proper bcrypt hash for 'doctor123'
    INSERT INTO Users (Email, PasswordHash, RoleID, IsActive) 
    VALUES ('doctor@mediqueue.com', '$2b$10$PWBocUzxayKmdfrj34c.tetvN.TfEAB5FCaY475xjelD24vHzBC0u', 
            (SELECT RoleID FROM Roles WHERE RoleName = 'Doctor'), 1);
    
    SET @DoctorUserID = SCOPE_IDENTITY();
    
    -- Insert into Doctors table (using correct column names from mediqueue.sql)
    INSERT INTO Doctors (DoctorID, FullName, Specialization, ConsultationFee, IsAvailable)
    VALUES (@DoctorUserID, 'Dr. Test Doctor', 'General Medicine', 1500.00, 1);
    
    PRINT 'Test doctor created successfully!';
    PRINT 'Email: doctor@mediqueue.com';
    PRINT 'Password: doctor123';
END

-- Create a test patient for appointment testing
DECLARE @PatientUserID INT;

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'patient@mediqueue.com')
BEGIN
    -- Insert patient user with proper bcrypt hash for 'patient123'
    INSERT INTO Users (Email, PasswordHash, RoleID, IsActive) 
    VALUES ('patient@mediqueue.com', '$2b$10$cw8alFhBVYWPEiyT9TmTOOuSu5ed.qRO6SwvyAVQiwjXW5vnYoL1G', 
            (SELECT RoleID FROM Roles WHERE RoleName = 'Patient'), 1);
    
    SET @PatientUserID = SCOPE_IDENTITY();
    
    -- Insert into Patients table (using correct column names from mediqueue.sql)
    INSERT INTO Patients (PatientID, FullName, ContactNumber, CNIC)
    VALUES (@PatientUserID, 'Test Patient', '03001111111', '11111-1111111-1');
    
    PRINT 'Test patient created successfully!';
    PRINT 'Email: patient@mediqueue.com';
    PRINT 'Password: patient123';
END

PRINT '';
PRINT '⚠️  IMPORTANT: All users now have properly hashed passwords!';
PRINT 'Passwords are hashed with bcrypt for security.';
PRINT '';
PRINT 'Setup complete! You can now test with:';
PRINT 'Admin: admin@mediqueue.com / admin123';
PRINT 'Doctor: doctor@mediqueue.com / doctor123';  
PRINT 'Patient: patient@mediqueue.com / patient123';

-- Show what was created
SELECT 'Created Users:' as Summary;
SELECT u.UserID, u.Email, r.RoleName, u.IsActive, u.CreatedAt
FROM Users u 
JOIN Roles r ON u.RoleID = r.RoleID 
WHERE u.Email IN ('admin@mediqueue.com', 'doctor@mediqueue.com', 'patient@mediqueue.com'); 