const express = require('express');
const router = express.Router();
const { pool, authenticateJWT } = require('../../database/dbconfig');

async function checkAdminRole(req, res, next) {
  try {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi kiểm tra quyền admin', error: error.message });
  }
}

// Get all users with pagination and filters
router.get('/users', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, sort } = req.query;
        const offset = (page - 1) * limit;
        
        // Query lấy users và roles trong cùng một request
        const [users] = await pool.query(`
            SELECT 
                u.id, 
                u.fullname, 
                u.email, 
                u.phonenumber,
                u.status,
                u.created_at,
                r.id as role_id,
                r.name as role_name,
                r.permissions
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE (u.fullname LIKE ? OR u.email LIKE ?)
            ${role ? 'AND r.id = ?' : ''}
            ORDER BY ${sort || 'u.created_at DESC'}
            LIMIT ? OFFSET ?
        `, [`%${search || ''}%`, `%${search || ''}%`, ...(role ? [role] : []), limit, offset]);

        const [roles] = await pool.query('SELECT * FROM roles');
        
        res.json({
            users,
            roles,
            pagination: {
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Get user details
router.get('/users/:id', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const [user] = await pool.query(`
            SELECT 
                u.*,
                r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `, [req.params.id]);

        if (!user.length) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi lấy thông tin người dùng', 
            error: error.message 
        });
    }
});

// Update user
router.put('/users/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, phonenumber, role_id } = req.body;

    await pool.query(`
      UPDATE users 
      SET fullname = ?, 
          email = ?, 
          phonenumber = ?,
          role_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [fullname, email, phonenumber, role_id, id]);

    res.json({ 
      message: 'Cập nhật thông tin thành công',
      userId: id 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi cập nhật thông tin', 
      error: error.message 
    });
  }
});

// Delete user
router.delete('/users/:id', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi xóa người dùng', 
            error: error.message 
        });
    }
});

// Thêm khách hàng mới
router.post('/users', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const { fullname, email, phonenumber, password, role_id = 2 } = req.body;
        
        // Kiểm tra email tồn tại
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Thêm user mới
        const [result] = await pool.query(
            `INSERT INTO users (fullname, email, phonenumber, password, role_id, status) 
             VALUES (?, ?, ?, ?, ?, 'active')`,
            [fullname, email, phonenumber, password, role_id]
        );

        res.status(201).json({ 
            message: 'Thêm khách hàng thành công',
            userId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi thêm khách hàng', 
            error: error.message 
        });
    }
});

// Xóa nhiều khách hàng
router.post('/users/delete-multiple', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) {
            return res.status(400).json({ message: 'Không có ID nào được chọn' });
        }

        await pool.query(
            'DELETE FROM users WHERE id IN (?)',
            [ids]
        );

        res.json({ message: 'Xóa khách hàng thành công' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi xóa khách hàng', 
            error: error.message 
        });
    }
});

// Lấy thống kê khách hàng
router.get('/users/stats', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT
                COUNT(*) as total_customers,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
                COUNT(CASE WHEN DATEDIFF(CURRENT_DATE, created_at) <= 7 THEN 1 END) as new_customers,
                COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN u.id END) as customers_with_orders
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.role_id = 2
        `);

        // Tính % tăng trưởng
        const [previousStats] = await pool.query(`
            SELECT COUNT(*) as prev_total
            FROM users
            WHERE role_id = 2 
            AND created_at <= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)
        `);

        const growth = ((stats[0].total_customers - previousStats[0].prev_total) / previousStats[0].prev_total) * 100;

        res.json({
            ...stats[0],
            growth: growth.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi lấy thống kê', 
            error: error.message 
        });
    }
});

// Xuất danh sách khách hàng
router.get('/users/export', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT 
                u.id,
                u.fullname,
                u.email,
                u.phonenumber,
                u.status,
                u.created_at,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.role_id = 2
            GROUP BY u.id
        `);

        // Xử lý xuất Excel ở đây
        // ... code xuất Excel ...

        res.download('path/to/excel/file', 'customers.xlsx');
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi xuất danh sách', 
            error: error.message 
        });
    }
});

// Thêm route cập nhật trạng thái người dùng
router.put('/users/:id/status', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // status: 'active' hoặc 'blocked'
    
    await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({ 
      message: 'Cập nhật trạng thái thành công',
      userId: id,
      status 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi cập nhật trạng thái', 
      error: error.message 
    });
  }
});

router.get('/users/:id/activity', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [activities] = await pool.query(`
      SELECT 
        o.id as order_id,
        o.total,
        o.status as order_status,
        o.created_at,
        COUNT(oi.id) as total_items
      FROM orders o
      LEFT JOIN orderitems oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [id]);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi lấy lịch sử hoạt động', 
      error: error.message 
    });
  }
});

router.get('/roles', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi lấy danh sách quyền', 
      error: error.message 
    });
  }
});

router.put('/users/:id/role', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    
    await pool.query(
      'UPDATE users SET role_id = ? WHERE id = ?',
      [role_id, id]
    );
    
    res.json({ 
      message: 'Cập nhật quyền thành công',
      userId: id 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi cập nhật quyền', 
      error: error.message 
    });
  }
});

router.get('/users/:id/stats', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_spent,
        AVG(o.total) as avg_order_value,
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    res.json(userStats[0]);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi lấy thống kê người dùng', 
      error: error.message 
    });
  }
});

router.get('/customers', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { search, status, sort } = req.query;
    
    const [customers] = await pool.query(`
      SELECT 
        u.*,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role_id = (SELECT id FROM roles WHERE name = 'customer')
        AND (u.fullname LIKE ? OR u.email LIKE ?)
        ${status ? 'AND u.status = ?' : ''}
      GROUP BY u.id
      ORDER BY ${sort || 'u.created_at DESC'}
    `, [`%${search || ''}%`, `%${search || ''}%`, ...(status ? [status] : [])]);

    res.json({ customers });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;