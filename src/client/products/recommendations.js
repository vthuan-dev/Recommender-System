const express = require('express');
const router = express.Router();
const { pool } = require('../../database/dbconfig');
const axios = require('axios');

// Get recommendations cho user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Call ML service
    const response = await axios.get(
      `http://localhost:5001/api/collaborative/recommend?user_id=${userId}`
    );
    
    if (response.data.success) {
      res.json({
        success: true,
        recommendations: response.data.recommendations
      });
    } else {
      // Fallback to popularity recommendations
      const [popularProducts] = await pool.query(`
        SELECT 
          p.*,
          COUNT(r.id) as review_count,
          AVG(r.rating) as avg_rating,
          SUM(pv.sold_count) as total_sold
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        LEFT JOIN productvariants pv ON p.id = pv.product_id
        GROUP BY p.id
        ORDER BY (COALESCE(AVG(r.rating), 0) * 0.4) + (COALESCE(SUM(pv.sold_count), 0) * 0.4) DESC
        LIMIT 8
      `);
      
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

// Track user interactions
router.post('/track', async (req, res) => {
  try {
    const { user_id, action, data, timestamp } = req.body;
    
    await pool.query(`
      INSERT INTO user_interactions 
      (user_id, action_type, action_data, created_at)
      VALUES (?, ?, ?, ?)
    `, [user_id, action, JSON.stringify(data), timestamp]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get recommended products
router.get('/recommended-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.image_url,
        b.name as brand_name,
        c.name as category_name,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating) as avg_rating,
        SUM(pv.sold_count) as total_sold
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      GROUP BY p.id, p.name, p.description, p.image_url, b.name, c.name
      ORDER BY (COALESCE(AVG(r.rating), 0) * 0.4) + (COALESCE(SUM(pv.sold_count), 0) * 0.6) DESC
      LIMIT ?
    `, [limit]);

    // Format response
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image_url: formatImageUrl(product.image_url),
      brand_name: product.brand_name,
      category_name: product.category_name,
      min_price: product.min_price,
      max_price: product.max_price,
      metrics: {
        avg_rating: Number(product.avg_rating) || 0,
        review_count: product.review_count || 0,
        sold_count: product.total_sold || 0
      },
      reason: _getRecommendationReason({
        metrics: {
          avg_rating: Number(product.avg_rating) || 0,
          review_count: product.review_count || 0,
          sold_count: product.total_sold || 0
        },
        min_price: product.min_price,
        max_price: product.max_price
      })
    }));

    res.json({
      success: true,
      recommendations: formattedProducts
    });
  } catch (error) {
    console.error('Error getting recommended products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function để format image URL
function formatImageUrl(imageUrl) {
  if (!imageUrl) return null;
  return imageUrl.startsWith('/') ? imageUrl : `/assets/uploads/products/${imageUrl}`;
}

// Helper function để tạo lý do gợi ý
function _getRecommendationReason(product) {
  const reasons = [];
  
  // Đánh giá
  if (product.metrics?.avg_rating >= 4.5) {
    reasons.push('Đánh giá xuất sắc');
  } else if (product.metrics?.avg_rating >= 4.0) {
    reasons.push('Đánh giá tốt');
  }
  
  // Lượt bán
  if (product.metrics?.sold_count >= 100) {
    reasons.push('Sản phẩm bán chạy');
  } else if (product.metrics?.sold_count >= 50) {
    reasons.push('Được nhiều người mua');
  }
  
  // Giảm giá
  const discount = calculateDiscount(product.max_price, product.min_price);
  if (discount >= 30) {
    reasons.push('Giảm giá sốc');
  } else if (discount >= 15) {
    reasons.push('Đang giảm giá');
  }
  
  // Lượt đánh giá
  if (product.metrics?.review_count >= 50) {
    reasons.push('Nhiều đánh giá tích cực');
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Phổ biến trong thời gian gần đây';
}

function calculateDiscount(maxPrice, minPrice) {
  if (!maxPrice || !minPrice || maxPrice <= minPrice) return 0;
  return Math.round(((maxPrice - minPrice) / maxPrice) * 100);
}

module.exports = router;