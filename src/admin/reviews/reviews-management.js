const express = require('express');
const router = express.Router();
const { pool, authenticateJWT } = require('../../database/dbconfig');

// Middleware kiểm tra quyền admin
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

// Lấy danh sách đánh giá
router.get('/reviews', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    console.log('Đang lấy danh sách đánh giá...');
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

    // Query với error handling
    let reviews, totalCount;
    try {
      const reviewsQuery = `
        SELECT 
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          r.updated_at,
          r.is_verified,
          u.fullname as customer_name,
          u.email as customer_email,
          u.avatar_url as customer_avatar,
          p.name as product_name,
          p.image_url as product_image,
          b.name as brand_name,
          (SELECT 
            JSON_OBJECT(
              'id', rr.id,
              'content', rr.content,
              'created_at', rr.created_at,
              'admin_name', admin.fullname,
              'admin_avatar', admin.avatar_url
            )
           FROM review_replies rr
           JOIN users admin ON rr.admin_id = admin.id
           WHERE rr.review_id = r.id
           LIMIT 1) as admin_reply
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `;

      console.log('SQL Query:', reviewsQuery);
      console.log('Query Params:', [...queryParams, limit, offset]);

      [reviews] = await pool.query(reviewsQuery, [...queryParams, limit, offset]);

      [totalCount] = await pool.query(
        `SELECT COUNT(*) as count FROM reviews r WHERE ${whereClause}`,
        queryParams
      );

      console.log('Tìm thấy:', reviews.length, 'đánh giá');

    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${dbError.message}`);
    }

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        created_at: new Date(review.created_at).toISOString(),
        updated_at: new Date(review.updated_at).toISOString(),
        is_verified: !!review.is_verified
      })),
      currentPage: page,
      totalPages: Math.ceil(totalCount[0].count / limit),
      totalReviews: totalCount[0].count
    });

  } catch (error) {
    console.error('Error in /reviews:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách đánh giá', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Thêm route để admin trả lời review
router.post('/reviews/:reviewId/reply', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const adminId = req.user.userId;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Nội dung trả lời không được để trống' });
    }

    const [result] = await pool.query(
      'INSERT INTO review_replies (review_id, admin_id, content) VALUES (?, ?, ?)',
      [reviewId, adminId, content]
    );

    const [reply] = await pool.query(`
      SELECT 
        rr.*,
        u.fullname as admin_name,
        u.avatar_url as admin_avatar
      FROM review_replies rr
      JOIN users u ON rr.admin_id = u.id
      WHERE rr.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Đã trả lời đánh giá thành công',
      reply: reply[0]
    });

  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ 
      message: 'Lỗi khi trả lời đánh giá',
      error: error.message 
    });
  }
});

module.exports = router;