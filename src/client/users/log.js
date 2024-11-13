const express = require('express');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const { pool } = require('../../database/dbconfig');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('../../config/passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const router = express.Router();
dotenv.config();

// Session middleware
router.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
router.use(passport.initialize());
router.use(passport.session());

// Giữ nguyên CORS config từ code cũ
const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

router.use(cors(corsOptions));
router.options('*', cors(corsOptions));

// Google OAuth routes
router.get('/api/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

router.get('/api/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false
  }),
  async (req, res) => {
    try {
      const { id, fullname, email, role_name } = req.user;
      
      const token = jwt.sign(
        { userId: id, role: role_name || 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Redirect về frontend với params
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?` + 
        `token=${token}&` +
        `userId=${id}&` +
        `fullname=${encodeURIComponent(fullname)}&` +
        `email=${encodeURIComponent(email)}&` +
        `role=${role_name || 'customer'}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

router.get('/dangky', (req, res) => {
    const filePath = path.join(__dirname, '../../../public/dangnhap-dangky/dangky.html');
    

    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(filePath);
    } else {
        console.error('File not found:', filePath);
        res.status(404).send('File not found');
    }
});


router.get('/dangnhap', (req, res) => {
    const filePath = path.join(__dirname, '../../../public/dangnhap-dangky/dangnhap.html');
    res.sendFile(filePath);
});

router.post('/register-client', async (req, res) => {
  try {
    const { fullname, phonenumber, email, password } = req.body;
    
    // Validate dữ liệu đầu vào
    if (!fullname || !email || !password || !phonenumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Email không đúng định dạng' 
      });
    }

    // Validate số điện thoại
    if (!/^[0-9]{10}$/.test(phonenumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Số điện thoại phải có 10 chữ số' 
      });
    }
    
    // Kiểm tra email tồn tại
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Email này đã được sử dụng' 
      });
    }
    
    // Kiểm tra số điện thoại
    const [existingPhones] = await pool.query(
      'SELECT id FROM users WHERE phonenumber = ?', 
      [phonenumber]
    );
    
    if (existingPhones.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Số điện thoại này đã được sử dụng' 
      });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Lấy role_id cho customer
    const [roles] = await pool.query(
      'SELECT id FROM roles WHERE name = ?',
      ['customer']
    );
    
    if (roles.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: 'Lỗi hệ thống: Không tìm thấy role customer' 
      });
    }
    
    const customerRoleId = roles[0].id;
    
    // Thêm user mới
    const [result] = await pool.query(
      `INSERT INTO users (fullname, phonenumber, email, password, role_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [fullname, phonenumber || null, email, hashedPassword, customerRoleId]
    );
    
    // Log kết quả để debug
    console.log('Registration successful:', result);

    // Tạo token cho user mới
    const token = jwt.sign(
      { userId: result.insertId, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({ 
      success: true,
      token,
      userId: result.insertId,
      fullname: fullname,
      email: email,
      role: 'customer',
      message: 'Đăng ký thành công'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Đã có lỗi xảy ra trong quá trình đăng ký', 
      error: error.message 
    });
  }
});

router.post('/login-client', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND r.name = ?', [email, 'customer']);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    // Tạo token chỉ với thông tin cần thiết cho client
    const token = jwt.sign({ userId: user.id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user.id, fullname: user.fullname, role: user.role_name });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
});

module.exports = router;
