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

    let query = `
      SELECT p.*, c.name as category_name, b.name as brand_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR b.name LIKE ?
      LIMIT ? OFFSET ?
    `;
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR b.name LIKE ?
    `;
    let searchParam = `%${search}%`;

    const [products, [totalCount]] = await Promise.all([
      pool.query(query, [searchParam, searchParam, searchParam, searchParam, limit, offset]),
      pool.query(countQuery, [searchParam, searchParam, searchParam, searchParam])
    ]);

    res.json({
      products: products[0],
      currentPage: page,
      totalPages: Math.ceil(totalCount[0].count / limit),
      totalProducts: totalCount[0].count
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

    const { name, description, category_id, brand, variants } = req.body;
    let image_url = req.body.image_url;

    // Xử lý upload ảnh mới (nếu có)
    if (req.file) {
      // ... (code upload ảnh tương tự như trong hàm thêm sản phẩm)
    }

    // Cập nhật thông tin sản phẩm
    await connection.query(
      'UPDATE products SET name = ?, description = ?, category_id = ?, brand_id = ?, image_url = ? WHERE id = ?',
      [name, description, category_id, brand, image_url, req.params.id]
    );

    // Cập nhật biến thể
    if (variants && variants.length > 0) {
      await connection.query('DELETE FROM productvariants WHERE product_id = ?', [req.params.id]);
      for (const variant of variants) {
        await connection.query(
          'INSERT INTO productvariants (product_id, name, price) VALUES (?, ?, ?)',
          [req.params.id, variant.name, variant.price]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Cập nhật sản phẩm thành công' });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi cập nhật sản phẩm', error: error.message });
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
