select 'Hellow Worldd'
--task1 
Create DataBase UniversityDB;
--task 2 
Use UniversityDB;

Create Table Student (
	rollNumber INT,
	fname NVARCHAR(100),
	cnic NVARCHAR(100),
	cgpa FLOAT
	);

Create Table Course (
	courseID int,
	courseName nvarchar,
	credithours int
	);

Drop table Course;

Drop Database UniversityDB;