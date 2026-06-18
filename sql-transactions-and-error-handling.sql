-- create database
use master
drop database SuperDogCarbonDB

create database SuperDogCarbonDB;
use SuperDogCarbonDB;

--q1
begin try
begin transaction;
    create table Emission_Target (
        TargetID    int identity(1,1)  not null,
        CompanyID   int                not null,
        Scope       varchar(50)        not null,
        Year        int                not null,
        TargetValue decimal(18,4)      not null,

        constraint pk_emissiontarget 
            primary key (TargetID),

        constraint uq_target 
            unique (CompanyID, Scope, Year),

        constraint chk_target_year 
            check (Year between 2000 and 2100),

        constraint chk_target_value 
            check (TargetValue >= 0)
    );

    print 'table created: Emission_Target';

    create table Emission_Record (
        RecordID      int identity(1,1)        not null,
        CompanyID     int                      not null,
        Scope         varchar(50)              not null,
        EmissionType  varchar(100)             not null,
        EmissionValue decimal(18,4)            not null,
        RecordDate    date                     not null 
                      default cast(getdate() as date),

        constraint pk_emissionrecord 
            primary key (RecordID),

        constraint chk_emission_value 
            check (EmissionValue >= 0),

        constraint chk_emission_scope 
            check (Scope in ('Scope 1', 'Scope 2', 'Scope 3'))
    );

    print 'table created: Emission_Record';
    create table Emission_Factor (
        FactorID    int identity(1,1)   not null,
        Name        varchar(100)        not null,
        FactorValue decimal(10,6)       not null,

        constraint pk_emissionfactor 
            primary key (FactorID),

        constraint uq_factor_name 
            unique (Name),

        constraint chk_factor_value 
            check (FactorValue > 0)
    );

    print 'table created: Emission_Factor';
    create table Emission_Factor_Log (
        LogID      int identity(1,1)   not null,
        FactorID   int                 not null,
        OldValue   decimal(10,6)       not null,
        NewValue   decimal(10,6)       not null,
        ChangeDate datetime            not null 
                   default getdate(),

        constraint pk_emissionfactorlog 
            primary key (LogID),
        constraint fk_factorlog_factor 
            foreign key (FactorID) 
            references Emission_Factor(FactorID)
    );

    print 'table created: Emission_Factor_Log';

commit transaction;

print 'all tables created successfully.';
end try

begin catch

if @@trancount > 0
    rollback transaction;

print 'error — all tables rolled back.';
print 'message  : ' + error_message();
print 'severity : ' + cast(error_severity() as varchar);
print 'line     : ' + cast(error_line()     as varchar);

end catch;

--q2
begin try
begin transaction;

    declare @factor_id  int          = 1;
    declare @old_value  decimal(10,6);
    declare @new_value  decimal(10,6);

    select @old_value = FactorValue
    from Emission_Factor
    where FactorID = @factor_id;

    if @old_value is null
    begin
        print 'FactorID ' + cast(@factor_id as varchar) + ' not found. aborting.';
        rollback transaction;
        return;
    end

    print 'current FactorValue: ' + cast(@old_value as varchar);
    --create savepoint after reading
    save transaction sp_factorcheck;

    --apply 10% increase and update
    set @new_value = @old_value * 1.1;

    update Emission_Factor
    set    FactorValue = @new_value
    where  FactorID   = @factor_id;

    print 'updated FactorValue to: ' + cast(@new_value as varchar);

    if @new_value > 100
    begin
        rollback transaction sp_factorcheck;

        print 'rejected: new value ' + cast(@new_value as varchar) +
              ' exceeds maximum of 100.';
        print 'update rolled back to savepoint.';
    end
    else
    begin
        insert into Emission_Factor_Log (FactorID, OldValue, NewValue, ChangeDate)
        values (@factor_id, @old_value, @new_value, getdate());

        print 'success: factor updated from ' + cast(@old_value as varchar) +
              ' to '                          + cast(@new_value as varchar);
        print 'change logged in Emission_Factor_Log.';
    end

commit transaction;
print 'transaction committed.';

end try
begin catch

if @@trancount > 0
    rollback transaction;

