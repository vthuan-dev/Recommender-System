const express = require('express');
const router = express.Router();
const { pool, authenticateJWT } = require('../../database/dbconfig');


async function checkAdminRole(req, res, next) {
    const user = req.user;
    if (user.role_name !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
  }


router.get('/users/:id', authenticateJWT, checkAdminRole, async (req, res) => {
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