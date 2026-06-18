-- Create database
CREATE DATABASE SuperDogCarbonDB;
GO
drop database SuperDogCarbonDB
USE SuperDogCarbonDB;
GO
use master
-- 1. Organization
CREATE TABLE Organization (
    organization_id INT PRIMARY KEY IDENTITY(1,1),
    organization_name VARCHAR(255) NOT NULL,
    industry_type VARCHAR(100)
);

-- 2. Site
CREATE TABLE Site (
    site_id INT PRIMARY KEY IDENTITY(1,1),
    organization_id INT NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    FOREIGN KEY (organization_id) REFERENCES Organization(organization_id)
);

-- 3. Supplier
CREATE TABLE Supplier (
    supplier_id INT PRIMARY KEY IDENTITY(1,1),
    supplier_name VARCHAR(255) NOT NULL,
    region VARCHAR(100)
);

-- 4. Emission_Scope
CREATE TABLE Emission_Scope (
    scope_id INT PRIMARY KEY IDENTITY(1,1),
    scope_type VARCHAR(50) NOT NULL CHECK (scope_type IN ('Scope 1', 'Scope 2', 'Scope 3')),
    description TEXT
);

-- 5. Emission_Source
CREATE TABLE Emission_Source (
    source_id INT PRIMARY KEY IDENTITY(1,1),
    source_type VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(50),
    default_emission_factor DECIMAL(10, 4)
);

-- 6. Emission_Record
CREATE TABLE Emission_Record (
    record_id INT PRIMARY KEY IDENTITY(1,1),
    site_id INT NOT NULL,
    supplier_id INT NOT NULL,
    scope_id INT NOT NULL,
    source_id INT NOT NULL,
    record_date DATE NOT NULL,
    quantity_used DECIMAL(12, 2) NOT NULL,
    emission_factor DECIMAL(10, 4) NOT NULL,
    calculated_emission AS (quantity_used * emission_factor) PERSISTED,
    FOREIGN KEY (site_id) REFERENCES Site(site_id),
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id),
    FOREIGN KEY (scope_id) REFERENCES Emission_Scope(scope_id),
    FOREIGN KEY (source_id) REFERENCES Emission_Source(source_id)
);

-- 7. Emission_Target (optional for planning/strategy)
CREATE TABLE Emission_Target (
    target_id INT PRIMARY KEY IDENTITY(1,1),
    organization_id INT NOT NULL,
    scope_id INT NOT NULL,
    year INT NOT NULL,
    emission_limit DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES Organization(organization_id),
    FOREIGN KEY (scope_id) REFERENCES Emission_Scope(scope_id)
);

USE SuperDogCarbonDB;
GO

-- 1. Insert into Organization
INSERT INTO Organization (organization_name, industry_type)
VALUES 
('EcoCorp Ltd.', 'Manufacturing'),
('GreenWare Inc.', 'Software'),
('UrbanPower Co.', 'Energy'),
('CleanFoods Ltd.', 'Food Processing'),
('TransportMax', 'Logistics'),
('SkyHigh Airlines', 'Aviation'),
('SmartHome Solutions', 'Electronics'),
('BuildBright', 'Construction'),
('TreeLine Apparel', 'Fashion'),
('AquaFlow Utilities', 'Water Management');

-- 2. Insert into Site
INSERT INTO Site (organization_id, site_name, location)
VALUES
(1, 'EcoCorp HQ', 'New York'),
(1, 'EcoCorp Plant A', 'New Jersey'),
(2, 'GreenWare Hub', 'San Francisco'),
(3, 'UrbanPower Plant 1', 'Texas'),
(4, 'CleanFoods Factory', 'Chicago'),
(5, 'TransportMax Warehouse', 'Detroit'),
(6, 'SkyHigh Terminal', 'Atlanta'),
(7, 'SmartHome Factory', 'Seattle'),
(8, 'BuildBright Site A', 'Houston'),
(9, 'TreeLine Studio', 'Los Angeles');

-- 3. Insert into Supplier
INSERT INTO Supplier (supplier_name, region)
VALUES
('PowerGrid Inc.', 'North America'),
('BioFuel Systems', 'Europe'),
('ClearEnergy', 'Asia'),
('FreshWater Corp.', 'North America'),
('GreenTransport Ltd.', 'Europe'),
('RecyclePro', 'North America'),
('SolarPeak', 'Asia'),
('CarbonNeutral Freight', 'South America'),
('EcoDeliveries', 'Africa'),
('WindFlow Partners', 'Oceania');

-- 4. Insert into Emission_Scope
INSERT INTO Emission_Scope (scope_type, description)
VALUES
('Scope 1', 'Direct emissions from owned or controlled sources'),
('Scope 2', 'Indirect emissions from the generation of purchased electricity'),
('Scope 3', 'Other indirect emissions such as those from supply chains');

-- 5. Insert into Emission_Source
INSERT INTO Emission_Source (source_type, unit_of_measure, default_emission_factor)
VALUES
('Diesel Fuel', 'liters', 2.68),
('Electricity', 'kWh', 0.5),
('Natural Gas', 'cubic meters', 1.9),
('Air Travel', 'passenger-km', 0.18),
('Freight Shipping', 'ton-km', 0.1),
('Office Equipment', 'unit', 12.5),
('Refrigerant Leak', 'kg', 1430),
('Food Waste', 'kg', 4.0),
('Employee Commute', 'km', 0.12),
('Water Usage', 'cubic meters', 0.5);

