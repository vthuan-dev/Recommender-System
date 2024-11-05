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
    
    // Lấy role_id và role_name cho "customer"
    const [customerRole] = await pool.query('SELECT id, name FROM roles WHERE name = ?', ['customer']);
    if (customerRole.length === 0) {
      return res.status(500).json({ message: 'Lỗi hệ thống: Không tìm thấy vai trò khách hàng' });
    }
    const customerRoleId = customerRole[0].id;
    const customerRoleName = customerRole[0].name;
    
    // Thêm người dùng mới vào cơ sở dữ liệu với role "customer"
    const [result] = await pool.query(
      'INSERT INTO users (fullname, phonenumber, email, password, role_id) VALUES (?, ?, ?, ?, ?)',
      [fullname, phonenumber, email, hashedPassword, customerRoleId]
    );
    
    res.status(201).json({ 
      userId: result.insertId, 
      fullname: fullname,
      email: email,
      role: customerRoleName,
      message: 'Đăng ký thành công' 
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi đăng ký', error: error.message });
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
