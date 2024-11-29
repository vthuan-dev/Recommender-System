const express = require('express');
const { pool, authenticateJWT } = require('../../database/dbconfig');
const router = express.Router();

// Route test không cần xác thực
router.get('/dashboard/test', (req, res) => {
  res.json({ 
    message: 'Dashboard API is working',
    timestamp: new Date().toISOString()
  });
});

// Route test có xác thực
router.get('/dashboard/test-auth', authenticateJWT, (req, res) => {
  res.json({ 
    message: 'Dashboard API with auth is working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Route chính giữ nguyên
router.get('/stats', authenticateJWT, async (req, res) => {
  let connection;
  try {
    console.log('Attempting to get database connection...');
    
    connection = await pool.getConnection();
    console.log('Database connection successful');

    // Khai báo tất cả biến cần thiết
    let orderStats, productStats, topProducts, revenueChart, userStats, 
        reviewStats, recentReviews, popularProducts, brandStats, 
        dailyRevenue, monthlyRevenue;

    // Query orderStats
    try {
      [orderStats] = await connection.query(`
        SELECT 
          COUNT(*) as totalOrders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processingOrders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completedOrders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledOrders,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as totalRevenue
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      console.log('Order stats query successful:', orderStats[0]);
    } catch (error) {
      console.error('Error in order stats query:', error);
      throw error;
    }

    // Query dailyRevenue
    try {
      [dailyRevenue] = await connection.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_orders,
          SUM(total) as revenue,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      console.log('Daily revenue query successful:', dailyRevenue);
    } catch (error) {
      console.error('Error in daily revenue query:', error);
      throw error;
    }

    // Query monthlyRevenue
    try {
      [monthlyRevenue] = await connection.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as total_orders,
          SUM(total) as revenue,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          ROUND(AVG(total), 2) as average_order_value
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
      `);
      console.log('Monthly revenue query successful:', monthlyRevenue);
    } catch (error) {
      console.error('Error in monthly revenue query:', error);
      throw error;
    }

    // Gửi response với chỉ những dữ liệu cần thiết
    res.json({
      success: true,
      data: {
        orderStats: orderStats[0] || {},
        dailyRevenue: dailyRevenue || [],
        monthlyRevenue: monthlyRevenue || []
      }
    });

  } catch (error) {
    console.error('Error in dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu thống kê',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.release();
      console.log('Database connection released');
    }
  }
});

module.exports = router; 