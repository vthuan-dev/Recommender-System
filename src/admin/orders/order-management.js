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

// Lấy danh sách đơn hàng
router.get('/orders', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Lấy danh sách đơn hàng và tổng số đơn hàng
    const [orders, [totalCount], orderStats] = await Promise.all([
      pool.query(
        `SELECT o.*, u.fullname as customer_name 
         FROM orders o
         JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
      pool.query('SELECT COUNT(*) as count FROM orders'),
      // Sửa lại query thống kê
      pool.query(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM orders
      `)
    ]);

    // Lấy kết quả thống kê trực tiếp
    const statsObject = orderStats[0][0];

    res.json({
      orders: orders[0],
      currentPage: page,
      totalPages: Math.ceil(totalCount[0].count / limit),
      totalOrders: totalCount[0].count,
      orderStats: statsObject
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lấy chi tiết đơn hàng
router.get('/orders/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [order] = await pool.query(
      `SELECT o.*, u.fullname as customer_name, a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    const [orderItems] = await pool.query(
      `SELECT oi.*, p.name as product_name, pv.name as variant_name
       FROM orderitems oi 
       JOIN products p ON oi.product_id = p.id 
       LEFT JOIN productvariants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const totalPrice = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    res.json({ 
      ...order[0], 
      items: orderItems,
      totalPrice,
      address: {
        address_line1: order[0].address_line1,
        address_line2: order[0].address_line2,
        city: order[0].city,
        state: order[0].state,
        postal_code: order[0].postal_code,
        country: order[0].country
      }
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi lấy chi tiết đơn hàng', error: error.message });
  }
});
router.put('/orders/:id/status', authenticateJWT, checkAdminRole, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const { status } = req.body;
      const orderId = req.params.id;
  
      // Kiểm tra trạng thái hợp lệ
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        await connection.rollback();
        return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
      }
  
      // Kiểm tra trạng thái hiện tại của đơn hàng
      const [currentOrder] = await connection.query('SELECT status FROM orders WHERE id = ?', [orderId]);
      if (currentOrder.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
      }
  
      const currentStatus = currentOrder[0].status;
  
      // Kiểm tra logic chuyển trạng thái
      if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
        await connection.rollback();
        return res.status(400).json({ message: 'Không thể thay đổi trạng thái của đơn hàng đã hủy hoặc đã giao' });
      }
  
      if (currentStatus === 'shipped' && status !== 'delivered') {
        await connection.rollback();
        return res.status(400).json({ message: 'Đơn hàng đã gửi chỉ có thể chuyển sang trạng thái đã giao' });
      }
  
      // Cập nhật trạng thái
      const [result] = await connection.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
  
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
      }
  
      await connection.commit();
      res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', newStatus: status });
    } catch (error) {
      await connection.rollback();
      console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái đơn hàng', error: error.message });
    } finally {
      connection.release();
    }
  });

// Lấy danh sách đơn hàng theo trạng thái
router.get('/orders/status/:status', authenticateJWT, checkAdminRole, async (req, res) => {
    try {
      const status = req.params.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
  
      // Kiểm tra trạng thái hợp lệ
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
      }
  
      const [orders, [totalCount]] = await Promise.all([
        pool.query(
          `SELECT o.*, u.fullname as customer_name 
           FROM orders o 
           JOIN users u ON o.user_id = u.id 
           WHERE o.status = ?
           ORDER BY o.created_at DESC 
           LIMIT ? OFFSET ?`,
          [status, limit, offset]
        ),
        pool.query('SELECT COUNT(*) as count FROM orders WHERE status = ?', [status])
      ]);
  
      res.json({
        orders: orders[0],
        currentPage: page,
        totalPages: Math.ceil(totalCount[0].count / limit),
        totalOrders: totalCount[0].count,
        status: status
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách đơn hàng theo trạng thái:', error);
      res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng theo trạng thái', error: error.message });
    }
  });

// Thêm route mới để lấy thống kê
router.get('/orders/stats', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [orderStats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM orders
    `)

    res.json({
      orderStats: orderStats[0]
    })
  } catch (error) {
    console.error('Error getting order stats:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router;
