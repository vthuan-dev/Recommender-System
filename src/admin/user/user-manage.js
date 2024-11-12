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

// Get all users with pagination and filters
router.get('/users', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, sort } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                u.id, 
                u.fullname, 
                u.email, 
                u.phonenumber,
                u.created_at,
                u.role_id,
                r.name as role_name,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN orders o ON u.id = o.user_id
        `;

        const whereConditions = [];
        const params = [];

        if (search) {
            whereConditions.push(`(u.fullname LIKE ? OR u.email LIKE ? OR u.phonenumber LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            whereConditions.push('u.status = ?');
            params.push(status);
        }

        if (whereConditions.length) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        query += ` GROUP BY u.id`;

        if (sort) {
            const [field, order] = sort.split(':');
            const validFields = ['fullname', 'created_at', 'total_orders', 'total_spent'];
            if (validFields.includes(field)) {
                query += ` ORDER BY ${field} ${order === 'desc' ? 'DESC' : 'ASC'}`;
            }
        }

        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), offset);

        const [users] = await pool.query(query, params);
        const [{ total }] = await pool.query(`SELECT COUNT(*) as total FROM users`);

        res.json({
            users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Lỗi lấy thông tin người dùng', 
            error: error.message 
        });
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
        const { fullname, email, phonenumber, role_id, status } = req.body;
        await pool.query(
            'UPDATE users SET fullname = ?, email = ?, phonenumber = ?, role_id = ?, status = ? WHERE id = ?',
            [fullname, email, phonenumber, role_id, status, req.params.id]
        );
        res.json({ message: 'Cập nhật thông tin thành công' });
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

module.exports = router;