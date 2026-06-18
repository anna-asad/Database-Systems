--lab work
--24L-2519
--Aina Asad

-- Create Database
CREATE DATABASE PowerPuffDB;
GO
USE PowerPuffDB;
GO

-- Table: Creature
CREATE TABLE Creature (
    CreatureID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Type VARCHAR(10) CHECK (Type IN ('Hero', 'Villain')) NOT NULL,
    SpecificPowerID INT, -- A creature has one specific power
    Status VARCHAR(10) CHECK (Status IN ('Alive', 'Dead')) NOT NULL DEFAULT 'Alive'
);
GO

-- Table: Ingredient
CREATE TABLE Ingredient (
    IngredientID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT
);
GO

-- Table: Creature_Ingredient (4NF - Resolving multi-valued dependency)
CREATE TABLE Creature_Ingredient (
    CreatureID INT,
    IngredientID INT,
    PRIMARY KEY (CreatureID, IngredientID),
    FOREIGN KEY (CreatureID) REFERENCES Creature(CreatureID) ON DELETE CASCADE,
    FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID) ON DELETE CASCADE
);
GO

-- Table: Power
CREATE TABLE Power (
    PowerID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT
);
GO

-- Table: Creature_Power (A creature can have multiple powers)
CREATE TABLE Creature_Power (
    CreatureID INT,
    PowerID INT,
    PRIMARY KEY (CreatureID, PowerID),
    FOREIGN KEY (CreatureID) REFERENCES Creature(CreatureID) ON DELETE CASCADE,
    FOREIGN KEY (PowerID) REFERENCES Power(PowerID) ON DELETE CASCADE
);
GO

-- Table: FamilyRelation (4NF - Resolving multi-valued dependency)
CREATE TABLE FamilyRelation (
    RelationID INT IDENTITY(1,1) PRIMARY KEY,
    Creature1ID INT,
    Creature2ID INT,
    RelationType VARCHAR(20) CHECK (RelationType IN ('Sibling', 'Parent-Child', 'Cousin', 'Other')),
    FOREIGN KEY (Creature1ID) REFERENCES Creature(CreatureID) ON DELETE NO ACTION,
    FOREIGN KEY (Creature2ID) REFERENCES Creature(CreatureID) ON DELETE NO ACTION
);
GO

-- Table: Fight (Tracking battles)
CREATE TABLE Fight (
    FightID INT IDENTITY(1,1) PRIMARY KEY,
    Creature1ID INT,
    Creature2ID INT,
    WinnerID INT NULL,
    Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Creature1ID) REFERENCES Creature(CreatureID) ON DELETE NO ACTION,
    FOREIGN KEY (Creature2ID) REFERENCES Creature(CreatureID) ON DELETE NO ACTION,
    FOREIGN KEY (WinnerID) REFERENCES Creature(CreatureID) ON DELETE SET NULL
);
GO

-- Table: DeathLog (Tracking creature deaths)
CREATE TABLE DeathLog (
    DeathID INT IDENTITY(1,1) PRIMARY KEY,
    CreatureID INT,
    DeathDate DATETIME DEFAULT GETDATE(),
    Cause TEXT,
    FOREIGN KEY (CreatureID) REFERENCES Creature(CreatureID) ON DELETE CASCADE
);
GO

-- Table: Rank (Tracking ranks of creatures)
CREATE TABLE Rank (
    RankID INT IDENTITY(1,1) PRIMARY KEY,
    CreatureID INT,
    Level INT CHECK (Level >= 1),
    FOREIGN KEY (CreatureID) REFERENCES Creature(CreatureID) ON DELETE CASCADE
);
GO

-- Insert Ingredients
INSERT INTO Ingredient (Name, Description) VALUES
('Sugar', 'Sweetness essence'),
('Spice', 'Adds courage'),
('Everything Nice', 'Perfect balance'),
('Chemical X', 'Superpower catalyst');
GO

-- Insert Powers
INSERT INTO Power (Name, Description) VALUES
('Super Strength', 'Can lift heavy objects'),
('Flight', 'Ability to fly'),
('Laser Eyes', 'Shoots energy beams'),
('Invisibility', 'Can disappear at will');
GO

-- Insert Creatures
INSERT INTO Creature (Name, Type, SpecificPowerID, Status) VALUES
('Blossom', 'Hero', 1, 'Alive'),
('Bubbles', 'Hero', 2, 'Alive'),
('Buttercup', 'Hero', 3, 'Alive'),
('Mojo Jojo', 'Villain', 4, 'Alive'),
('Him', 'Villain', 3, 'Alive'),
('Fuzzy Lumpkins', 'Villain', 1, 'Alive');
GO

