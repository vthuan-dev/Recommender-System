const express = require('express');
const { pool } = require('../../database/dbconfig');
const { storage } = require('../../firebaseConfig');
const multer = require('multer');
const path = require('path');
const { authenticateJWT } = require('../../database/dbconfig');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function checkAdminRole(req, res, next) {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
    }
  }

router.post('/add-products', authenticateJWT, checkAdminRole, upload.single('image'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { name, description, category_id, brand_id, variants } = req.body;
      let image_url = '';

      // Upload ảnh lên Firebase nếu có
      if (req.file) {
        const dateTime = Date.now();
        const fileName = `products/${dateTime}_${req.file.originalname}`;
        const bucket = storage.bucket();
        const file = bucket.file(fileName);
        
        await new Promise((resolve, reject) => {
          const blobStream = file.createWriteStream({
            metadata: {
              contentType: req.file.mimetype
            }
          });

          blobStream.on('error', (error) => reject(error));
          blobStream.on('finish', () => resolve());
          blobStream.end(req.file.buffer);
        });

        // Lấy URL của ảnh
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500'
        });
        image_url = url;
      }

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Thêm sản phẩm
      const [productResult] = await connection.query(
        'INSERT INTO products (name, description, category_id, brand_id, image_url) VALUES (?, ?, ?, ?, ?)',
        [name, description, category_id, brand_id, image_url]
      );

      const productId = productResult.insertId;

      // Thêm các biến thể và ghi nhận nhập kho
      if (variants) {
        const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        for (const variant of parsedVariants) {
          // Thêm variant
          const [variantResult] = await connection.query(
            'INSERT INTO productvariants (product_id, name, price, initial_stock) VALUES (?, ?, ?, ?)',
            [productId, variant.name, variant.price, variant.initial_stock || 0]
          );
          
          // Ghi nhận nhập kho
          if (variant.initial_stock > 0) {
            await connection.query(
              'INSERT INTO inventory_transactions (variant_id, quantity, type, note) VALUES (?, ?, ?, ?)',
              [variantResult.insertId, variant.initial_stock, 'import', 'Nhập kho ban đầu']
            );
          }
        }
      }

      await connection.commit();
      
      res.status(201).json({
        success: true,
        message: 'Thêm sản phẩm thành công',
        data: {
          id: productId,
          name,
          description,
          category_id,
          brand_id,
          image_url,
          variants: JSON.parse(variants)
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Lỗi thêm sản phẩm:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm sản phẩm',
        error: error.message
      });
    } finally {
      connection.release();
    }
});

// Lấy danh sách sản phẩm (có phân trang và tìm kiếm)
router.get('/products', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const brand = req.query.brand || '';

    let whereClause = '1=1';
    let params = [];

    // Tìm kiếm theo từ khóa
    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Lọc theo danh mục
    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    // Lọc theo thương hiệu
    if (brand) {
      whereClause += ' AND p.brand_id = ?';
      params.push(brand);
    }

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        (SELECT COUNT(*) FROM productvariants WHERE product_id = p.id) as variant_count,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pv.id,
            'name', pv.name,
            'price', pv.price,
            'initial_stock', pv.initial_stock
          )
        ) FROM productvariants pv WHERE pv.product_id = p.id) as variants
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN p.category_id = ? THEN 0 
          WHEN p.brand_id = ? THEN 1
          ELSE 2 
        END,
        p.name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(category || 0, brand || 0, limit, offset);

    const [products, [totalCount]] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`, params.slice(0, -2))
    ]);

    res.json({
      products: products[0],
      currentPage: page,
      totalPages: Math.ceil(totalCount.count / limit),
      totalProducts: totalCount.count
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error loading products', error: error.message });
  }
});

// Lấy chi tiết một sản phẩm
router.get('/products/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [product] = await pool.query(
      `SELECT p.*, b.name as brand_name, c.name as category_name 
       FROM products p 
       LEFT JOIN brands b ON p.brand_id = b.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (product.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    const [variants] = await pool.query('SELECT * FROM productvariants WHERE product_id = ?', [req.params.id]);

    res.json({ ...product[0], variants });
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi lấy chi tiết sản phẩm', error: error.message });
  }
});

// Cập nhật thông tin sn phẩm
router.put('/products/:id', authenticateJWT, checkAdminRole, upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, category_id, brand_id, variants } = req.body;
    let image_url = req.body.image_url;

    // Xử lý upload ảnh mới (nếu có)
    if (req.file) {
      const dateTime = Date.now();
      const fileName = `products/${dateTime}_${req.file.originalname}`;
      const bucket = storage.bucket();
      const file = bucket.file(fileName);
      
      await new Promise((resolve, reject) => {
        const blobStream = file.createWriteStream({
          metadata: {
            contentType: req.file.mimetype
          }
        });

        blobStream.on('error', (error) => reject(error));
        blobStream.on('finish', () => resolve());
        blobStream.end(req.file.buffer);
      });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });
      image_url = url;
    }

    // Cập nhật thông tin sản phẩm
    await connection.query(
      'UPDATE products SET name = ?, description = ?, category_id = ?, brand_id = ?, image_url = ? WHERE id = ?',
      [name, description, category_id, brand_id, image_url, req.params.id]
    );

    // Cập nhật biến thể
    if (variants) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      await connection.query('DELETE FROM productvariants WHERE product_id = ?', [req.params.id]);
      
      for (const variant of parsedVariants) {
        await connection.query(
          'INSERT INTO productvariants (product_id, name, price, initial_stock) VALUES (?, ?, ?, ?)',
          [req.params.id, variant.name, variant.price, variant.initial_stock || 0]
        );
      }
    }

    await connection.commit();
    res.json({ 
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: {
        id: req.params.id,
        name,
        description,
        category_id,
        brand_id,
        image_url,
        variants: variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : []
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi cập nhật sản phẩm', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});


// Lấy danh sách danh mục
router.get('/categories', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT id, name FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error loading categories', error: error.message });
  }
});

// Lấy danh sách thương hiệu
router.get('/brands', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [brands] = await pool.query('SELECT id, name FROM brands');
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Error loading brands', error: error.message });
  }
});

// Xóa sản phẩm
router.delete('/products/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Xóa cartitems trước (vì nó tham chiếu đến cả product và variant)
    await connection.query('DELETE FROM cartitems WHERE product_id = ? OR variant_id IN (SELECT id FROM productvariants WHERE product_id = ?)', 
      [req.params.id, req.params.id]);

    // 2. Xóa orderitems (nếu có)
    await connection.query('DELETE FROM orderitems WHERE product_id = ? OR variant_id IN (SELECT id FROM productvariants WHERE product_id = ?)', 
      [req.params.id, req.params.id]);

    // 3. Xóa reviews
    await connection.query('DELETE FROM reviews WHERE product_id = ?', [req.params.id]);

    // 4. Xóa product_images (nếu có)
    await connection.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);

    // 5. Xóa productvariants
    await connection.query('DELETE FROM productvariants WHERE product_id = ?', [req.params.id]);

    // 6. Cuối cùng xóa product
    const [result] = await connection.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Sản phẩm không tồn tại' 
      });
    }

    await connection.commit();
    res.json({ 
      success: true,
      message: 'Xóa sản phẩm thành công',
      deletedId: req.params.id
    });

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi xóa sản phẩm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi xóa sản phẩm', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});




module.exports = router;
