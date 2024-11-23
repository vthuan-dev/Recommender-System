const express = require('express');
const router = express.Router();
const { pool, authenticateJWT } = require('../../database/dbconfig');
const { broadcastOrderUpdate } = require('../../websocket');

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

// 1. Route thống kê (đặt trước)
router.get('/orders/stats', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE 
          WHEN status IN ('shipped', 'delivered') THEN 
            (SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
             FROM orderitems oi 
             WHERE oi.order_id = orders.id)
          ELSE 0 
        END) as completed_revenue
      FROM orders
    `);

    res.json({
      stats: {
        total: orderStats[0].total_orders || 0,
        pending: orderStats[0].pending || 0,
        processing: orderStats[0].processing || 0,
        shipped: orderStats[0].shipped || 0,
        delivered: orderStats[0].delivered || 0,
        cancelled: orderStats[0].cancelled || 0,
        revenue: parseFloat(orderStats[0].completed_revenue) || 0
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. Route lấy danh sách theo trạng thái (đặt trước)
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

// 3. Route lấy danh sách đơn hàng
router.get('/orders', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const dateRange = req.query.dateRange || 'all';
    
    // Xây dựng điều kiện WHERE cho thời gian
    let dateFilter = '';
    const now = new Date();
    
    switch(dateRange) {
      case 'today':
        dateFilter = 'DATE(created_at) = CURDATE()';
        break;
      case 'week':
        dateFilter = 'YEARWEEK(created_at) = YEARWEEK(NOW())';
        break;
      case 'month':
        dateFilter = 'YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())';
        break;
      default:
        dateFilter = '1=1'; // Tất cả thời gian
    }

    // Lấy thống kê với điều kiện thời gian
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM orders
      WHERE ${dateFilter}
    `);

    // Lấy danh sách đơn hàng với điều kiện thời gian
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.fullname as customer_name,
        (SELECT SUM(oi.price * oi.quantity) 
         FROM orderitems oi 
         WHERE oi.order_id = o.id) as total_price
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${dateFilter}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Đếm tổng số đơn hàng theo điều kiện
    const [totalCount] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE ${dateFilter}
    `);

    // Format total_price cho mỗi đơn hàng
    const formattedOrders = orders.map(order => ({
      ...order,
      total_price: parseFloat(order.total_price) || 0
    }));

    res.json({
      orders: formattedOrders,
      currentPage: page,
      totalPages: Math.ceil(totalCount[0].count / limit),
      totalOrders: totalCount[0].count,
      orderStats: {
        total: orderStats[0].total_orders,
        pending: orderStats[0].pending,
        processing: orderStats[0].processing,
        shipped: orderStats[0].shipped,
        delivered: orderStats[0].delivered,
        cancelled: orderStats[0].cancelled
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message 
    });
  }
});

// 4. Route lấy chi tiết đơn hàng (đặt sau)
router.get('/orders/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const orderId = req.params.id;
    
    // Lấy thông tin đơn hàng, khách hàng, địa chỉ và thanh toán
    const [orderDetails] = await connection.query(`
      SELECT o.*,
             u.fullname as customer_name,
             u.email as customer_email,
             u.phonenumber as customer_phone,
             p.status as payment_status,
             p.method as payment_method,
             p.amount as payment_amount,
             p.payment_date,
             a.address_line1,
             a.address_line2,
             a.city,
             a.state,
             a.postal_code,
             a.country
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.id = ?
    `, [orderId]);

    if (!orderDetails.length) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Lấy chi tiết sản phẩm trong đơn hàng
    const [orderItems] = await connection.query(`
      SELECT oi.*,
             p.name as product_name,
             p.image_url as product_image,
             pv.name as variant_name,
             b.name as brand_name
      FROM orderitems oi
      JOIN productvariants pv ON oi.variant_id = pv.id
      JOIN products p ON oi.product_id = p.id
      JOIN brands b ON p.brand_id = b.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // Format response
    const formattedOrder = {
      ...orderDetails[0],
      customer: {
        name: orderDetails[0].customer_name,
        email: orderDetails[0].customer_email,
        phone: orderDetails[0].customer_phone || 'Không có'
      },
      shipping_address: {
        address_line1: orderDetails[0].address_line1,
        address_line2: orderDetails[0].address_line2,
        city: orderDetails[0].city,
        state: orderDetails[0].state,
        postal_code: orderDetails[0].postal_code,
        country: orderDetails[0].country
      },
      payment: {
        status: orderDetails[0].payment_status || 'pending',
        method: orderDetails[0].payment_method || 'N/A',
        amount: parseFloat(orderDetails[0].payment_amount) || 0,
        date: orderDetails[0].payment_date
      },
      items: orderItems.map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_image: item.product_image,
        variant_name: item.variant_name,
        brand_name: item.brand_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.price * item.quantity)
      })),
      total: parseFloat(orderDetails[0].total)
    };

    res.json(formattedOrder);

  } catch (error) {
    console.error('Error in getting order details:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy chi tiết đơn hàng',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 5. Route cập nhật trạng thái
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
    
    // Broadcast cập nhật qua WebSocket
    broadcastOrderUpdate(orderId, status);

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

// Thêm route để cập nhật trạng thái thanh toán
router.put('/orders/:id/payment', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const orderId = req.params.id;
    const { status, method } = req.body;

    // Cập nhật hoặc tạo mới payment
    await connection.query(`
      INSERT INTO payments (order_id, status, method, amount, payment_date)
      SELECT id, ?, ?, total, NOW()
      FROM orders WHERE id = ?
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        method = VALUES(method),
        payment_date = NOW()
    `, [status, method, orderId]);

    await connection.commit();
    res.json({
      message: 'Cập nhật thông tin thanh toán thành công',
      orderId,
      paymentStatus: status
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Lỗi cập nhật thanh toán', error: error.message });
  } finally {
    connection.release();
  }
});

// Route cập nhật ghi chú
router.put('/orders/:id/note', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    await pool.query('UPDATE orders SET admin_note = ? WHERE id = ?', [note, id]);
    
    res.json({ message: 'Cập nhật ghi chú thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật ghi chú', error: error.message });
  }
});

router.get('/orders/reports/sales', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const [salesReport] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(total) as revenue,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate, endDate]);
    
    res.json(salesReport);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy báo cáo', error: error.message });
  }
});

module.exports = router;
