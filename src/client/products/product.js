const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../database/dbconfig');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const router = express.Router();
const cors = require('cors');
const { authenticateJWT } = require('../../database/dbconfig');
dotenv.config();

router.get('/products/bestsellers', async (req, res) => {
  try {
    console.log('Đang truy vấn sản phẩm bán chạy...');
    const [bestsellers] = await pool.query(
      `SELECT p.*, SUM(pv.sold_count) as total_sold
       FROM products p
       JOIN productvariants pv ON p.id = pv.product_id
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 10`
    );
    
    console.log('Kết quả truy vấn:', bestsellers);
    
    if (bestsellers.length === 0) {
      console.log('Không tìm thấy sản phẩm bán chạy');
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm bán chạy' });
    }
    
    res.json(bestsellers);
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm bán chạy:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm bán chạy', error: error.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    console.log('Đang lấy chi tiết sản phẩm ID:', req.params.id);
    
    // Lấy thông tin chi tiết sản phẩm
    const [product] = await pool.query(`
      SELECT 
        p.*,
        b.name as brand_name,
        c.name as category_name,
        (SELECT MIN(price) FROM productvariants WHERE product_id = p.id) as min_price,
        (SELECT MAX(price) FROM productvariants WHERE product_id = p.id) as max_price,
        (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count,
        (SELECT SUM(sold_count) FROM productvariants WHERE product_id = p.id) as total_sold
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product[0]) {
      console.log('Không tìm thấy sản phẩm với ID:', req.params.id);
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Lấy variants của sản phẩm
    const [variants] = await pool.query(`
      SELECT * FROM productvariants WHERE product_id = ?
    `, [req.params.id]);

    // Lấy đánh giá gần đây
    const [recentReviews] = await pool.query(`
      SELECT r.*, u.fullname, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [req.params.id]);

    // Kết hợp tất cả thông tin
    const productDetail = {
      ...product[0],
      variants,
      recent_reviews: recentReviews
    };

    console.log('Chi tiết sản phẩm:', productDetail);
    res.json(productDetail);

  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy chi tiết sản phẩm', 
      error: error.message 
    });
  }
});