print 'unexpected error — full rollback.';
print 'message  : ' + error_message();
print 'severity : ' + cast(error_severity() as varchar);
print 'line     : ' + cast(error_line()     as varchar);


end catch;


-- insert emission factors
insert into Emission_Factor (Name, FactorValue) values
('Natural Gas',     2.034000),
('Diesel',          2.687000),
('Electricity',     0.233000),
('Petrol',          2.312000),
('Business Travel', 0.155000);

-- check the factor value after the transaction
select FactorID, Name, FactorValue
from Emission_Factor
where FactorID = 1;

-- check the audit log
select LogID, FactorID, OldValue, NewValue, ChangeDate
from Emission_Factor_Log
order by ChangeDate desc;

--q3

insert into Emission_Record (CompanyID, Scope, EmissionType, EmissionValue, RecordDate)
values (1, 'Scope 1', 'Natural Gas', 12000.00, '2024-01-15');

insert into Emission_Target (CompanyID, Scope, Year, TargetValue)
values (1, 'Scope 1', 2024, 15000.00);


begin try
begin transaction;
    update Emission_Record
    set    EmissionValue = EmissionValue + 100
    where  RecordID = 1;

    print 'session a: locked Emission_Record (RecordID = 1)';

    waitfor delay '00:00:05';

    update Emission_Target
    set    TargetValue = TargetValue + 500
    where  TargetID = 1;

    print 'session a: locked Emission_Target (TargetID = 1)';

commit transaction;
print 'session a: committed successfully.';

end try
begin catch


if @@trancount > 0
    rollback transaction;

if error_number() = 1205
    print 'session a: chosen as deadlock victim. safe to retry.';
else
    print 'session a error: ' + error_message();



end catch;
go

begin try
begin transaction;


    update Emission_Target
    set    TargetValue = TargetValue + 200
    where  TargetID = 1;

    print 'session b: locked Emission_Target (TargetID = 1)';

    waitfor delay '00:00:05';

    update Emission_Record
    set    EmissionValue = EmissionValue + 50
    where  RecordID = 1;

    print 'session b: locked Emission_Record (RecordID = 1)';

commit transaction;
print 'session b: committed successfully.';

end try
begin catch

if @@trancount > 0
    rollback transaction;

if error_number() = 1205
    print 'session b: chosen as deadlock victim. safe to retry.';
else
    print 'session b error: ' + error_message();

end catch;

--q4

begin transaction;
update Emission_Target
set    TargetValue = 22000
where  CompanyID = 1
and    Scope     = 'Scope 1';

if @@rowcount = 0
    print 'warning: no rows updated for CompanyID = 1.';
else
    print 'step 1 success: TargetValue updated to 22000 for CompanyID = 1.';

save transaction sp_firstupdate;
print 'savepoint created: sp_firstupdate';

update Emission_Target
set    TargetValue = 99999
where  CompanyID = 999
and    Scope     = 'Scope 1';

if @@rowcount = 0
begin
    print 'step 2 failed: CompanyID = 999 not found.';
    print 'rolling back to savepoint...';
    rollback transaction sp_firstupdate;
    print 'rolled back to savepoint. first update preserved.';
end
else
    print 'step 2 success: CompanyID = 999 updated.';


commit transaction;
print 'transaction committed with first update only.';

select
TargetID,
CompanyID,
Scope,
Year,
TargetValue
from Emission_Target
where CompanyID in (1, 999);
go

--q5

if object_id('Sites', 'U') is null
begin
create table Sites (
SiteID          int identity(1,1) primary key,
OrganizationID  int          not null,
SiteName        varchar(100) not null,
Location        varchar(100) null,
CreatedAt       datetime     not null default getdate()
);
print 'Sites table created.';
end

if object_id('Organizations', 'U') is null
begin
create table Organizations (
OrganizationID  int identity(1,1) primary key,
OrgName         varchar(100) not null,
CreatedAt       datetime     not null default getdate()
);
print 'Organizations table created.';


insert into Organizations (OrgName) values ('EcoMetra Corp');
print 'seeded: EcoMetra Corp as OrganizationID = 1';


end
go
if object_id('AddNewSite', 'P') is not null
drop procedure AddNewSite;
go

