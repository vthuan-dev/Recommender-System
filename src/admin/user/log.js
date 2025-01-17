const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../database/dbconfig');
const router = express.Router();
const path = require('path');
const cors = require('cors');

// Cấu hình CORS middleware
router.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));
router.options('*', cors());

// Đảm bảo middleware này được thêm trước các routes
router.use(express.json());

router.get('/admin-sign-up', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../../public/admin/account/sign-up.html'));
});

router.get('/admin-sign-in', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../../public/admin/account/sign-in.html'));
});
router.post('/register-admin', async (req, res) => {
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
    
    // Lấy role_id và role_name cho "admin"
    const [adminRole] = await pool.query('SELECT id, name FROM roles WHERE name = ?', ['admin']);
    if (adminRole.length === 0) {
      return res.status(500).json({ message: 'Lỗi hệ thống: Không tìm thấy vai trò admin' });
    }
    const adminRoleId = adminRole[0].id;
    const adminRoleName = adminRole[0].name;
    
    // Thêm người dùng mới vào cơ sở dữ liệu với role "admin"
    const [result] = await pool.query(
      'INSERT INTO users (fullname, phonenumber, email, password, role_id) VALUES (?, ?, ?, ?, ?)',
      [fullname, phonenumber, email, hashedPassword, adminRoleId]
    );
    
    res.status(201).json({ 
      userId: result.insertId, 
      fullname: fullname,
      email: email,
      role: adminRoleName,
      message: 'Đăng ký admin thành công' 
    });

    req.session.userId = result.insertId;
    req.session.fullname = fullname;
    req.session.email = email;
    req.session.role = adminRoleName;
   
  } catch (error) {
    console.error('Lỗi đăng ký admin:', error);
    res.status(500).json({ message: 'Lỗi đăng ký admin', error: error.message });
  }
});

router.post('/login-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const [users] = await pool.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND r.name = ?', 
      [email, 'admin']
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      userId: user.id, 
      fullname: user.fullname, 
      role: user.role_name 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi đăng nhập admin' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    // Xóa session/cookie nếu có
    if (req.session) {
      req.session.destroy();
    }
    res.clearCookie('adminToken');
    
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Lỗi khi đăng xuất' });
  }
});

module.exports = router;
