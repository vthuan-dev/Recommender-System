const express = require('express');
const { pool } = require('../../database/dbconfig');
const { storage } = require('../../firebaseConfig');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add-products', upload.single('image'), async (req, res) => {
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

// Thêm route xóa sản phẩm
router.delete('/delete-product/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const productId = req.params.id;
        console.log(`Bắt đầu xóa sản phẩm với ID: ${productId}`);

        // Bắt đầu transaction
        await connection.beginTransaction();

        try {
            // Xóa các biến thể của sản phẩm
            console.log('Xóa các biến thể của sản phẩm');
            await connection.query('DELETE FROM productvariants WHERE product_id = ?', [productId]);

            // Lấy thông tin sản phẩm để xóa ảnh (nếu cần)
            const [productInfo] = await connection.query('SELECT image_url FROM products WHERE id = ?', [productId]);

            // Xóa sản phẩm
            console.log('Xóa sản phẩm');
            const [result] = await connection.query('DELETE FROM products WHERE id = ?', [productId]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
            }

            // Xóa ảnh từ Firebase Storage (nếu có)
            if (productInfo[0] && productInfo[0].image_url) {
                const fileName = productInfo[0].image_url.split('/').pop().split('?')[0];
                const file = storage.bucket().file(`products/${fileName}`);
                await file.delete().catch(console.error);
                console.log('Đã xóa ảnh sản phẩm từ storage');
            }

            // Commit transaction
            await connection.commit();
            console.log('Transaction đã được commit');

            res.status(200).json({ message: 'Sản phẩm đã được xóa thành công' });
        } catch (error) {
            // Rollback nếu có lỗi
            await connection.rollback();
            console.error('Lỗi trong quá trình xóa sản phẩm, đã rollback:', error);
            throw error;
        }
    } catch (error) {
        console.error('Lỗi xóa sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: error.message });
    } finally {
        connection.release(); // Đảm bảo connection được giải phóng
    }
});


module.exports = router;