create procedure AddNewSite
@OrganizationID  int,
@SiteName        varchar(100),
@Location        varchar(100) = null
as
begin
set nocount on;
if @SiteName is null or ltrim(rtrim(@SiteName)) = ''
begin
print 'error: SiteName cannot be empty.';
return;
end

begin transaction;
    if not exists (
        select 1 from Organizations
        where  OrganizationID = @OrganizationID
    )
    begin
        rollback transaction;
        print 'error: OrganizationID ' + 
               cast(@OrganizationID as varchar) + 
              ' does not exist.';
        print 'site was not created. transaction rolled back.';
        return;
    end

    print 'organization found. proceeding with site insert...';

    insert into Sites (OrganizationID, SiteName, Location)
    values (@OrganizationID, @SiteName, @Location);

    -- capture the new SiteID for confirmation
    declare @new_site_id int = scope_identity();
    print 'success: new site created.';
    print 'SiteID         : ' + cast(@new_site_id    as varchar);
    print 'OrganizationID : ' + cast(@OrganizationID as varchar);
    print 'SiteName       : ' + @SiteName;
    print 'Location       : ' + isnull(@Location, 'not specified');
commit transaction;
print 'transaction committed successfully.';

end;

exec AddNewSite
@OrganizationID = 1,
@SiteName       = 'Lahore Plant',
@Location       = 'Lahore, Pakistan';

exec AddNewSite
@OrganizationID = 999,
@SiteName       = 'Ghost Site',
@Location       = 'Nowhere';

exec AddNewSite
@OrganizationID = 1,
@SiteName       = '',
@Location       = 'Karachi';

--q6

if object_id('Suppliers', 'U') is null
begin
create table Suppliers (
SupplierID   int identity(1,1) primary key,
SupplierName varchar(100) not null
);
insert into Suppliers (SupplierName) values
('EcoSupply Co'),
('GreenFuel Ltd'),
('CarbonBridge Inc');
print 'Suppliers table created and seeded.';
end

if object_id('Scopes', 'U') is null
begin
create table Scopes (
ScopeID   int identity(1,1) primary key,
ScopeName varchar(50) not null
);
insert into Scopes (ScopeName) values
('Scope 1'),
('Scope 2'),
('Scope 3');
print 'Scopes table created and seeded.';
end

if object_id('Sources', 'U') is null
begin
create table Sources (
SourceID   int identity(1,1) primary key,
SourceName varchar(100) not null,
SourceType varchar(50)  not null
);
insert into Sources (SourceName, SourceType) values
('Natural Gas Boiler', 'Natural Gas'),
('Diesel Generator',   'Diesel'),
('Grid Electricity',   'Electricity');
print 'Sources table created and seeded.';
end
go
if object_id('LogEmissionRecord', 'P') is not null
drop procedure LogEmissionRecord;
go
--drop procedure LogEmissionRecord
create procedure LogEmissionRecord
@SiteID        int,
@SupplierID    int,
@ScopeID       int,
@SourceID      int,
@EmissionType  varchar(100),
@EmissionValue decimal(18,4),
@RecordDate    date = null        -- defaults to today if not provided
as
begin
set nocount on;

if @RecordDate is null
    set @RecordDate = cast(getdate() as date);
if @EmissionValue < 0
begin
    print 'error: EmissionValue cannot be negative.';
    return;
end

if ltrim(rtrim(@EmissionType)) = ''
begin
    print 'error: EmissionType cannot be empty.';
    return;
end

