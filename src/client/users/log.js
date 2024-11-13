const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../database/dbconfig');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const router = express.Router();
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

dotenv.config();

// Cấu hình CORS chi tiết
const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Áp dụng CORS cho tất cả các routes
router.use(cors(corsOptions));

// Middleware xử lý preflight requests
router.options('*', cors(corsOptions));

// Middleware xử lý headers cho mọi request
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

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

router.post('/google-auth', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { sub, email, name, picture } = ticket.getPayload();

    // Kiểm tra user có tồn tại
    const [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [sub, email]
    );

    let user;
    if (users.length === 0) {
      // Tạo user mới với role customer
      const [customerRole] = await pool.query(
        'SELECT id FROM roles WHERE name = ?', 
        ['customer']
      );
      
      const [result] = await pool.query(
        `INSERT INTO users (fullname, email, google_id, avatar_url, role_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, sub, picture, customerRole[0].id]
      );

      const [newUser] = await pool.query(
        'SELECT * FROM users WHERE id = ?', 
        [result.insertId]
      );
      user = newUser[0];
    } else {
      user = users[0];
      // Cập nhật google_id nếu user đăng ký bằng email
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?',
          [sub, picture, user.id]
        );
      }
    }

    // Tạo JWT token
    const authToken = jwt.sign(
      { userId: user.id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token: authToken,
      userId: user.id,
      fullname: user.fullname,
      email: user.email,
      avatar: user.avatar_url
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Lỗi xác thực Google' });
  }
});

module.exports = router;
