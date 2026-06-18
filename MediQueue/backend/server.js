const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/billing', require('./routes/billing'));

// Test route
app.get('/', (req, res) => {
    res.send('MediQueue API is running!');
});

// Start server and connect to database
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, '127.0.0.1', () => {
            console.log(`✅ Backend API is running on http://127.0.0.1:${PORT}`);
            console.log(`🚀 Database connected successfully.`);
        });
    } catch (err) {
        console.error('❌ FAILED TO START SERVER');
        console.error('Error Details:', err.message);
        console.log('Check if your SQL Server is running and .env credentials are correct.');
        process.exit(1);
    }
}

startServer();
