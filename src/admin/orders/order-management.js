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
    const status = req.query.status || '';
    const dateRange = req.query.dateRange || '';
    const search = req.query.search || '';

    let whereClause = '1=1';
    let params = [];

    // Tìm kiếm theo từ khóa
    if (search) {
      whereClause += ' AND (u.fullname LIKE ? OR o.id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Lọc theo trạng thái
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // Lọc theo thời gian
    if (dateRange) {
      switch (dateRange) {
        case 'today':
          whereClause += ' AND DATE(o.created_at) = CURDATE()';
          break;
        case 'week':
          whereClause += ' AND YEARWEEK(o.created_at) = YEARWEEK(NOW())';
          break;
        case 'month':
          whereClause += ' AND MONTH(o.created_at) = MONTH(NOW()) AND YEAR(o.created_at) = YEAR(NOW())';
          break;
      }
    }

    // Lấy danh sách đơn hàng và tổng số đơn hàng
    const [orders, [totalCount], orderStats] = await Promise.all([
      pool.query(
        `SELECT o.*, u.fullname as customer_name,
         (SELECT SUM(oi.price * oi.quantity) 
          FROM orderitems oi 
          WHERE oi.order_id = o.id) as total_price
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) as count FROM orders o JOIN users u ON o.user_id = u.id WHERE ${whereClause}`, params),
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

    // Format total_price to number
    const formattedOrders = orders[0].map(order => ({
      ...order,
      total_price: parseFloat(order.total_price) || 0
    }));

    res.json({
      orders: formattedOrders,
      currentPage: page,
      totalPages: Math.ceil(totalCount.count / limit),
      totalOrders: totalCount.count,
      orderStats: orderStats[0][0]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lấy chi tiết đơn hàng
router.get('/orders/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const orderId = req.params.id;
    
    // Lấy thông tin đơn hàng, khách hàng và địa chỉ
    const [orderDetails] = await connection.query(`
      SELECT 
        o.*,
        u.fullname as customer_name,
        u.email as customer_email,
        u.phonenumber as customer_phone,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        p.status as payment_status,
        p.method as payment_method,
        p.payment_date
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = ?
    `, [orderId]);

    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Lấy chi tiết các sản phẩm trong đơn hàng
    const [orderItems] = await connection.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.image_url as product_image,
        pv.name as variant_name,
        b.name as brand_name
      FROM orderitems oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN productvariants pv ON oi.variant_id = pv.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // Format response
    const formattedOrder = {
      id: orderDetails[0].id,
      status: orderDetails[0].status,
      total: orderDetails[0].total,
      created_at: orderDetails[0].created_at,
      updated_at: orderDetails[0].updated_at,
      
      // Thông tin khách hàng
      customer: {
        id: orderDetails[0].user_id,
        name: orderDetails[0].customer_name,
        email: orderDetails[0].customer_email,
        phone: orderDetails[0].customer_phone
      },

      // Địa chỉ giao hàng
      shipping_address: {
        id: orderDetails[0].address_id,
        address_line1: orderDetails[0].address_line1,
        address_line2: orderDetails[0].address_line2,
        city: orderDetails[0].city,
        state: orderDetails[0].state,
        postal_code: orderDetails[0].postal_code,
        country: orderDetails[0].country
      },

      // Thông tin thanh toán
      payment: {
        status: orderDetails[0].payment_status,
        method: orderDetails[0].payment_method,
        date: orderDetails[0].payment_date
      },

      // Chi tiết sản phẩm
      items: orderItems.map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_image: item.product_image,
        variant_name: item.variant_name,
        brand_name: item.brand_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price
      }))
    };

    res.json(formattedOrder);

  } catch (error) {
    console.error('Error in getting order details:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy chi tiết đơn hàng',
      error: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
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
          `SELECT o.*, u.fullname as customer_name,
           (SELECT SUM(oi.price * oi.quantity) 
            FROM orderitems oi 
            WHERE oi.order_id = o.id) as total_price
           FROM orders o 
           JOIN users u ON o.user_id = u.id 
           WHERE o.status = ?
           ORDER BY o.created_at DESC 
           LIMIT ? OFFSET ?`,
          [status, limit, offset]
        ),
        pool.query('SELECT COUNT(*) as count FROM orders WHERE status = ?', [status])
      ]);
  
      // Format total_price to number
      const formattedOrders = orders[0].map(order => ({
        ...order,
        total_price: parseFloat(order.total_price) || 0
      }));
  
      res.json({
        orders: formattedOrders,
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

// Thêm route cập nhật trạng thái đơn hàng
router.put('/orders/:id/status', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const orderId = req.params.id;
    const { status } = req.body;

    // Kiểm tra đơn hàng và trạng thái hiện tại
    const [orderResult] = await connection.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const currentStatus = orderResult[0].status;

    // Nếu đơn hàng được hủy và chưa từng bị hủy trước đó
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      // Hoàn trả số lượng đã bán
      await connection.query(`
        UPDATE productvariants pv
        JOIN orderitems oi ON pv.id = oi.variant_id
        SET pv.sold_count = GREATEST(COALESCE(pv.sold_count, 0) - oi.quantity, 0)
        WHERE oi.order_id = ?
      `, [orderId]);

      // Ghi nhận giao dịch hoàn trả
      await connection.query(`
        INSERT INTO inventory_transactions (variant_id, quantity, type, note)
        SELECT variant_id, quantity, 'import', CONCAT('Admin Cancel Order ID: ', ?)
        FROM orderitems
        WHERE order_id = ?
      `, [orderId, orderId]);
    }

    // Cập nhật trạng thái đơn hàng
    await connection.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );

    await connection.commit();
    res.json({
      message: status === 'cancelled' 
        ? 'Đã hủy đơn hàng và hoàn trả số lượng về kho'
        : 'Cập nhật trạng thái thành công',
      orderId,
      newStatus: status
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
