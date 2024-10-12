const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

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
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
pool.getConnection().then(() => {
  console.log('Đã kết nối đến cơ sở dữ liệu');
}).catch((err) => {
  console.error('Lỗi kết nối đến cơ sở dữ liệu', err);
});

module.exports = { pool, authenticateJWT };
