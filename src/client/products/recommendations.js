const express = require('express');
const router = express.Router();
const { pool } = require('../../database/dbconfig');
const axios = require('axios');

// Cache để lưu tương tác real-time
const realtimeInteractions = {
  users: new Map(), // Lưu tương tác theo user
  products: new Map(), // Lưu tương tác theo product
  lastUpdate: new Date()
};

// Hàm cập nhật real-time interactions
async function updateRealtimeInteractions(userId, productId, action) {
  // Cập nhật user interactions
  if (!realtimeInteractions.users.has(userId)) {
    realtimeInteractions.users.set(userId, []);
  }
  realtimeInteractions.users.get(userId).push({
    productId,
    action,
    timestamp: new Date()
  });

  // Cập nhật product interactions
  if (!realtimeInteractions.products.has(productId)) {
    realtimeInteractions.products.set(productId, []);
  }
  realtimeInteractions.products.get(productId).push({
    userId,
    action,
    timestamp: new Date()
  });

  // Cập nhật ML model nếu đủ dữ liệu mới
  if (shouldUpdateModel()) {
    try {
      await updateMLModel();
    } catch (error) {
      console.error('Error updating ML model:', error);
    }
  }
}

// Kiểm tra có nên update model không
function shouldUpdateModel() {
  const timeSinceLastUpdate = new Date() - realtimeInteractions.lastUpdate;
  const hasEnoughNewData = realtimeInteractions.users.size >= 10; // Ví dụ: 10 users mới
  return timeSinceLastUpdate >= 5 * 60 * 1000 && hasEnoughNewData; // 5 phút
}

// Cập nhật ML model
async function updateMLModel() {
  try {
    // Gửi dữ liệu mới tới ML service
    await axios.post('http://localhost:5001/api/retrain', {
      interactions: Array.from(realtimeInteractions.users.entries()).map(([userId, actions]) => ({
        user_id: userId,
        actions: actions
      }))
    });

    // Reset cache sau khi update
    realtimeInteractions.users.clear();
    realtimeInteractions.products.clear();
    realtimeInteractions.lastUpdate = new Date();

  } catch (error) {
    console.error('Error in updateMLModel:', error);
    throw error;
  }
}

// API track tương tác
router.post('/track', async (req, res) => {
  try {
    const { user_id, product_id, action, data, timestamp } = req.body;
    
    // Lưu vào database
    await pool.query(`
      INSERT INTO user_interactions 
      (user_id, product_id, action_type, action_data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [user_id, product_id, action, JSON.stringify(data), timestamp]);

    // Cập nhật real-time cache
    await updateRealtimeInteractions(user_id, product_id, action);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// API lấy recommendations với real-time data
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Lấy real-time interactions của user
    const recentInteractions = realtimeInteractions.users.get(userId) || [];
    
    // Call ML service với real-time data
    const response = await axios.post(
      'http://localhost:5001/api/collaborative/recommend',
      {
        user_id: userId,
        recent_interactions: recentInteractions
      }
    );
    
    if (response.data.success) {
      res.json({
        success: true,
        recommendations: response.data.recommendations
      });
    } else {
      // Fallback to popularity
      const popularProducts = await getPopularProducts();
      res.json({
        success: true,
        recommendations: popularProducts,
        source: 'popularity'
      });
    }
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function lấy popular products
async function getPopularProducts(limit = 8) {
  const [products] = await pool.query(`
    SELECT 
      p.*,
      COUNT(r.id) as review_count,
      AVG(r.rating) as avg_rating,
      SUM(pv.sold_count) as total_sold
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    LEFT JOIN productvariants pv ON p.id = pv.product_id
    GROUP BY p.id
    ORDER BY (
      COALESCE(AVG(r.rating), 0) * 0.4 + 
      COALESCE(SUM(pv.sold_count), 0) * 0.4
    ) DESC
    LIMIT ?
  `, [limit]);

  return products.map(formatProductResponse);
}

// Format response
function formatProductResponse(product) {
  return {
    id: product.id,
    name: product.name,
    image_url: formatImageUrl(product.image_url),
    metrics: {
      avg_rating: Number(product.avg_rating) || 0,
      review_count: product.review_count || 0,
      sold_count: product.total_sold || 0
    },
    reason: _getRecommendationReason(product)
  };
}

module.exports = router;