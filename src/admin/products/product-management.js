const express = require('express');
const { pool } = require('../../database/dbconfig');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateJWT } = require('../../database/dbconfig');
const router = express.Router();

// Lấy tất cả sản phẩm (không phân trang) cho xuất Excel
router.get('/products/all', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [products] = await connection.query(`
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        GROUP_CONCAT(v.id) as variant_ids,
        MIN(v.price) as min_price,
        MAX(v.price) as max_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN productvariants v ON p.id = v.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    // Lấy variants cho mỗi sản phẩm
    for (let product of products) {
      const [variants] = await connection.query(
        'SELECT * FROM productvariants WHERE product_id = ?',
        [product.id]
      );
      product.variants = variants;
    }

    res.json({ 
      success: true,
      products 
    });
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách sản phẩm',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../../assets/uploads/products');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Không hỗ trợ định dạng file này'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // giới hạn 5MB
  }
});

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
      
      // Validate input
      if (!name || !description || !category_id || !brand_id) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc',
          errors: {
            name: !name ? 'Tên sản phẩm là bắt buộc' : null,
            description: !description ? 'Mô tả là bắt buộc' : null,
            category_id: !category_id ? 'Danh mục là bắt buộc' : null,
            brand_id: !brand_id ? 'Thương hiệu là bắt buộc' : null
          }
        });
      }

      // Validate variants
      const parsedVariants = JSON.parse(variants);
      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Phải có ít nhất một phiên bản sản phẩm',
          errors: { variants: 'Phải có ít nhất một phiên bản sản phẩm' }
        });
      }

      let image_url = '';
      if (req.file) {
        image_url = `/assets/uploads/products/${req.file.filename}`;
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

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name,
        (SELECT COUNT(*) FROM user_product_views upv WHERE upv.product_id = p.id) as view_count,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count,
        (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) as avg_rating,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', pv.id,
            'name', pv.name,
            'price', pv.price,
            'initial_stock', pv.initial_stock,
            'sold_count', pv.sold_count
          )
        ) as variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN productvariants pv ON p.id = pv.product_id
    `;

    let countQuery = "SELECT COUNT(DISTINCT p.id) as total FROM products p";
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push("(p.name LIKE ? OR p.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereConditions.push("p.category_id = ?");
      params.push(category);
    }

    if (brand) {
      whereConditions.push("p.brand_id = ?");
      params.push(brand);
    }

    if (whereConditions.length > 0) {
      const whereClause = " WHERE " + whereConditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += " GROUP BY p.id ORDER BY p.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [products] = await pool.query(query, params);
    const [totalResult] = await pool.query(countQuery, params.slice(0, -2));

    // Parse variants JSON string
    const formattedProducts = products.map(product => ({
      ...product,
      variants: product.variants ? JSON.parse(`[${product.variants}]`) : []
    }));

    res.json({
      success: true,
      products: formattedProducts,
      totalPages: Math.ceil(totalResult[0].total / limit),
      currentPage: page,
      totalProducts: totalResult[0].total
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách sản phẩm',
      error: error.message
    });
  }
});

