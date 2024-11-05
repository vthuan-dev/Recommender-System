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
      console.log('Bắt đầu xử lý yêu cầu thêm sản phẩm');
      const { name, description, category_id, brand, variants } = req.body;
      console.log('Dữ liệu nhận được:', { name, description, category_id, brand, variants });
      let image_url = '';

      // Upload ảnh lên Firebase Storage nếu có file
      if (req.file) {
        try {
          console.log('File info:', req.file);
          const dateTime = Date.now();
          const fileName = `products/${dateTime}_${req.file.originalname}`;
          console.log('Attempting to upload file:', fileName);
          
          const bucket = storage.bucket();
          const file = bucket.file(fileName);
          
          // Sử dụng Promise để xử lý việc upload file
          await new Promise((resolve, reject) => {
            const blobStream = file.createWriteStream({
              metadata: {
                contentType: req.file.mimetype
              }
            });

            blobStream.on('error', (error) => {
              console.error('Error uploading:', error);
              reject(error);
            });

            blobStream.on('finish', () => {
              console.log('File uploaded successfully');
              resolve();
            });

            blobStream.end(req.file.buffer);
          });

          // Lấy URL của file đã upload
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
          });
          image_url = url;
          console.log('Download URL:', image_url);
        } catch (uploadError) {
          console.error('Lỗi upload file:', uploadError);
          return res.status(500).json({ message: 'Lỗi upload file', error: uploadError.message });
        }
      }
      
      // Kiểm tra xem category có tồn tại không
      console.log('Kiểm tra danh mục:', category_id);
      const [categories] = await connection.query('SELECT * FROM categories WHERE id = ?', [category_id]);
      if (categories.length === 0) {
        console.log('Danh mục không tồn tại');
        return res.status(400).json({ message: 'Danh mục không tồn tại' });
      }
  
      // Kiểm tra và thêm thương hiệu nếu cần
      let brandId;
      const [existingBrand] = await connection.query('SELECT id FROM brands WHERE name = ?', [brand]);
      if (existingBrand.length === 0) {
        const [brandResult] = await connection.query('INSERT INTO brands (name) VALUES (?)', [brand]);
        brandId = brandResult.insertId;
      } else {
        brandId = existingBrand[0].id;
      }

      // Bắt đầu transaction
      await connection.beginTransaction();
      console.log('Bắt đầu transaction');

      try {
        console.log('Thêm sản phẩm vào database');
        const [productResult] = await connection.query(
          'INSERT INTO products (name, description, category_id, brand_id, image_url) VALUES (?, ?, ?, ?, ?)',
          [name, description, category_id, brandId, image_url]
        );
        
        const productId = productResult.insertId;
        console.log('Sản phẩm đã được thêm với ID:', productId);
        
        // Thêm các biến thể sản phẩm
        if (variants && variants.length > 0) {
          console.log('Thêm biến thể sản phẩm');
          const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
          for (const variant of parsedVariants) {
            await connection.query(
              'INSERT INTO productvariants (product_id, name, price) VALUES (?, ?, ?)',
              [productId, variant.name, variant.price]
            );
          }
          console.log(`Đã thêm ${parsedVariants.length} biến thể cho sản phẩm`);
        }
        
        // Commit transaction
        await connection.commit();
        console.log('Transaction đã được commit');
        
        res.status(201).json({ productId, image_url, message: 'Sản phẩm đã được thêm' });
      } catch (error) {
        // Rollback nếu có lỗi
        await connection.rollback();
        console.error('Lỗi trong quá trình thêm sản phẩm, đã rollback:', error);
        throw error;
      }
    } catch (error) {
      console.error('Lỗi thêm sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi thêm sản phẩm', error: error.message });
    } finally {
      connection.release(); // Đảm bảo connection được giải phóng
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

// Cập nhật thông tin sản phẩm
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

    // Xóa biến thể
    await connection.query('DELETE FROM productvariants WHERE product_id = ?', [req.params.id]);

    // Xóa sản phẩm
    const [result] = await connection.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Xóa ảnh từ Firebase Storage (nếu cần)
    // ... (code xóa ảnh từ Firebase)

    await connection.commit();
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi xóa sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: error.message });
  } finally {
    connection.release();
  }
});




module.exports = router;
