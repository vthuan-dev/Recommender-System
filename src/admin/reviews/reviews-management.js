const express = require('express');
const router = express.Router();
const { pool, authenticateJWT } = require('../../database/dbconfig');

// Middleware kiểm tra quyền admin
async function checkAdminRole(req, res, next) {
  try {
    // Kiểm tra có user và role
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - No user found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin role required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      message: 'Lỗi kiểm tra quyền admin', 
      error: error.message 
    });
  }
}

// Lấy danh sách đánh giá
router.get('/reviews', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const rating = req.query.rating;

    let whereClause = '1=1';
    const queryParams = [];

    if (status === 'verified') {
      whereClause += ' AND r.is_verified = 1';
    } else if (status === 'unverified') {
      whereClause += ' AND r.is_verified = 0';
    }

    if (rating) {
      whereClause += ' AND r.rating = ?';
      queryParams.push(parseInt(rating));
    }

    // Query lấy tổng số records
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE ${whereClause}
    `, queryParams);

    const totalReviews = countResult[0].total;
    const totalPages = Math.ceil(totalReviews / limit);

    // Query lấy reviews
    const [reviews] = await pool.query(`
      SELECT 
        r.*,
        u.fullname as customer_name,
        u.email as customer_email,
        u.avatar_url as customer_avatar,
        p.name as product_name,
        p.image_url as product_image,
        b.name as brand_name,
        rr.id as reply_id,
        rr.content as reply_content,
        rr.created_at as reply_created_at,
        admin.fullname as admin_name,
        admin.avatar_url as admin_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN review_replies rr ON r.id = rr.review_id
      LEFT JOIN users admin ON rr.user_id = admin.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        admin_reply: review.reply_id ? {
          id: review.reply_id,
          content: review.reply_content,
          created_at: review.reply_created_at,
          admin_name: review.admin_name,
          admin_avatar: review.admin_avatar
        } : null
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalReviews
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message 
    });
  }
});

// Xác minh đánh giá
router.put('/reviews/:id/verify', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    await pool.query(
      'UPDATE reviews SET is_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isVerified ? 1 : 0, id]
    );

    res.json({ 
      message: `Đã ${isVerified ? 'xác minh' : 'bỏ xác minh'} đánh giá`,
      reviewId: id,
      isVerified: !!isVerified
    });

  } catch (error) {
    console.error('Error verifying review:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xác minh đánh giá',
      error: error.message 
    });
  }
});

// Xóa đánh giá
router.delete('/reviews/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ message: 'Xóa đánh giá thành công' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Lỗi khi xóa đánh giá', error: error.message });
  }
});

// Thêm route lấy thống kê đánh giá
router.get('/reviews/stats', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    // Query để lấy tổng số đánh giá và trung bình rating
    const [overallStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 1) as average_rating,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_count
      FROM reviews
    `);

    // Query để lấy phân bố rating
    const [ratingDistribution] = await pool.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      GROUP BY rating
      ORDER BY rating DESC
    `);

    // Tạo object phân bố rating
    const distribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    // Điền dữ liệu vào object phân bố
    ratingDistribution.forEach(item => {
      distribution[item.rating] = parseInt(item.count);
    });

    res.json({
      stats: {
        totalReviews: parseInt(overallStats[0].total_reviews),
        averageRating: parseFloat(overallStats[0].average_rating || 0),
        verifiedCount: parseInt(overallStats[0].verified_count),
        ratingDistribution: distribution
      }
    });

  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê đánh giá',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Thêm route lấy thống kê theo thời gian (nếu cần)
router.get('/reviews/stats/timeline', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [timelineStats] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        ROUND(AVG(rating), 1) as average_rating
      FROM reviews
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    res.json({
      timeline: timelineStats.map(stat => ({
        date: stat.date,
        count: parseInt(stat.count),
        averageRating: parseFloat(stat.average_rating || 0)
      }))
    });

  } catch (error) {
    console.error('Error getting timeline stats:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê theo thời gian',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Lấy tất cả replies của một review
router.get('/reviews/:reviewId/replies', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const [replies] = await pool.query(`
      SELECT 
        rr.*,
        u.fullname,
        u.avatar_url,
        u.role_id
      FROM review_replies rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.review_id = ?
      ORDER BY rr.created_at ASC
    `, [reviewId]);

    res.json({
      replies: replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        created_at: reply.created_at,
        user_type: reply.user_type,
        user: {
          name: reply.fullname,
          avatar_url: reply.avatar_url,
          is_admin: reply.role_id === 1 // Giả sử role_id 1 là admin
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách phản hồi',
      error: error.message 
    });
  }
});

// Thêm reply mới
router.post('/reviews/:reviewId/replies', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Nội dung phản hồi không được để trống' });
    }

    // Thêm reply mới
    const [result] = await pool.query(
      `INSERT INTO review_replies (review_id, user_id, content, user_type) 
       VALUES (?, ?, ?, 'admin')`,
      [reviewId, userId, content]
    );

    // Lấy thông tin reply vừa tạo
    const [reply] = await pool.query(`
      SELECT 
        rr.*,
        u.fullname,
        u.avatar_url,
        u.role_id
      FROM review_replies rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Đã thêm phản hồi thành công',
      reply: {
        id: reply[0].id,
        content: reply[0].content,
        created_at: reply[0].created_at,
        user_type: reply[0].user_type,
        user: {
          name: reply[0].fullname,
          avatar_url: reply[0].avatar_url,
          is_admin: reply[0].role_id === 1
        }
      }
    });

  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ 
      message: 'Lỗi khi thêm phản hồi',
      error: error.message 
    });
  }
});

module.exports = router;