-- Assign Ingredients to Creatures
INSERT INTO Creature_Ingredient (CreatureID, IngredientID) VALUES
(1,1), (1,2), (1,3), (1,4),
(2,1), (2,3), (2,4),
(3,2), (3,3), (3,4),
(4,4),
(5,4),
(6,4);
GO

-- Assign Additional Powers to Creatures
INSERT INTO Creature_Power (CreatureID, PowerID) VALUES
(1,2), (1,3),
(2,3), (2,4),
(3,1), (3,4),
(4,1), (4,3),
(5,2), (5,3),
(6,1), (6,2);
GO

-- Define Family Relations
INSERT INTO FamilyRelation (Creature1ID, Creature2ID, RelationType) VALUES
(1,2,'Sibling'),
(1,3,'Sibling'),
(2,3,'Sibling');
GO

-- Log a Fight
INSERT INTO Fight (Creature1ID, Creature2ID, WinnerID) VALUES
(1,4,1),
(2,5,2),
(3,6,3);
GO

-- Log a Death
INSERT INTO DeathLog (CreatureID, Cause) VALUES
(4, 'Defeated by Blossom'),
(5, 'Defeated by Bubbles');
GO

-- Assign Ranks
INSERT INTO Rank (CreatureID, Level) VALUES
(1,10),
(2,9),
(3,8);
GO





select * from Creature
select * from Ingredient
select * from Creature_Ingredient 
select * from Power
select * from Creature_Power
select * from FamilyRelation
select * from Fight
select * from DeathLog
select * from Rank







--q1
select c.CreatureID,c.Name
from Creature c
where c.CreatureID=( select CreatureID from Rank where RankID=( select top 1 rankID from Rank))

--q2 
select I.IngredientID,I.Name from Ingredient I
where i.IngredientID= (select top 1 ingredientID 
from Creature_Ingredient 
group by IngredientID
order by count(*) desc
)

--q3
select top 1 c.CreatureID, c.Name, count(*) as BattleCount
--select c.CreatureID, c.Name, count(*) as BattleCount
from Creature c
where c.CreatureID in (
    select Creature1ID from Fight)
or c.CreatureID in (select Creature2ID from Fight)
group by c.CreatureID, c.Name
order by count(*) desc

--q4
select c.CreatureID, c.Name
from Creature c
where c.CreatureID in (
select CreatureID
from Creature_Power
group by CreatureID
having count(*) = 1
)

--q5
select c.CreatureID, c.Name
from Creature c
where c.CreatureID in 
( select WinnerID from Fight
where WinnerID is not null )
and c.CreatureID not in 
(
select Creature1ID from Fight 
where Creature1ID != WinnerID )
and c.CreatureID not in 
(
select Creature2ID from Fight 
where Creature2ID != WinnerID 
)

--q6
select top 1 c.CreatureID, c.Name from Creature c
where c.CreatureID in 
(
select Creature1ID from FamilyRelation
where RelationType = 'Sibling'
)
or c.CreatureID in 
(
select Creature2ID from FamilyRelation
where RelationType = 'Sibling'
)
order by c.CreatureID desc

--q7(shows all bcz all have maximum powers=2)
select c.CreatureID, c.Name
--select top 1 c.CreatureID, c.Name
-- to show only one creatuee
from Creature c
where c.CreatureID in (
select CreatureID from Creature_Power
group by CreatureID
having count(*) = (
select max(PowerCount) from (
select count(*) as PowerCount
from Creature_Power
group by CreatureID ) as MaxPowers)
)

--q8
select c.CreatureID, c.Name
from Creature c
where c.CreatureID in (
select Creature1ID from Fight
group by Creature1ID
having count(*) >= 2
)
or c.CreatureID in (
select Creature2ID from Fight
group by Creature2ID
having count(*) >= 2
)

--q9
select c.CreatureID, c.Name
from Creature c
where c.CreatureID in ( select CreatureID from DeathLog)
and c.CreatureID in ( select CreatureID from Rank
)

--q10
select c.CreatureID, c.Name
from Creature c
where c.CreatureID in (
select CreatureID
from Creature_Ingredient
where IngredientID in (select IngredientID
from Ingredient
where Name = 'Chemical X')
)


--q11
select top 1 c.CreatureID, c.Name
from Creature c
where c.CreatureID = (
select top 1 CreatureID
from (
select Creature1ID as CreatureID, count(distinct Creature2ID) as OpponentCount
from Fight
group by Creature1ID
) as MaxPowers
order by OpponentCount desc
)