begin transaction;

    declare @errors varchar(500) = '';

    if not exists (select 1 from Sites where SiteID = @SiteID)
        set @errors = @errors + 
            '  SiteID '     + cast(@SiteID     as varchar) + ' not found.' + char(13);

    if not exists (select 1 from Suppliers where SupplierID = @SupplierID)
        set @errors = @errors + 
            ' SupplierID ' + cast(@SupplierID as varchar) + ' not found.' + char(13);

    -- check ScopeID
    if not exists (select 1 from Scopes where ScopeID = @ScopeID)
        set @errors = @errors + 'ScopeID '    + cast(@ScopeID    as varchar) + ' not found.' + char(13);

    -- check SourceID
    if not exists (select 1 from Sources where SourceID = @SourceID)
        set @errors = @errors + 
            'SourceID '   + cast(@SourceID   as varchar) + ' not found.' + char(13);

    if len(@errors) > 0
    begin
        rollback transaction;
        print 'validation failed — record not inserted.';
        print 'errors found:';
        print @errors;
        print 'transaction rolled back.';
        return;
    end

    insert into Emission_Record (
        CompanyID,
        Scope,
        EmissionType,
        EmissionValue,
        RecordDate
    )
    select
        s.OrganizationID,       -- pull CompanyID from Sites
        sc.ScopeName,           -- pull Scope name from Scopes
        @EmissionType,
        @EmissionValue,
        @RecordDate
    from  Sites     s
    join  Scopes    sc on sc.ScopeID = @ScopeID
    where s.SiteID  = @SiteID;

    declare @new_record_id int = scope_identity();

    print 'success: emission record logged.';
    print 'RecordID      : ' + cast(@new_record_id  as varchar);
    print 'SiteID        : ' + cast(@SiteID         as varchar);
    print 'SupplierID    : ' + cast(@SupplierID     as varchar);
    print 'ScopeID       : ' + cast(@ScopeID        as varchar);
    print 'SourceID      : ' + cast(@SourceID       as varchar);
    print 'EmissionType  : ' + @EmissionType;
    print 'EmissionValue : ' + cast(@EmissionValue  as varchar);
    print 'RecordDate    : ' + cast(@RecordDate      as varchar);

commit transaction;
print 'transaction committed successfully.';


end;
exec LogEmissionRecord
@SiteID        = 1,
@SupplierID    = 1,
@ScopeID       = 1,
@SourceID      = 1,
@EmissionType  = 'Natural Gas',
@EmissionValue = 1200.50,
@RecordDate    = '2024-01-15';

exec LogEmissionRecord
@SiteID        = 999,
@SupplierID    = 1,
@ScopeID       = 1,
@SourceID      = 1,
@EmissionType  = 'Natural Gas',
@EmissionValue = 500.00;

--q7

if object_id('DeleteSourceIfUnused', 'P') is not null
drop procedure DeleteSourceIfUnused;

select * from Emission_Record

create procedure DeleteSourceIfUnused
@SourceID int
as
begin
set nocount on;

-- get the source name first to match against EmissionType
declare @SourceName varchar(100);

select @SourceName = SourceType 
FROM Sources 
where SourceID = @SourceID;

-- check if source exists at all
if @SourceName is null
begin
    print 'SourceID ' + cast(@SourceID as varchar) + ' does not exist.';
    return;
end

begin transaction;

    -- check if this source is referenced in Emission_Record via EmissionType
    if exists (
        select 1 from Emission_Record
        where EmissionType = @SourceName
    )
    begin
        rollback transaction;
        print 'SourceID ' + cast(@SourceID as varchar) + 
              ' (' + @SourceName + ') is in use. cannot delete. rolled back.';
        return;
    end

    -- not used — safe to delete
    delete from Sources where SourceID = @SourceID;

commit transaction;
print 'SourceID ' + cast(@SourceID as varchar) + 
      ' (' + @SourceName + ') deleted successfully.';

end;
go

-- fail
exec DeleteSourceIfUnused @SourceID = 1;

-- delete
exec DeleteSourceIfUnused @SourceID = 3;

-- fail
exec DeleteSourceIfUnused @SourceID = 999;

--q8

if object_id('sp_LogEmissionWithComplianceCheck', 'P') is not null
drop procedure sp_LogEmissionWithComplianceCheck;

create procedure sp_LogEmissionWithComplianceCheck
@SiteID        int,
@ScopeID       int,
@EmissionType  varchar(100),
@EmissionValue decimal(18,4),
@RecordDate    date = null
as
begin
set nocount on;

if @RecordDate is null
    set @RecordDate = cast(getdate() as date);
if @EmissionValue < 0
begin
    print 'error: EmissionValue cannot be negative.';
    return;
end

