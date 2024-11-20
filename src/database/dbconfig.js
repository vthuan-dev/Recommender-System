const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Middleware xác thực JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth Header:', authHeader);
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('JWT Verify Error:', err);
        return res.sendStatus(403);
      }
      console.log('Decoded User:', user);
      req.user = user;
      next();
    });
  } else {
    console.log('No Auth Header');
    res.sendStatus(401);
  }
};
// Tạo pool connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '100103',
  database: process.env.DB_NAME || 'NLCN',
  port: parseInt(process.env.DB_PORT, 10) || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Thêm đoạn code này để kiểm tra kết nối
pool.query('SELECT 1')
  .then(() => {
    console.log('Kết nối đến cơ sở dữ liệu thành công');
  })
  .catch((err) => {
    console.error('Lỗi kết nối đến cơ sở dữ liệu:', err);
  });

// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
// console.log('DB_NAME:', process.env.DB_NAME);
// console.log('DB_PORT:', process.env.DB_PORT);

module.exports = { pool, authenticateJWT };
