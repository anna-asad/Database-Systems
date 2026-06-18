--lab work 7
--24L-2519
--Aina Asad
-- Use master and drop database if it already exists
USE master;
GO
-- Create the database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CursedTitansDB')
BEGIN
    CREATE DATABASE CursedTitansDB;
END
GO

-- Use the database
USE CursedTitansDB;
GO

-- to delete table in ssms
IF OBJECT_ID('Battle_Participants', 'U') IS NOT NULL DROP TABLE Battle_Participants;
IF OBJECT_ID('Character_Techniques', 'U') IS NOT NULL DROP TABLE Character_Techniques;
IF OBJECT_ID('Battle_Techniques', 'U') IS NOT NULL DROP TABLE Battle_Techniques;
IF OBJECT_ID('Mission_Assignments', 'U') IS NOT NULL DROP TABLE Mission_Assignments;
IF OBJECT_ID('Character_Artifacts', 'U') IS NOT NULL DROP TABLE Character_Artifacts;

IF OBJECT_ID('Characters', 'U') IS NOT NULL DROP TABLE Characters;
IF OBJECT_ID('Battles', 'U') IS NOT NULL DROP TABLE Battles;
IF OBJECT_ID('Locations', 'U') IS NOT NULL DROP TABLE Locations;
IF OBJECT_ID('Techniques', 'U') IS NOT NULL DROP TABLE Techniques;
IF OBJECT_ID('Artifacts', 'U') IS NOT NULL DROP TABLE Artifacts;
IF OBJECT_ID('Missions', 'U') IS NOT NULL DROP TABLE Missions;
IF OBJECT_ID('Prophecies', 'U') IS NOT NULL DROP TABLE Prophecies;


-- Table for Characters (Titan-shifters, Jujutsu sorcerers, or both)
CREATE TABLE Characters (
    character_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    faction NVARCHAR(50) CHECK (faction IN ('Titan-shifter', 'Jujutsu Sorcerer', 'Hybrid')),
    titan_form NVARCHAR(100) NULL, -- Null if not a Titan-shifter
    cursed_technique NVARCHAR(100) NULL, -- Null if not a Sorcerer
    rank NVARCHAR(50), -- e.g., "Elite", "Captain"
    backstory TEXT,
    created_at DATETIME DEFAULT GETDATE()
);

-- Table for Locations (Walls, cursed shrines, battlefields)
CREATE TABLE Locations (
    location_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    type NVARCHAR(50) CHECK (type IN ('Wall', 'Cursed Shrine', 'Battlefield')),
    cursed_contamination_level INT CHECK (cursed_contamination_level BETWEEN 0 AND 100),
    historical_significance TEXT,
    created_at DATETIME DEFAULT GETDATE()
);

-- Table for Battles (events where characters fought)
CREATE TABLE Battles (
    battle_id INT IDENTITY(1,1) PRIMARY KEY,
    location_id INT NOT NULL,
    battle_date DATETIME NOT NULL,
    outcome NVARCHAR(100), -- e.g., "Victory", "Defeat", "Stalemate"
    summary TEXT,
    FOREIGN KEY (location_id) REFERENCES Locations(location_id) ON DELETE CASCADE
);

