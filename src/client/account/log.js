const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../database/dbconfig');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');

dotenv.config();

const app = express();
const { authenticateJWT } = require('../../database/dbconfig');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public', 'dangnhap-dangky')));

router.post('/register', async (req, res) => {
    try {
      const { fullname, phonenumber, email, password } = req.body;
      
      // Kiểm tra dữ liệu đầu vào
      if (!fullname || !phonenumber || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
      }
      
      // Kiểm tra xem email đã tồn tại chưa
      const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      
      // Kiểm tra xem số điện thoại đã tồn tại chưa
      const [existingPhones] = await pool.query('SELECT * FROM users WHERE phonenumber = ?', [phonenumber]);
      if (existingPhones.length > 0) {
        return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
      }
      
      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Thêm người dùng mới vào cơ sở dữ liệu
      const [result] = await pool.query(
        'INSERT INTO users (fullname, phonenumber, email, password) VALUES (?, ?, ?, ?)',
        [fullname, phonenumber, email, hashedPassword]
      );
      
      res.status(201).json({ userId: result.insertId, message: 'Đăng ký thành công' });
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      res.status(500).json({ message: 'Lỗi đăng ký', error: error.message });
    }
  });
  app.get('/dangky', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public','dangnhap-dangky', 'dangky.html'));
  });
  
// Thay đổi từ app sang router
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user.id, fullname: user.fullname });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
});

// Đảm bảo route được export

  
router.post('/login-test', async (req, res) => {
    try {
      const { email, password } = req.body;
      // Kiểm tra thông tin đăng nhập (đơn giản hóa cho mục đích test)
      if (email === 'vthuanng.it@gmail.com' && password === '111') {
        const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Login error', error: error.message });
    }
  });


router.get('/users/:id', authenticateJWT, async (req, res) => {
    try {
      const [users] = await pool.query('SELECT id, fullname, email, phonenumber FROM users WHERE id = ?', [req.params.id]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
      res.json(users[0]);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
    }
  });
  
  module.exports = router;
