const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '100103',
  database: process.env.DB_NAME || 'NLCN',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Sử dụng promise wrapper
const promisePool = pool.promise();

if (pool) {
  console.log('Connected to database');
} else {
  console.log('Failed to connect to database');
}

// Routes
app.get('/api/data', async (req, res) => {
  try {
    const [rows] = await promisePool.execute('SELECT * FROM your_table');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});