-- 6. Insert into Emission_Record
INSERT INTO Emission_Record (site_id, supplier_id, scope_id, source_id, record_date, quantity_used, emission_factor)
VALUES
(1, 1, 2, 2, '2024-01-15', 10000, 0.5),
(2, 2, 1, 1, '2024-01-20', 5000, 2.68),
(3, 3, 3, 9, '2024-02-01', 2000, 0.12),
(4, 4, 2, 2, '2024-02-10', 8000, 0.5),
(5, 5, 3, 5, '2024-03-05', 12000, 0.1),
(6, 6, 1, 4, '2024-03-10', 1500, 0.18),
(7, 7, 1, 3, '2024-03-20', 3000, 1.9),
(8, 8, 3, 6, '2024-04-01', 100, 12.5),
(8, 8, 3, 7, '2024-04-01', 100, 12.5),
(8, 8, 3, 8, '2024-04-01', 100, 12.5),
(9, 9, 3, 8, '2024-04-10', 2500, 4.0),
(10, 10, 1, 7, '2024-04-15', 50, 1430);

-- 7. Insert into Emission_Target
INSERT INTO Emission_Target (organization_id, scope_id, year, emission_limit)
VALUES
(1, 1, 2025, 25000),
(2, 2, 2025, 15000),
(3, 3, 2025, 10000),
(4, 1, 2025, 5000),
(5, 3, 2025, 12000),
(6, 1, 2025, 8000),
(7, 2, 2025, 6000),
(8, 3, 2025, 10000),
(9, 2, 2025, 9000),
(10, 1, 2025, 3000);


--q1
create procedure newprocedure
as 
begin
declare @counter int =1
declare @rowcount int
declare @orgname varchar(255)
declare @sitecount int

select @rowcount=count(organization_id) from Organization

while @counter <=@rowcount
begin
select @orgname=organization_name
from Organization
where organization_id=@counter

select @sitecount=COUNT(*)
from Site
where organization_id=@counter

print'Organization :' + @orgname + ' | Total sites:' + CAST(@siteCount AS VARCHAR)
SET @counter = @counter + 1
end
end


EXEC newprocedure


--q2
create procedure resetemission @source_id int 
as begin
declare @c int 
declare @rowcount int
declare @defaultt decimal(10,4)
select @defaultt=default_emission_factor
from Emission_Source
where source_id=@source_id

select @rowcount =count(*) from Emission_Record
while @c<=@rowcount
begin
update Emission_Record
set emission_factor=@defaultt
where record_id=@c and source_id=@source_id
set @c = @c+1
end
PRINT 'Done resetting emission factors for source_id 2'
END
GO

exec resetemission @source_id =2


select * from Emission_Record
select * from Emission_Source

--q3
create procedure monthlyemissionspersite
as
begin
declare @month int=1
declare @site_id int=1
declare @maxsite int
declare @totalemission decimal(12,2)

select @maxsite=max(site_id) from site

while @month<=12
begin
set @site_id=1

while @site_id<=@maxsite
begin
select @totalemission=sum(calculated_emission)
from emission_record
where site_id=@site_id
and month(record_date)=@month
and year(record_date)=year(getdate())-1

if @totalemission is not null
print 'month:'+cast(@month as varchar)+'|site_id:'+cast(@site_id as varchar)+'|totalemissions:'+cast(@totalemission as varchar)

set @site_id=@site_id+1
end

set @month=@month+1
end
end
go

exec monthlyemissionspersite

--q4

create table newdeletetable
(
log_id INT PRIMARY KEY IDENTITY(1,1),
record_id INT,
site_id INT,
record_date DATE,
calculated_emission DECIMAL(12,2),
deleted_at DATETIME DEFAULT GETDATE()
)

create trigger afterdelete
on Emission_Record
after delete 
as begin
insert into newdeletetable(record_id,site_id,record_date,calculated_emission)
select record_id,site_id,record_date,calculated_emission
from deleted
end 
delete from Emission_Record where record_id=1
select * from newdeletetable
--drop trigger afterdelete


--q5
alter table Emission_Record
add last_update datetime null

create trigger afterupdate
on emission_record
after update
as
begin
if update(quantity_used) or update (emission_factor)
begin
update Emission_Record
set last_update=getdate()
where record_id in ( select record_id from inserted)
end
end 



-- Test it
UPDATE Emission_Record
SET quantity_used = 9999
WHERE record_id = 2

-- Check result
SELECT record_id, quantity_used, emission_factor, last_update
FROM Emission_Record
WHERE record_id = 2




--q6
create table drop_attempt_log(
    log_id int primary key identity(1,1),
    attempted_by varchar(255),
    attempted_at datetime default getdate(),
    object_name varchar(255)
)

create trigger preventdroptables
on database
for drop_table
as
begin
rollback

insert into drop_attempt_log(attempted_by, object_name)
values(suser_name(), eventdata().value('(/EVENT_INSTANCE/ObjectName)[1]','varchar(255)'))

print 'DROP TABLE is not allowed! Attempt has been logged.'
end
go

-- test it
drop table Emission_Record

select * from drop_attempt_log





--q7
create table schema_change_log(
    log_id int primary key identity(1,1),
    table_name varchar(255),
    changed_by varchar(255),
    change_time datetime default getdate()
)
create trigger trg_afteraltertable
on database
for alter_table
as
begin
    declare @eventdata xml
    declare @tablename varchar(255)
    declare @changedby varchar(255)

    set @eventdata = eventdata()
    set @tablename = @eventdata.value('(/EVENT_INSTANCE/ObjectName)[1]','varchar(255)')
    set @changedby = suser_name()

    insert into schema_change_log(table_name, changed_by, change_time)
    values(@tablename, @changedby, getdate())

    print 'Schema change logged for table: ' + @tablename
end


-- test it
alter table supplier add email varchar(255)

-- check log
select * from schema_change_log