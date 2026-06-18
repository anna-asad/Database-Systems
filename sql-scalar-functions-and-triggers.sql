USE master;
GO

-- Create the login (this is what you'll use in your Node.js config)
CREATE LOGIN aina WITH PASSWORD = 'l242519';
GO


-- Create database
CREATE DATABASE SuperDogCarbonDB;
GO

USE SuperDogCarbonDB;
GO
CREATE USER aina FOR LOGIN aina;
GO
ALTER ROLE db_owner ADD MEMBER aina;


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
create trigger trg_blockduplicateemission
on emission_record
instead of insert
as
begin
if exists (select 1 from emission_record er join inserted i on er.site_id=i.site_id and er.source_id=i.source_id and er.record_date=i.record_date)
begin
raiserror('duplicate emission record detected!',16,1);
rollback transaction;
end
else
begin
insert into emission_record (site_id,supplier_id,scope_id,source_id,record_date,quantity_used,emission_factor)
select site_id,supplier_id,scope_id,source_id,record_date,quantity_used,emission_factor from inserted;
end
end;

--use case

insert into Emission_Record (site_id, supplier_id, scope_id, source_id, record_date, quantity_used, emission_factor)
values (1, 1, 1, 1, '2024-01-15', 100, 2.68);
insert into Emission_Record (site_id, supplier_id, scope_id, source_id, record_date, quantity_used, emission_factor)
values (1, 1, 1, 1, '2024-01-15', 200, 2.68);

--q2
create function fn_getemissioncategory (@emission decimal(12,2))
returns varchar(20)
as
begin
declare @category varchar(20);
if @emission < 500
set @category = 'low';
else if @emission < 5000
set @category = 'moderate';
else
set @category = 'high';
return @category;
end;

--test
select record_id,site_id,source_id,record_date,quantity_used,emission_factor,calculated_emission
,dbo.fn_getemissioncategory(calculated_emission) as emission_category 
from emission_record;

--q3
drop function fn_getemissioncategory
create function dbo.fn_getemissioncategory (@qty decimal(12,2),@factor decimal(10,4))
returns varchar(20)
as
begin
declare @total decimal(12,2)=@qty*@factor;
declare @category varchar(20);
set @category=case when @total<1000 then 'low' when @total<=5000 then 'medium' else 'high' end;
return @category;
end;
alter table emission_record add emission_category as dbo.fn_getemissioncategory(quantity_used,emission_factor);
go
go
select record_id,calculated_emission,emission_category from emission_record;

 --q4
create function dbo.fn_computeriskscore (@quantity_used decimal(12,2),@emission_factor decimal(10,4),@scope_type varchar(50))
returns decimal(18,4)
as
begin
return ((@quantity_used*@emission_factor*1.2)+(@quantity_used*0.5)+case when @scope_type='scope 1' then 100 else 50 end);
end;
go

alter table emission_record add scope_type varchar(50);
go

update er set scope_type=es.scope_type from emission_record er inner join emission_scope es on er.scope_id=es.scope_id;
go

alter table emission_record add risk_score as dbo.fn_computeriskscore(quantity_used,emission_factor,scope_type);
go

select top 5 record_id,quantity_used,emission_factor,scope_type,risk_score from emission_record;
go


--q5
create table emergency_alerts (
alert_id int identity(1,1) primary key,
record_id int,
alert_message varchar(255),
alert_date datetime default getdate()
);

create trigger trg_emergencyfuelburn
on emission_record
after insert,update
as
begin
set nocount on;
with emergencyrecords as (
select i.record_id,i.source_id from inserted i join emission_source es on i.source_id=es.source_id
where i.quantity_used>20000 and es.source_type like '%diesel%'
)
insert into emergency_alerts (record_id,alert_message)
select er.record_id,'emergency fuel burn detected (diesel > 20000 liters)' from emergencyrecords er;
update es set source_type=case when len(es.source_type+' - emergency burn')<=100 then es.source_type+' - emergency burn' else left(es.source_type,100-len(' - emergency burn'))+' - emergency burn' end
from emission_source es join emergencyrecords er on es.source_id=er.source_id
where es.source_type not like '%emergency burn%';
end;


select * from Organization
select * from Site
select * from Supplier
select * from Emission_Scope
select * from Emission_Source
select * from Emission_Record
select * from Emission_Target



--part 2
--=====================================================================================================
CREATE TABLE LudoGamePlay (
    move_id INT IDENTITY(1,1) PRIMARY KEY,
    player_id INT CHECK (player_id IN (1, 2)),
    dice_roll INT CHECK (dice_roll BETWEEN 1 AND 6),
    position INT DEFAULT 0
);

create function calculatenewposition (@current_position int, @dice_roll int)
returns int
as
begin
declare @new_pos int = @current_position + @dice_roll;
if @new_pos > 100
set @new_pos = 100;
return @new_pos;
end;

create trigger trg_updateposition
on ludogameplay
after insert
as
begin
declare @current_move_id int, @p_id int, @roll int, @prev_pos int;
select @current_move_id = move_id, @p_id = player_id, @roll = dice_roll from inserted;
select @prev_pos = isnull(max(position),0) from ludogameplay where player_id = @p_id and move_id < @current_move_id;
update ludogameplay set position = dbo.calculatenewposition(@prev_pos,@roll) where move_id = @current_move_id;
end;

create procedure sp_simulateturn
as
begin
declare @next_player int;
declare @current_count int;
select @current_count = count(*) from ludogameplay;
if @current_count % 2 = 0
set @next_player = 1;
else
set @next_player = 2;
insert into ludogameplay (player_id,dice_roll,position) values (@next_player,floor(rand()*6+1),0);
end;

declare @gameover bit = 0;
while @gameover = 0
begin
exec sp_simulateturn;
if exists (select 1 from ludogameplay where position = 100)
begin
set @gameover = 1;
select player_id as winner, move_id as total_turns, 'wins the game!' as status from ludogameplay where position = 100;
end
end;

select * from ludogameplay order by move_id;