// Lấy chi tiết một sản phẩm
router.get('/products/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  try {
    const [product] = await pool.query(
      `SELECT 
        p.*,
        b.name as brand_name,
        c.name as category_name,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', pv.id,
            'name', pv.name,
            'price', pv.price,
            'initial_stock', pv.initial_stock
          )
        ) as variants
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN productvariants pv ON p.id = pv.product_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [req.params.id]
    );

    if (!product || product.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Sản phẩm không tồn tại' 
      });
    }

    // Parse variants từ string sang array
    const formattedProduct = {
      ...product[0],
      variants: product[0].variants ? JSON.parse(`[${product[0].variants}]`) : []
    };

    res.json({
      success: true,
      data: formattedProduct
    });

  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy chi tiết sản phẩm', 
      error: error.message 
    });
  }
});

// Cập nhật thông tin sn phẩm
router.put('/products/:id', authenticateJWT, checkAdminRole, upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, description, category_id, brand_id, variants } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (image_url) {
        const oldImagePath = path.join(__dirname, '../../', image_url);
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      // Cập nhật đường dẫn ảnh mới
      image_url = `/assets/uploads/products/${req.file.filename}`;
    }

    // Cập nhật thông tin sản phẩm
    await connection.query(
      'UPDATE products SET name = ?, description = ?, category_id = ?, brand_id = ?, image_url = ? WHERE id = ?',
      [name, description, category_id, brand_id, image_url, req.params.id]
    );

    // Cập nhật biến thể
    if (variants) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      
      // Xóa inventory_transactions trước
      await connection.query(
        'DELETE FROM inventory_transactions WHERE variant_id IN (SELECT id FROM productvariants WHERE product_id = ?)',
        [req.params.id]
      );
      
      // Sau đó mới xóa productvariants
      await connection.query('DELETE FROM productvariants WHERE product_id = ?', [req.params.id]);
      
      // Thêm các biến thể mới
      for (const variant of parsedVariants) {
        const [variantResult] = await connection.query(
          'INSERT INTO productvariants (product_id, name, price, initial_stock) VALUES (?, ?, ?, ?)',
          [req.params.id, variant.name, variant.price, variant.initial_stock || 0]
        );

        // Thêm giao dịch nhập kho mới nếu có initial_stock
        if (variant.initial_stock > 0) {
          await connection.query(
            'INSERT INTO inventory_transactions (variant_id, quantity, type, note) VALUES (?, ?, ?, ?)',
            [variantResult.insertId, variant.initial_stock, 'import', 'Cập nhật số lượng ban đầu']
          );
        }
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
    const [brands] = await pool.query('SELECT id, name, description FROM brands ORDER BY name');
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể tải danh sách thương hiệu',
      error: error.message 
    });
  }
});

// Xóa sản phẩm
router.delete('/products/:id', authenticateJWT, checkAdminRole, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const productId = req.params.id;

    // 1. Lấy đường dẫn ảnh và kiểm tra sản phẩm tồn tại
    const [product] = await connection.query('SELECT image_url FROM products WHERE id = ?', [productId]);
    
    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const imageUrl = product[0]?.image_url;

    // 2. Xóa các giao dịch kho liên quan
    await connection.query(`
      DELETE it FROM inventory_transactions it
      INNER JOIN productvariants pv ON it.variant_id = pv.id
      WHERE pv.product_id = ?
    `, [productId]);

    // 3. Xóa các order items liên quan (nếu có)
    await connection.query(`
      DELETE oi FROM orderitems oi
      INNER JOIN productvariants pv ON oi.variant_id = pv.id
      WHERE pv.product_id = ?
    `, [productId]);

    // 4. Xóa các cart items liên quan (nếu có)
    await connection.query(`
      DELETE ci FROM cartitems ci
      INNER JOIN productvariants pv ON ci.variant_id = pv.id
      WHERE pv.product_id = ?
    `, [productId]);

    // 5. Xóa các biến thể của sản phẩm
    await connection.query('DELETE FROM productvariants WHERE product_id = ?', [productId]);

    // 6. Xóa các reviews của sản phẩm (nếu có)
    await connection.query('DELETE FROM reviews WHERE product_id = ?', [productId]);

    // 7. Xóa sản phẩm
    const [deleteResult] = await connection.query('DELETE FROM products WHERE id = ?', [productId]);

    if (deleteResult.affectedRows === 0) {
      throw new Error('Không thể xóa sản phẩm');
    }

    // 8. Xóa file ảnh nếu có
    if (imageUrl) {
      const imagePath = path.join(__dirname, '../../', imageUrl);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
        // Không throw error vì xóa file ảnh thất bại không ảnh hưởng đến transaction
      }
    }

    await connection.commit();
    res.json({ 
      success: true,
      message: 'Xóa sản phẩm thành công',
      productId 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