router.get('/products', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.*,
        b.name as brand_name,
        c.name as category_name,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        SUM(pv.sold_count) as total_sold,
        (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      GROUP BY p.id
    `);
    
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm', error: error.message });
  }
});

// API lọc sản phẩm với phân trang
router.get('/products/filter', async (req, res) => {
  try {
    const { 
      minPrice, 
      maxPrice, 
      category,
      brand,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 12
    } = req.query;

    let sql = `
      SELECT 
        p.*,
        b.name as brand_name,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        SUM(pv.sold_count) as total_sold
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      WHERE 1=1
    `;
    const params = [];

    if (minPrice) {
      sql += ' AND pv.price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      sql += ' AND pv.price <= ?';
      params.push(maxPrice);
    }
    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }
    if (brand) {
      sql += ' AND p.brand_id = ?';
      params.push(brand);
    }

    sql += ' GROUP BY p.id';

    // Sắp xếp
    const allowedSortFields = ['created_at', 'name'];
    if (allowedSortFields.includes(sortBy)) {
      sql += ` ORDER BY p.${sortBy} ${sortOrder}`;
    }

    // Phân trang
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [products] = await pool.query(sql, params);
    
    // Đếm tổng số sản phẩm
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products p WHERE 1=1' + 
      (category ? ' AND p.category_id = ?' : '') +
      (brand ? ' AND p.brand_id = ?' : ''),
      [category, brand].filter(Boolean)
    );

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Lỗi khi lọc sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi lọc sản phẩm', error: error.message });
  }
});

// API cho Categories lấy danh mục sản phẩm
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách danh mục', error: error.message });
  }
});


//tìm kiếm sản phẩm
router.get('/products/search', async (req, res) => {
  try {
    const { query, category } = req.query;
    let sql = 'SELECT * FROM products WHERE name LIKE ?';
    let params = [`%${query}%`];
  
    if (category) {
      sql += ' AND category_id = ?';
      params.push(category);
    }
  
    const [products] = await pool.query(sql, params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tìm kiếm sản phẩm', error: error.message });
  }
});
//lấy sản phẩm theo danh mục
router.get('/categories/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [products] = await pool.query('SELECT * FROM products WHERE category_id = ?', [categoryId]);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy sản phẩm theo danh mục', error: error.message });
  }
});
//sản phẩm mới  nhất
router.get('/products/new', async (req, res) => {
  try {
    const [newProducts] = await pool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 10');
    res.json(newProducts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy sản phẩm mới', error: error.message });
  }
});

//sản phẩm theo thương hiệu
router.get('/products/brand/:brand', async (req, res) => {
  try {
    const { brand } = req.params;
    
    // Đầu tiên, tìm ID của thương hiệu
    const [brandResult] = await pool.query('SELECT id FROM brands WHERE name = ?', [brand]);
    
    if (brandResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
    }
    
    const brandId = brandResult[0].id;
    
    // Đếm số lượng sản phẩm thuộc thương hiệu này
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as productCount FROM products WHERE brand_id = ?', 
      [brandId]
    );
    
    const productCount = countResult[0].productCount;
    
    // Lấy danh sách sản phẩm (có thể giới hạn số lượng nếu cần)
    const [products] = await pool.query(
      'SELECT p.*, b.name as brand_name FROM products p JOIN brands b ON p.brand_id = b.id WHERE p.brand_id = ? LIMIT 10', 
      [brandId]
    );
    
    res.json({
      brand: brand,
      productCount: productCount,
      products: products
    });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo thương hiệu:', error);
    res.status(500).json({ message: 'Lỗi lấy sản phẩm theo thương hiệu', error: error.message });
  }
});

//sản phẩm theo giá
router.get('/products/filter', async (req, res) => {
  try {
    const { minPrice, maxPrice, category } = req.query;
    let sql = 'SELECT p.* FROM products p JOIN productvariants pv ON p.id = pv.product_id WHERE 1=1';
    const params = [];
  
    if (minPrice) {
      sql += ' AND pv.price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      sql += ' AND pv.price <= ?';
      params.push(maxPrice);
    }
    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }
  
    sql += ' GROUP BY p.id';
  
    const [products] = await pool.query(sql, params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lọc sản phẩm', error: error.message });
  }
});


//ghi lại lượt xem sản phẩm khi người dùng xem sản phẩm
router.post('/products/:id/view', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      `INSERT INTO user_product_views (user_id, product_id) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE 
       view_count = view_count + 1, 
       last_viewed_at = CURRENT_TIMESTAMP`,
      [userId, id]
    );

    res.status(200).json({ message: 'Lượt xem đã được ghi lại' });
  } catch (error) {
    console.error('Lỗi khi ghi lại lượt xem sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi khi ghi lại lượt xem sản phẩm', error: error.message });
  }
});

//gợi ý sản phẩm dựa trên lượt xem trước đó của người dùng 
router.get('/recommendations', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy các sản phẩm mà người dùng hiện tại đã xem
    const [userViews] = await pool.query(
      'SELECT product_id FROM user_product_views WHERE user_id = ?',
      [userId]
    );
    const userProductIds = userViews.map(view => view.product_id);

    // Tìm những người dùng có hành vi tương tự
    const [similarUsers] = await pool.query(
      `SELECT DISTINCT upv.user_id
       FROM user_product_views upv
       WHERE upv.product_id IN (?) AND upv.user_id != ?
       GROUP BY upv.user_id
       HAVING COUNT(DISTINCT upv.product_id) >= ?`,
      [userProductIds, userId, Math.ceil(userProductIds.length * 0.5)]
    );

    if (similarUsers.length === 0) {
      return res.json([]);
    }

    // Lấy các sản phẩm được xem bởi những người dùng tương tự
    const [recommendedProducts] = await pool.query(
      `SELECT p.*, COUNT(DISTINCT upv.user_id) as view_count
       FROM products p
       JOIN user_product_views upv ON p.id = upv.product_id
       WHERE upv.user_id IN (?) AND p.id NOT IN (?)
       GROUP BY p.id
       ORDER BY view_count DESC
       LIMIT 10`,
      [similarUsers.map(u => u.user_id), userProductIds]
    );

    res.json(recommendedProducts);
  } catch (error) {
    console.error('Lỗi khi lấy gợi ý sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi khi lấy gợi ý sản phẩm', error: error.message });
  }
});

// ... (giữ nguyên code hiện tại)

// Route để lấy sản phẩm tạo gần đây nhất
router.get('/products/recent', async (req, res) => {
  try {
    const limit = req.query.limit || 10; // Số lượng sản phẩm muốn lấy, mặc định là 10
    const [recentProducts] = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT ?',
      [parseInt(limit)]
    );

    if (recentProducts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm nào' });
    }

    console.log(`Đã lấy ${recentProducts.length} sản phẩm gần đây nhất`);
    res.json(recentProducts);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm gần đây:', error);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm gần đây', error: error.message });
  }
});


// Route lấy sản phẩm theo category_id
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log('Đang lấy sản phẩm cho category:', categoryId);

    // Kiểm tra xem category có tồn tại không
    const [categoryCheck] = await pool.query(
      'SELECT * FROM categories WHERE id = ?', 
      [categoryId]
    );

    if (categoryCheck.length === 0) {
      return res.status(404).json({ 
        message: 'Không tìm thấy danh mục này',
        categoryId 
      });
    }

    // Query sản phẩm với đầy đủ thông tin
    const [products] = await pool.query(`
      SELECT 
        p.*,
        b.name as brand_name,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        SUM(pv.sold_count) as total_sold
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      WHERE p.category_id = ?
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 12
    `, [categoryId]);

    console.log(`Tìm thấy ${products.length} sản phẩm cho category ${categoryId}`);

    // Nếu không có sản phẩm
    if (products.length === 0) {
      return res.json({
        message: 'Không có sản phẩm nào trong danh mục này',
        categoryId,
        categoryName: categoryCheck[0].name,
        products: []
      });
    }

    // Lấy thông tin đánh giá cho từng sản phẩm
    for (let product of products) {
      const [ratingResult] = await pool.query(`
        SELECT 
          ROUND(AVG(rating), 1) as avg_rating, 
          COUNT(*) as review_count
        FROM reviews 
        WHERE product_id = ?
      `, [product.id]);

      product.rating = {
        average: ratingResult[0].avg_rating || 0,
        count: ratingResult[0].review_count || 0
      };

      // Lấy variants của sản phẩm
      const [variants] = await pool.query(`
        SELECT id, name, price, sold_count
        FROM productvariants 
        WHERE product_id = ?
      `, [product.id]);

      product.variants = variants;
    }

    res.json({
      category: categoryCheck[0].name,
      categoryId: parseInt(categoryId),
      total: products.length,
      products: products
    });

  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo category:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy sản phẩm theo category', 
      error: error.message,
      categoryId 
    });
  }
});

// Thêm sản phẩm vào danh sách yêu thích
router.post('/favorites', authenticateJWT, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    // Kiểm tra sản phẩm đã được yêu thích chưa
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Sản phẩm đã có trong danh sách yêu thích' });
    }

    await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );

    res.json({ message: 'Đã thêm vào danh sách yêu thích' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm vào yêu thích', error: error.message });
  }
});

// Lấy danh sách sản phẩm yêu thích
router.get('/favorites', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [favorites] = await pool.query(`
      SELECT p.*, b.name as brand_name
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE f.user_id = ?
    `, [userId]);
    
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích', error: error.message });
  }
});

// API để lấy flash deals
router.get('/flash-deals', async (req, res) => {
  try {
    const [flashDeals] = await pool.query(`
      SELECT 
        p.*,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        b.name as brand_name,
        (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating
      FROM products p
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE pv.price < (
        SELECT AVG(price) FROM productvariants
      )
      GROUP BY p.id
      ORDER BY RAND()
      LIMIT 8
    `);

    res.json(flashDeals);
  } catch (error) {
    console.error('Lỗi khi lấy flash deals:', error);
    res.status(500).json({ message: 'Lỗi khi lấy flash deals', error: error.message });
  }
});

// API để lấy trending products
router.get('/trending-products', async (req, res) => {
  try {
    const [trendingProducts] = await pool.query(`
      SELECT 
        p.*,
        b.name as brand_name,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price,
        SUM(pv.sold_count) as total_sold,
        (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY total_sold DESC, avg_rating DESC
      LIMIT 8
    `);

    res.json(trendingProducts);
  } catch (error) {
    console.error('Lỗi khi lấy trending products:', error);
    res.status(500).json({ message: 'Lỗi khi lấy trending products', error: error.message });
  }
});

// API để lấy recommended products cho user đã đăng nhập
router.get('/recommended-products', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Lấy các category_id mà user đã xem nhiều nhất
    const [userPreferences] = await pool.query(`
      SELECT p.category_id, COUNT(*) as view_count
      FROM user_product_views upv
      JOIN products p ON upv.product_id = p.id
      WHERE upv.user_id = ?
      GROUP BY p.category_id
      ORDER BY view_count DESC
      LIMIT 3
    `, [userId]);

    if (userPreferences.length === 0) {
      // Nếu chưa có lịch sử xem, trả về sn phẩm phổ biến
      const [popularProducts] = await pool.query(`
        SELECT p.*, b.name as brand_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        ORDER BY RAND()
        LIMIT 8
      `);
      return res.json(popularProducts);
    }

    // Lấy sản phẩm từ các category ưa thích
    const categoryIds = userPreferences.map(pref => pref.category_id);
    const [recommendedProducts] = await pool.query(`
      SELECT DISTINCT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.category_id IN (?)
      AND p.id NOT IN (
        SELECT product_id 
        FROM user_product_views 
        WHERE user_id = ?
      )
      ORDER BY RAND()
      LIMIT 8
    `, [categoryIds, userId]);

    res.json(recommendedProducts);
  } catch (error) {
    console.error('Lỗi khi lấy recommended products:', error);
    res.status(500).json({ message: 'Lỗi khi lấy recommended products', error: error.message });
  }
});

// 1. API lấy chi tiết variant của sản phẩm
router.get('/products/:id/variants', async (req, res) => {
  try {
    const [variants] = await pool.query(`
      SELECT pv.*, 
             COALESCE(pv.initial_stock - SUM(CASE 
               WHEN it.type = 'export' THEN it.quantity 
               WHEN it.type = 'import' THEN -it.quantity 
               ELSE 0 
             END), pv.initial_stock) as current_stock
      FROM productvariants pv
      LEFT JOIN inventory_transactions it ON pv.id = it.variant_id
      WHERE pv.product_id = ?
      GROUP BY pv.id
    `, [req.params.id]);
    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy variants', error: error.message });
  }
});

// 2. API lấy đánh giá của sản phẩm với phân trang
router.get('/products/:id/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [reviews] = await pool.query(`
      SELECT r.*, u.fullname, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, limit, offset]);

    const [total] = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE product_id = ?',
      [req.params.id]
    );

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total[0].count / limit),
        totalReviews: total[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá', error: error.message });
  }
});

// 3. API lấy sản phẩm liên quan
router.get('/products/:id/related', async (req, res) => {
  try {
    const [product] = await pool.query('SELECT category_id FROM products WHERE id = ?', [req.params.id]);
    if (!product.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const [relatedProducts] = await pool.query(`
      SELECT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.category_id = ? AND p.id != ?
      LIMIT 8
    `, [product[0].category_id, req.params.id]);

    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm liên quan', error: error.message });
  }
});

// 4. API lấy thống kê sản phẩm
router.get('/products/:id/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating) as avg_rating,
        SUM(pv.sold_count) as total_sold,
        COUNT(DISTINCT f.user_id) as favorite_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      LEFT JOIN favorites f ON p.id = f.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: error.message });
  }
});

module.exports = router;