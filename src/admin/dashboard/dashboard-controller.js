const express = require('express');
const { pool } = require('../../database/dbconfig');
const { authenticateJWT } = require('../../database/dbconfig');
const router = express.Router();

// API lấy thống kê tổng quan
router.get('/dashboard/stats', authenticateJWT, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Thống kê đơn hàng
    const [orderStats] = await connection.query(`
      SELECT 
        COUNT(*) as totalOrders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processingOrders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedOrders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledOrders,
        SUM(total_amount) as totalRevenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Thống kê sản phẩm
    const [productStats] = await connection.query(`
      SELECT 
        COUNT(*) as totalProducts,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as outOfStockProducts,
        COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as lowStockProducts
      FROM products
    `);

    // Top 5 sản phẩm bán chạy
    const [topProducts] = await connection.query(`
      SELECT 
        p.id,
        p.name,
        p.image_url,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Doanh thu theo ngày (30 ngày gần nhất)
    const [revenueChart] = await connection.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status = 'completed'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: {
        orderStats: orderStats[0],
        productStats: productStats[0],
        topProducts,
        revenueChart
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu thống kê',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router; 