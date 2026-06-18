//imports and dependencies
const sql = require('mssql');
require('dotenv').config();

// Database Configuration Object
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'MediQueue',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool;

// Establishes connection pool to SQL Server database
// Called once at application startup
async function connectDB() {
    try {
        pool = await sql.connect(config);
        console.log('Connected to SQL Server successfully!');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
}

// Returns the established connection pool for executing queries
// Used by all route files to access database
function getPool() {
    return pool;
}

module.exports = { sql, connectDB, getPool };
