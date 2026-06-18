-- ===============================================
-- University Database Lab Manual
-- ===============================================

-- 1. Create database
CREATE DATABASE UniversityLab1;
GO

USE UniversityLab1;
GO

-- 2. Create Tables

-- Students Table
CREATE TABLE Students (
    StudentID INT NOT NULL PRIMARY KEY,
    StudentName VARCHAR(30) NOT NULL,
    StudentBatch INT NOT NULL,
    CGPA FLOAT
);

-- Instructors Table
CREATE TABLE Instructors (
    InstructorID INT NOT NULL PRIMARY KEY,
    InstructorsName VARCHAR(30) NOT NULL
);

-- Courses Table
CREATE TABLE Courses (
    CourseID INT NOT NULL PRIMARY KEY,
    CourseName VARCHAR(50) NOT NULL,
    CourseCreditHours INT,
    InstructorID INT,
    FOREIGN KEY (InstructorID) REFERENCES Instructors(InstructorID)
);

-- Registration Table
CREATE TABLE Registration (
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    GPA FLOAT,
    PRIMARY KEY (StudentID, CourseID),
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

-- ===============================================
-- 3. Insert Sample Data
-- ===============================================

-- Students
INSERT INTO Students (StudentID, StudentName, StudentBatch, CGPA) VALUES
(1, 'Ali', 2013, 2.625),
(2, 'Aysha', 2013, 4),
(3, 'Ahmed', 2013, 2.2),
(4, 'Bilal', 2012, 2.5),
(5, 'Zafar', 2012, 3.5);

-- Instructors
INSERT INTO Instructors (InstructorID, InstructorsName) VALUES
(1, 'Zafar'),
(2, 'Sadia'),
(3, 'Saima');

-- Courses
INSERT INTO Courses (CourseID, CourseName, CourseCreditHours, InstructorID) VALUES
(1, 'Computer Programming', 3, 1),
(2, 'Computer Organization', 3, 2),
(3, 'Computer Programming Lab', 1, NULL),
(4, 'Database', 3, 2),
(5, 'Database Lab', 1, 1);

-- Registration
INSERT INTO Registration (StudentID, CourseID, GPA) VALUES
(1, 1, 3),
(1, 3, 3),
(1, 4, 2),
(1, 5, 3),
(2, 1, 2.5),
(2, 2, 0),
(2, 4, 3);

--q1
select studentname, cgpa
from students
where cgpa = (select max(cgpa) from students);

--q2
select studentname, cgpa
from students
where cgpa = (
    select max(cgpa)
    from students
    where cgpa < (select max(cgpa) from students)
);

-- 3
select studentname
from students
where studentid not in (select studentid from registration);

-- 4
select coursename
from courses
where courseid not in (select courseid from registration);

-- 5
select studentname, cgpa
from students
where cgpa > (select avg(cgpa) from students);

-- 6.
select coursename, coursecredithours
from courses
where coursecredithours = (select max(coursecredithours) from courses);


SELECT * FROM Students;

SELECT * FROM Instructors;

SELECT * FROM Courses;

SELECT * FROM Registration;

