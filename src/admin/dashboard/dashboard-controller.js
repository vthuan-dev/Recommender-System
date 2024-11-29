const express = require('express');
const { pool, authenticateJWT } = require('../../database/dbconfig');
const router = express.Router();

// Thêm middleware checkAdminRole
const checkAdminRole = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.userId]
    );

    if (rows.length > 0 && rows[0].role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Không có quyền truy cập' });
    }
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Route test không cần xác thực
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Dashboard API is working',
    timestamp: new Date().toISOString()
  });
});

// Route test có xác thực
router.get('/test-auth', authenticateJWT, (req, res) => {
  res.json({ 
    message: 'Dashboard API with auth is working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Route chính giữ nguyên
router.get('/stats', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 1. Thống kê đơn hàng
    const [orderStats] = await connection.query(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processingOrders, 
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledOrders,
        COALESCE(SUM(total), 0) as totalRevenue
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // 2. Thống kê sản phẩm
    const [productStats] = await connection.query(`
      SELECT 
        COUNT(DISTINCT p.id) as totalProducts,
        COUNT(DISTINCT CASE WHEN pv.initial_stock = 0 THEN p.id END) as outOfStockProducts,
        COUNT(DISTINCT CASE WHEN pv.initial_stock <= 10 THEN p.id END) as lowStockProducts
      FROM products p
      LEFT JOIN productvariants pv ON p.id = pv.product_id
    `);

    // 3. Doanh thu theo ngày (7 ngày gần nhất)
    const [dailyRevenue] = await connection.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(total) as revenue
      FROM orders 
      WHERE status != 'cancelled'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 4. Top sản phẩm bán chạy
    const [topProducts] = await connection.query(`
      SELECT 
        p.id,
        p.name,
        p.image_url,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM products p
      JOIN orderitems oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name, p.image_url
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // 5. Thống kê đánh giá sản phẩm
    const [reviewStats] = await connection.query(`
      SELECT
        COUNT(*) as totalReviews,
        AVG(rating) as avgRating,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verifiedReviews
      FROM reviews
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    res.json({
      success: true,
      data: {
        orderStats: {
          ...orderStats[0],
          totalRevenue: parseFloat(orderStats[0].totalRevenue) || 0
        },
        productStats: productStats[0],
        dailyRevenue: dailyRevenue.map(item => ({
          date: item.date,
          revenue: parseFloat(item.revenue) || 0
        })),
        topProducts: topProducts.map(product => ({
          ...product,
          revenue: parseFloat(product.revenue) || 0
        })),
        reviewStats: {
          ...reviewStats[0],
          avgRating: parseFloat(reviewStats[0].avgRating) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router; 