-- Many-to-Many: Characters participating in Battles
CREATE TABLE Battle_Participants (
    battle_id INT,
    character_id INT,
    PRIMARY KEY (battle_id, character_id),
    FOREIGN KEY (battle_id) REFERENCES Battles(battle_id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES Characters(character_id) ON DELETE CASCADE
);

-- Table for Techniques (Titan abilities & Jujutsu techniques)
CREATE TABLE Techniques (
    technique_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    type NVARCHAR(50) CHECK (type IN ('Titan Ability', 'Jujutsu Technique')),
    power_level INT CHECK (power_level BETWEEN 1 AND 100),
    description TEXT,
    created_at DATETIME DEFAULT GETDATE()
);

-- Many-to-Many: Characters mastering Techniques
CREATE TABLE Character_Techniques (
    character_id INT,
    technique_id INT,
    mastery_level INT CHECK (mastery_level BETWEEN 1 AND 100),
    last_updated DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (character_id, technique_id),
    FOREIGN KEY (character_id) REFERENCES Characters(character_id) ON DELETE CASCADE,
    FOREIGN KEY (technique_id) REFERENCES Techniques(technique_id) ON DELETE CASCADE
);

-- Many-to-Many: Techniques used in Battles
CREATE TABLE Battle_Techniques (
    battle_id INT,
    technique_id INT,
    PRIMARY KEY (battle_id, technique_id),
    FOREIGN KEY (battle_id) REFERENCES Battles(battle_id) ON DELETE CASCADE,
    FOREIGN KEY (technique_id) REFERENCES Techniques(technique_id) ON DELETE CASCADE
);

-- Table for Ancient Artifacts
CREATE TABLE Artifacts (
    artifact_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    effect TEXT,
    rarity NVARCHAR(50) CHECK (rarity IN ('Common', 'Rare', 'Legendary')),
    discovered_at DATETIME DEFAULT GETDATE()
);

-- Many-to-Many: Characters possessing Artifacts
CREATE TABLE Character_Artifacts (
    character_id INT,
    artifact_id INT,
    PRIMARY KEY (character_id, artifact_id),
    FOREIGN KEY (character_id) REFERENCES Characters(character_id) ON DELETE CASCADE,
    FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE CASCADE
);

-- Table for Prophecies (foreshadowing events)
CREATE TABLE Prophecies (
    prophecy_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    content TEXT,
    predicted_outcome TEXT,
    created_at DATETIME DEFAULT GETDATE()
);

-- Table for Missions (team-based operations)
CREATE TABLE Missions (
    mission_id INT IDENTITY(1,1) PRIMARY KEY,
    objective TEXT NOT NULL,
    status NVARCHAR(50) CHECK (status IN ('Pending', 'Ongoing', 'Completed', 'Failed')),
    success_criteria TEXT,
    discovered_clues TEXT,
    mission_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Many-to-Many: Characters assigned to Missions
CREATE TABLE Mission_Assignments (
    mission_id INT,
    character_id INT,
    PRIMARY KEY (mission_id, character_id),
    FOREIGN KEY (mission_id) REFERENCES Missions(mission_id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES Characters(character_id) ON DELETE CASCADE
);

-- Use the database
USE CursedTitansDB;
GO

-- Insert data into Characters
INSERT INTO Characters (name, faction, titan_form, cursed_technique, rank, backstory)
VALUES 
('Eren Yeager', 'Hybrid', 'Attack Titan', 'Binding Vows', 'Elite', 'Once a soldier, now a revolutionary.'),
('Gojo Satoru', 'Jujutsu Sorcerer', NULL, 'Limitless', 'Captain', 'Strongest sorcerer of his time.'),
('Levi Ackerman', 'Titan-shifter', 'Beast Titan', NULL, 'Elite', 'Legendary fighter with lightning-fast strikes.'),
('Yuji Itadori', 'Hybrid', 'War Hammer Titan', 'Divergent Fist', 'Elite', 'A host of Sukuna with Titan abilities.'),
('Mikasa Ackerman', 'Jujutsu Sorcerer', NULL, 'Heavenly Restriction', 'Elite', 'A warrior with immense physical prowess.');

-- Insert data into Locations
INSERT INTO Locations (name, type, cursed_contamination_level, historical_significance)
VALUES 
('Wall Maria', 'Wall', 30, 'The first major Titan breach occurred here.'),
('Cursed Shrine of Ryomen Sukuna', 'Cursed Shrine', 95, 'The resting place of the King of Curses.'),
('Shiganshina District', 'Battlefield', 60, 'Site of multiple Titan invasions.'),
('Hidden Village of Sorcery', 'Cursed Shrine', 80, 'A lost stronghold of ancient jujutsu masters.'),
('Titan Forest', 'Battlefield', 50, 'A dense area where Titan battles frequently take place.');

-- Insert data into Battles
INSERT INTO Battles (location_id, battle_date, outcome, summary)
VALUES 
(1, '2025-02-14', 'Victory', 'The Survey Corps managed to push back the Titans.'),
(2, '2025-03-01', 'Defeat', 'Sukuna’s cursed energy overwhelmed the forces.'),
(3, '2025-03-10', 'Stalemate', 'Both sides suffered heavy losses.'),
(4, '2025-04-05', 'Victory', 'A secret jujutsu technique banished multiple Titans.'),
(5, '2025-04-20', 'Defeat', 'A new unknown curse emerged, forcing retreat.');

-- Insert data into Battle_Participants
INSERT INTO Battle_Participants (battle_id, character_id)
VALUES 
(1, 1), (1, 3), (2, 2), (2, 4), (3, 5),
(3, 1), (4, 2), (4, 3), (5, 4), (5, 5);

-- Insert data into Techniques
INSERT INTO Techniques (name, type, power_level, description)
VALUES 
('Hardening', 'Titan Ability', 85, 'Allows a Titan to reinforce its body with hardened skin.'),
('Infinite Void', 'Jujutsu Technique', 95, 'Traps enemies in an infinite state of perception.'),
('War Hammer Strike', 'Titan Ability', 90, 'Forms weapons from Titan flesh.'),
('Black Flash', 'Jujutsu Technique', 88, 'Enhances physical attacks with cursed energy.'),
('Beast Roar', 'Titan Ability', 80, 'A devastating roar that paralyzes enemies.');

-- Insert data into Character_Techniques
INSERT INTO Character_Techniques (character_id, technique_id, mastery_level)
VALUES 
(1, 1, 90), (2, 2, 100), (3, 5, 85), (4, 3, 92), (5, 4, 88);

-- Insert data into Battle_Techniques
INSERT INTO Battle_Techniques (battle_id, technique_id)
VALUES 
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5);

-- Insert data into Artifacts
INSERT INTO Artifacts (name, effect, rarity, discovered_at)
VALUES 
('Cursed Dagger', 'Can pierce through Titan flesh with ease.', 'Rare', '2025-01-10'),
('War Hammer Core', 'Boosts War Hammer Titan abilities.', 'Legendary', '2025-02-22'),
('Seal of Binding', 'Restricts a Titan’s transformation.', 'Legendary', '2025-03-05'),
('Infinity Orb', 'Enhances jujutsu techniques.', 'Rare', '2025-03-15'),
('Beast Pendant', 'Strengthens Beast Titan’s control.', 'Common', '2025-04-01');

-- Insert data into Character_Artifacts
INSERT INTO Character_Artifacts (character_id, artifact_id)
VALUES 
(1, 1), (2, 4), (3, 5), (4, 2), (5, 3);

-- Insert data into Prophecies
INSERT INTO Prophecies (title, content, predicted_outcome)
VALUES 
('The Fall of the Walls', 'A great Titan infused with cursed energy will bring destruction.', 'A cataclysmic war.'),
('The Sorcerer’s Sacrifice', 'A powerful sorcerer must be sacrificed to break the curse.', 'A new era of balance.'),
('The Forbidden Transformation', 'A Titan-shifter who masters jujutsu will become unstoppable.', 'A godlike warrior.'),
('The Lost Ritual', 'A secret technique exists to permanently sever the Titan curse.', 'The end of the Titan age.'),
('The Eternal War', 'As long as hatred exists, the Titans and curses will never vanish.', 'A never-ending cycle.');

-- Insert data into Missions
INSERT INTO Missions (objective, status, success_criteria, discovered_clues, mission_date)
VALUES 
('Recover the War Hammer Core.', 'Completed', 'Retrieve the artifact.', 'It was hidden in a cursed shrine.', '2025-02-22'),
('Investigate the Titan-Curse Fusion.', 'Ongoing', 'Determine the origin of the hybrid forms.', 'A sorcerer-Titan connection found.', '2025-03-10'),
('Defend Wall Maria from invasion.', 'Completed', 'Prevent breach.', 'Titans with cursed energy are stronger.', '2025-02-14'),
('Find the Lost Ritual.', 'Pending', 'Locate ancient texts.', 'The ritual might be hidden in a sorcerer’s vault.', '2025-04-01'),
('Assassinate a rogue Titan-shifter.', 'Ongoing', 'Eliminate the target.', 'He has mastered both Titan and jujutsu abilities.', '2025-03-20');

-- Insert data into Mission_Assignments
INSERT INTO Mission_Assignments (mission_id, character_id)
VALUES 
(1, 4), (1, 5), (2, 2), (2, 1), (3, 3),
(3, 1), (4, 5), (4, 2), (5, 3), (5, 4);

-- Sample Queries:

-- 1. Retrieve top 3 characters who have combined Titan transformation with high-level jujutsu techniques in battle
SELECT TOP 3 c.name, COUNT(bt.battle_id) AS battle_count
FROM Characters c
JOIN Character_Techniques ct ON c.character_id = ct.character_id
JOIN Techniques t ON ct.technique_id = t.technique_id
JOIN Battle_Participants bp ON c.character_id = bp.character_id
JOIN Battle_Techniques bt ON bp.battle_id = bt.battle_id AND bt.technique_id = t.technique_id
WHERE c.faction = 'Hybrid' AND t.power_level > 80
GROUP BY c.name
ORDER BY battle_count DESC;

-- 2. Retrieve all missions that resulted in significant artifact recoveries
SELECT m.mission_id, m.objective, a.name AS artifact_name
FROM Missions m
JOIN Mission_Assignments ma ON m.mission_id = ma.mission_id
JOIN Character_Artifacts ca ON ma.character_id = ca.character_id
JOIN Artifacts a ON ca.artifact_id = a.artifact_id
WHERE a.rarity = 'Legendary';

-- 3. Find all battles fought at cursed locations with contamination level above 70
SELECT b.battle_id, b.battle_date, l.name AS location_name, l.cursed_contamination_level
FROM Battles b
JOIN Locations l ON b.location_id = l.location_id
WHERE l.cursed_contamination_level > 70;

-- 4. Identify the number of battles each character has participated in
SELECT c.name, COUNT(bp.battle_id) AS battles_fought
FROM Characters c
LEFT JOIN Battle_Participants bp ON c.character_id = bp.character_id
GROUP BY c.name
ORDER BY battles_fought DESC;

-- 5. Get all characters who have mastered a jujutsu technique with power level above 90
SELECT c.name, t.name AS technique_name, ct.mastery_level
FROM Characters c
JOIN Character_Techniques ct ON c.character_id = ct.character_id
JOIN Techniques t ON ct.technique_id = t.technique_id
WHERE t.type = 'Jujutsu Technique' AND t.power_level > 90
ORDER BY ct.mastery_level DESC;



--1
create table char_login
(
log_id int identity(1,1) primary key,
char_id int,
name varchar(50),
type varchar(50),
logged_at datetime default getdate()
)


create trigger trig_characterlogin
on Characters
after insert as
begin
insert into char_login(char_id,name , type)
select  i.character_id,i.name, i.faction
from inserted i --virtual tbale 
where i.faction in ('Titan Shifter','Jujutsu Sorcerer')
end;

--testinggg
INSERT INTO Characters (name, faction, titan_form, cursed_technique, rank, backstory)
VALUES ('Hange Zoë', 'Jujutsu Sorcerer', NULL, 'Cursed Technique Example', 'Captain', 'Brilliant researcher and leader');


select * from Characters;
select * from char_login;


--2
create table rank_log (
log_id       int identity(1,1) primary key ,
character_id int ,
name         varchar(100),
old_rank     varchar(50),
new_rank     varchar(50),
changed_at   datetime default getdate()
)


create trigger trig_logRankchange
on Characters
after update as
begin
if update(rank)
begin
insert into rank_log(character_id, name, old_rank, new_rank)
select d.character_id, d.name, d.rank, i.rank
from deleted d
join inserted i on d.character_id=i.character_id
where d.rank<> i.rank
end
end;

--testt
UPDATE Characters
SET rank = 'Elite'
WHERE name = 'Hange Zoë';

select * from rank_log;


--3
create trigger tri_savegojo
on Characters
instead of delete as

begin

if exists(select 1 from deleted where name='Gojo Satoru')
begin raiserror('YOU CANNOT DELETE THE BELOVEDDD CHARACTER GOJO SATORU',16,1)
return;
end;

delete from Characters
where character_id in (select character_id from deleted)

end;

-- testing
Delete from Characters where name = 'Gojo Satoru';

--4
-- we'll have to add a power_level column to characters table
alter table Characters
add power_level INT

create trigger trig_minlevel
on Characters
after insert as
begin
if exists 
(
select 1 from inserted where faction='Jujutsu Sorcerer' and  power_level < 30 
)
begin
raiserror('YOU cannot enter with less than powerlevel 30',16,1)
return
end
end

--to test
INSERT INTO Characters (name, faction, power_level)
VALUES ('Weak Sorcerer', 'Jujutsu Sorcerer', 20);

--5
create trigger trig_cannotreducelevel
on Character_Techniques
after update as
begin
if exists
(
select 1 from deleted d 
join inserted i on d.character_id=  i.character_id
and  d.technique_id = i.technique_id
where i.mastery_level < d.mastery_level
)
begin raiserror('NOOO you cannot reduce the master level of a warrior , it isnt possibleeee ',16,1)
rollback transaction
end
end

--test
select * from Character_Techniques
UPDATE Character_Techniques
SET mastery_level = 90
WHERE character_id = 2 AND technique_id = 2;


--6

create trigger trg_PreventDropCharacters
ON database
for DROP_TABLE
as 
begin
    declare @tableName NVARCHAR(100);
    set @tableName = EVENTDATA().value('(/EVENT_INSTANCE/ObjectName)[1]', 'NVARCHAR(100)');

    if @tableName = 'Characters'
    begin
        RAISERROR('Dropping the Characters table is not allowed.', 16, 1);
        rollback;
    end
end
--test
DROP TABLE Characters;


--7

create table logchanges(
    audit_id int identity(1,1) primary key,
    changedate datetime default getdate(),
    changetype nvarchar(100),     
    tablename nvarchar(128),    
    tsql_command nvarchar(max)     
)

create trigger track_changes
on database
for drop_table, alter_table, create_table
as
begin
    declare @eventdata xml = eventdata()
    insert into logchanges (changetype, tablename, tsql_command)
    values (
        @eventdata.value('(/event_instance/eventtype)[1]', 'nvarchar(100)'),
        @eventdata.value('(/event_instance/objectname)[1]', 'nvarchar(128)'),
        @eventdata.value('(/event_instance/tsqlcommand/commandtext)[1]', 'nvarchar(max)')
    )
end

--test
create table newtable(
    nameid int
)

select * from logchanges
go





--8
use master
go

create trigger trg_restrictloginhours
on all server
for logon
as
begin
    declare @currenthour int = datepart(hour, getdate())
    declare @loginname nvarchar(100) = original_login()

    -- exclude admin users from this restriction
    if @loginname not in ('sa', 'admin_user') 
       and (@currenthour < 9 or @currenthour >= 18)
    begin
        raiserror('logins are only allowed between 9 am and 6 pm.', 16, 1)
        rollback
    end
end
--no test

--9

-- create the tracking table
--if object_id('battle_strongest_hybrid', 'u') is not null 
--drop table battle_strongest_hybrid

create table battle_strongest_hybrid (
    battle_id    int primary key,
    warrior_name varchar(100),
    mastery_level int,
    recorded_at  datetime default getdate()
)
-- create the trigger
create trigger trg_trackstrongesthybrid
on battles
after insert
as
begin
    insert into battle_strongest_hybrid (battle_id, warrior_name, mastery_level)
    select 
        i.battle_id,
        c.name,
        max(ct.mastery_level) as mastery_level
    from inserted i
    cross join characters c
    join character_techniques ct on c.character_id = ct.character_id
    where c.faction = 'hybrid'
    group by i.battle_id, c.name
    having max(ct.mastery_level) = (
        select max(mastery_level)
        from character_techniques ct2
        join characters c2 on ct2.character_id = c2.character_id
        where c2.faction = 'hybrid'
    )
end


--testing
SELECT c.character_id, c.name, c.faction, ct.mastery_level
FROM Characters c
JOIN Character_Techniques ct ON c.character_id = ct.character_id
WHERE c.faction = 'Hybrid';
INSERT INTO Battles (location_id, battle_date, outcome, summary)
VALUES (1, GETDATE(), 'Victory', 'Survey Corps pushed back titans');

SELECT * FROM Battles;
SELECT * FROM Battle_Strongest_Hybrid;