begin transaction;
    declare @OrganizationID int;
    declare @ScopeName      varchar(50);

    select 
        @OrganizationID = s.OrganizationID,
        @ScopeName      = sc.ScopeName
    from  Sites  s
    join  Scopes sc on sc.ScopeID = @ScopeID
    where s.SiteID = @SiteID;

    if @OrganizationID is null
    begin
        rollback transaction;
        print 'error: SiteID ' + cast(@SiteID as varchar) + ' not found. rolled back.';
        return;
    end

    print 'OrganizationID found: ' + cast(@OrganizationID as varchar);
    print 'Scope              : ' + @ScopeName;
    insert into Emission_Record (CompanyID, Scope, EmissionType, EmissionValue, RecordDate)
    values (@OrganizationID, @ScopeName, @EmissionType, @EmissionValue, @RecordDate);

    print 'new emission record inserted (RecordID: ' + 
           cast(scope_identity() as varchar) + ')';

    declare @TotalEmission decimal(18,4);
    declare @RecordYear    int = year(@RecordDate);

    select @TotalEmission = sum(EmissionValue)
    from   Emission_Record
    where  CompanyID = @OrganizationID
    and    Scope     = @ScopeName
    and    year(RecordDate) = @RecordYear;

    print 'total emissions for ' + @ScopeName + 
          ' in '                 + cast(@RecordYear    as varchar) + 
          ': '                   + cast(@TotalEmission as varchar);

    declare @TargetValue decimal(18,4);

    select @TargetValue = TargetValue
    from   Emission_Target
    where  CompanyID = @OrganizationID
    and    Scope     = @ScopeName
    and    Year      = @RecordYear;

    if @TargetValue is null
    begin
        rollback transaction;
        print 'error: no emission target found for OrganizationID ' + 
               cast(@OrganizationID as varchar) + 
              ', ' + @ScopeName + 
              ', Year ' + cast(@RecordYear as varchar) + '. rolled back.';
        return;
    end

    print 'emission target    : ' + cast(@TargetValue    as varchar);
    if @TotalEmission > @TargetValue
    begin
        rollback transaction;
        print 'warning: emission limit exceeded!';
        print 'total    : ' + cast(@TotalEmission as varchar);
        print 'target   : ' + cast(@TargetValue   as varchar);
        print 'exceeded by: ' + cast((@TotalEmission - @TargetValue) as varchar);
        print 'transaction rolled back. record not saved.';
        return;
    end

commit transaction;

print 'success: emission record saved.';
print 'total    : ' + cast(@TotalEmission as varchar);
print 'target   : ' + cast(@TargetValue   as varchar);
print 'remaining: ' + cast((@TargetValue - @TotalEmission) as varchar);

end;
--commint
exec sp_LogEmissionWithComplianceCheck
@SiteID        = 1,
@ScopeID       = 1,
@EmissionType  = 'Natural Gas',
@EmissionValue = 1000.00,
@RecordDate    = '2024-03-01';

-- should rollback
exec sp_LogEmissionWithComplianceCheck
@SiteID        = 1,
@ScopeID       = 1,
@EmissionType  = 'Diesel',
@EmissionValue = 99999.00,
@RecordDate    = '2024-03-15';

--q9

drop table Students
create table Students (
student_id    int identity(1,1) primary key,
student_name  varchar(100) not null,
average_grade float default 0
);

create table Assignments (
assignment_id int identity(1,1) primary key,
student_id    int not null,
score         int not null check (score between 0 and 100),
constraint fk_assignment_student
foreign key (student_id) references Students(student_id)
);

create trigger trg_UpdateStudentAverageGrade
on Assignments
after insert
as
begin
declare @student_id int;

select @student_id = student_id from inserted;

update Students
set    average_grade = (
           select avg(cast(score as float))
           from   Assignments
           where  student_id = @student_id
       )
where  student_id = @student_id;


end;

-- seed a student to test with
insert into Students (student_name) values ('Ali Hassan');
insert into Students (student_name) values ('Sara Khan');

-- test the trigger
insert into Assignments (student_id, score) values (1, 80);
insert into Assignments (student_id, score) values (1, 90);
insert into Assignments (student_id, score) values (1, 70);
insert into Assignments (student_id, score) values (2, 95);

-- verify average was auto updated
select s.student_id, s.student_name, s.average_grade
from   Students s;