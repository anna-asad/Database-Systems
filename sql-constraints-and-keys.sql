Create Database info;
use info;
create Table Student (
	RollNo varchar(15),
	Name_ Varchar(50),
	Gender char(1),
	Phone varchar (12)
	);


Create Table Attendance (
	RollNo varchar(15) ,
	Date_ date,
	Status_ char(1),
	ClassVenue SMALLINT
	);

Create Table ClassVenue (
	ID int ,
	building  varchar(20),
	RoomNum smallint,
	teacherID smallint
	);
Create Table Teacher (
	ID int ,
	Name_ varchar(50),
	Designation varchar(50),
	Department varchar(50),
	);


INSERT INTO Student(RollNo,Name_,Gender,Phone)
Values('L230844','Ahmed Muaz', 'M','03333333333')

INSERT INTO Student(RollNo,Name_,Gender,Phone)
Values('L124147','Kalsoom','F','0333-3456789')

INSERT INTO Student(RollNo,Name_,Gender,Phone)
Values('L230654','Sabih Ud Din','M','0345-3243567')


INSERT INTO Attendance(RollNo, Date_, Status_, ClassVenue)
VALUES('L230844', '2016-02-22', 'P', 2);

INSERT INTO Attendance(RollNo, Date_, Status_, ClassVenue)
VALUES('L124147', '2016-02-23', 'A', 1);

INSERT INTO Attendance(RollNo, Date_, Status_, ClassVenue)
VALUES('L230654', '2016-03-04', 'P', 2);


INSERT INTO ClassVenue(ID, Building, RoomNum, TeacherId)
VALUES(1, 'CS', 2, 1);

INSERT INTO ClassVenue(ID, Building, RoomNum, TeacherId)
VALUES(2, 'Civil', 7, 2);


INSERT INTO Teacher(ID, Name_, Designation, Department)
VALUES(1, 'Dr. Zeeshan Ali Rana', 'Assistant Prof.', 'Software Engineering');

INSERT INTO Teacher(ID, Name_, Designation, Department)
VALUES(2, 'Ms. Aleena Ahmed', 'Lecturer', 'Data Science');

INSERT INTO Teacher(ID, Name_, Designation, Department)
VALUES(3, 'Kashif Zafar', 'Professor', 'Computer Science');




Select * From Student;

select * from Attendance;

Select *from ClassVenue;

Select * from Teacher;

alter table Student 
alter column RollNo Varchar(50) not null
alter table Student 
add constraint PK_student Primary Key (RollNo)

Exec sp_help 'Student';

alter table ClassVenue
alter column ID int not null
alter table ClassVenue
add constraint PK_Classvenue Primary Key (ID)


alter table Teacher
alter column ID int not null
alter table Teacher
add constraint PK_Teacher Primary Key (ID)


alter table Attendance
alter column RollNo varchar(50) not null
alter table Attendance
alter column Date_ date not null

alter table Attendance
add constraint PK_Attendance Primary Key (RollNo,Date_)


ALTER TABLE Attendance
ADD CONSTRAINT FK_Attendance
FOREIGN KEY (RollNo) REFERENCES Student(RollNo)
On update Cascade
--default is on delete no action thats why thers no need to type it 

Alter table Attendance
Drop constraint FK_Attendance

ALTER TABLE ClassVenue
ADD CONSTRAINT FK_ClassVenue
FOREIGN KEY (ID) REFERENCES Teacher(ID)
On update Cascade

Alter Table Student
Add warningcount decimal(3,2)





INSERT INTO Student(RollNo, Name_, Gender, warningcount)
VALUES('L162334', 'Fozan Shahid', 'M', 3.2);
--Accepted , it will make the phone number as null


INSERT INTO ClassVenue(ID, Building, RoomNum, TeacherId)
VALUES(3, 'CS', 5, 'Ali');
-- Not accepted becayse TEacherID is INT it also is a primary key so it cannot be null , sadly
--also a value not in the parent table cannot be added in the child


UPDATE Teacher
SET Name_ = 'Dr. Kashif Zafar'
WHERE Name_ = 'Kashif Zafar';
--accepted 

Delete from Student 
where RollNo='L162334'
;
--accepteddd


Delete from Student 
where RollNo='L164123'
;
--accepted againn yay

Delete from Attendance
where Rollno='L164124' and Status_='A'
-- accepted but theres no roll number like this so no change in the table 



Alter table Student
Add CNIC varchar(20)

alter table student 
drop column Phone

select *from student

ALTER TABLE Teacher
ADD CONSTRAINT UQ_Teacher UNIQUE (Name_);

Alter table Student 
Add constraint chk_gender
check (Gender='M' or Gender ='F')

Alter table Attendance 
Add constraint chk_attend
check (Status_='A' or Status_ ='P')



