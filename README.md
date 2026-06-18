# Database Systems Lab Work

A collection of SQL Server (T-SQL) lab assignments and exercises from my Database Systems course. Each file is self-contained — it creates its own database, builds the schema, inserts sample data, and then runs the queries or logic being practiced.

## Topics Covered

- Schema design with primary keys, foreign keys, and constraints (CHECK, UNIQUE, NOT NULL)
- Joins (INNER, LEFT, self-joins) with GROUP BY and HAVING
- Subqueries — scalar, nested, and correlated
- CTEs and multi-table aggregation
- Views and stored procedures
- Scalar functions and computed columns
- Triggers at the row level (DML), schema level (DDL), and server level (logon)
- Transactions, savepoints, TRY/CATCH error handling, and deadlock simulation
- Core SQL theory: DDL/DML/DCL/TCL, data types, and built-in functions

## Files

### Theory
| File | Description |
|---|---|
| `sql-fundamentals-theory-and-data-types.md` | Write-up covering the four SQL sub-languages (DDL, DML, DCL, TCL), numeric/date/string data type categories, and aggregate, string, math, and date functions. |

### Schema, Constraints & Basic Queries
| File | Description |
|---|---|
| `sql-create-database-and-tables.sql` | First pass at creating a database and basic tables. |
| `sql-constraints-and-keys-lab.sql` | Primary/foreign keys, CHECK constraints, cascading updates, ALTER TABLE, and basic CRUD operations. |

### Joins, Subqueries & Aggregation
| File | Description |
|---|---|
| `sql-multitable-where-and-aggregates.sql` | WHERE filtering with comparison/logical operators, LIKE, ORDER BY, and aggregate functions across several themed tables. |
| `sql-subqueries-aggregate-functions.sql` | Scalar subqueries combined with MAX/AVG to find top values and unmatched rows via NOT IN. |
| `sql-nested-subqueries-practice.sql` | A set of nested and correlated subquery problems. |
| `sql-joins-groupby-having.sql` | INNER/LEFT JOINs across many-to-many tables with GROUP BY, COUNT, SUM, AVG, and HAVING. |
| `sql-left-joins-and-self-joins.sql` | LEFT JOIN for surfacing unmatched rows and self-joins, including a self-referencing foreign key. |
| `sql-cte-aggregation-joins.sql` | A CTE used to compute an average, plus grouped multi-table and self-referencing joins filtered with HAVING. |

### Views, Functions & Stored Procedures
| File | Description |
|---|---|
| `sql-views-and-stored-procedures.sql` | Views built with subqueries and joins, plus stored procedures with conditional logic and parameterized inserts/updates. |
| `sql-scalar-functions-and-triggers.sql` | Scalar (dbo) functions feeding computed columns, alongside triggers for duplicate-blocking and emergency alerts. |

### Triggers
| File | Description |
|---|---|
| `sql-triggers-dml-ddl-server.sql` | Row-level DML triggers (AFTER INSERT/UPDATE, INSTEAD OF DELETE with rollback), database-scoped DDL triggers, and a server-level logon trigger. |
| `sql-while-loops-and-triggers.sql` | Procedural WHILE-loop logic for row-by-row processing, paired with DELETE/UPDATE/DROP/ALTER triggers. |

### Transactions & Error Handling
| File | Description |
|---|---|
| `sql-transactions-and-error-handling.sql` | Transaction control with COMMIT/ROLLBACK, savepoints, TRY/CATCH error handling, and a two-session deadlock simulation. |

## Tooling

All scripts were written and tested in SQL Server (T-SQL syntax via SSMS).
