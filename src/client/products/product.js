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

//lấy danh sách sản phẩm


router.get('/products', async (req, res) => {
    try {
      const [products] = await pool.query('SELECT * FROM products');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm', error: error.message });
    }
  });
  
  router.get('/products/:id', async (req, res) => {
    try {
      const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
      if (products.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      res.json(products[0]);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thông tin sản phẩm', error: error.message });
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
module.exports = router;