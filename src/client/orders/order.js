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
const { broadcastOrderUpdate } = require('../../websocket');

dotenv.config();

const app = express();
const { authenticateJWT } = require('../../database/dbconfig');

// Xóa phần app.use() vì đã có router
// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static(...));

router.post('/orders', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const { addressId, items } = req.body;
      const userId = req.user.userId;
  
      console.log('Request body:', req.body);
      console.log('User ID:', userId);
  
      // Validate input
      if (!addressId || !Array.isArray(items) || items.length === 0) {
        throw new Error('Dữ liệu đơn hàng không hợp lệ');
      }
  
      // Kiểm tra địa chỉ
      const [addressResult] = await connection.query(
        'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );
      
      console.log('Address check result:', addressResult);
      
      if (addressResult.length === 0) {
        throw new Error('Địa chỉ không hợp lệ');
      }
  
      // Tạo đơn hàng mới
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, address_id, total, status) VALUES (?, ?, ?, ?)',
        [userId, addressId, 0, 'pending']
      );
      const orderId = orderResult.insertId;
  
      // Thêm các mục vào đơn hàng
      let total = 0;
      for (const item of items) {
        // Kiểm tra và cập nhật số lượng tồn kho
        const [variantResult] = await connection.query(
          `SELECT pv.price, 
            (pv.initial_stock - COALESCE(pv.sold_count, 0)) as available_quantity 
           FROM productvariants pv 
           WHERE pv.id = ? 
           FOR UPDATE`,
          [item.variantId]
        );
        if (variantResult.length === 0 || variantResult[0].available_quantity < item.quantity) {
          throw new Error(`Sản phẩm ${item.variantId} không đủ số lượng trong kho`);
        }
  
        const price = variantResult[0].price;
        total += price * item.quantity;
  
        // Cập nhật đơn hàng và số lượng đã bán
        await connection.query(
          'INSERT INTO orderitems (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.productId, item.variantId, item.quantity, price]
        );
        await connection.query(
          'UPDATE productvariants SET sold_count = COALESCE(sold_count, 0) + ? WHERE id = ?',
          [item.quantity, item.variantId]
        );
        await connection.query(
          'INSERT INTO inventory_transactions (variant_id, quantity, type, note) VALUES (?, ?, ?, ?)',
          [item.variantId, item.quantity, 'export', `Order ID: ${orderId}`]
        );
      }
  
      // Cập nhật tổng giá trị đơn hàng
      await connection.query('UPDATE orders SET total = ? WHERE id = ?', [total, orderId]);
  
      // Xóa giỏ hàng
      await connection.query('DELETE FROM cartitems WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId]);
  
      await connection.commit();
      res.status(201).json({ orderId, message: 'Đơn hàng đã được tạo' });
    } catch (error) {
      await connection.rollback();
      console.error('Error in order creation:', error);
      // Log chi tiết lỗi để debug
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        sql: error.sql,
        sqlMessage: error.sqlMessage
      });
      
      res.status(500).json({ 
        message: 'Lỗi tạo đơn hàng', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      connection.release();
    }
  });
  router.get('/orders/:id', authenticateJWT, async (req, res) => {
    try {
      const [orderDetails] = await pool.query(
        `SELECT o.*, oi.product_id, oi.variant_id, oi.quantity, oi.price, 
                p.name as product_name, p.image_url, 
                pv.name as variant_name,
                b.name as brand_name,
                a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country
         FROM orders o 
         JOIN orderitems oi ON o.id = oi.order_id 
         JOIN products p ON oi.product_id = p.id 
         JOIN productvariants pv ON oi.variant_id = pv.id 
         JOIN brands b ON p.brand_id = b.id
         JOIN addresses a ON o.address_id = a.id
         WHERE o.id = ? AND o.user_id = ?`,
        [req.params.id, req.user.userId]
      );
      if (orderDetails.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      res.json(orderDetails);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thông tin đơn hàng', error: error.message });
    }
  });

  router.get('/user/addresses', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const [addresses] = await pool.query(
        'SELECT * FROM addresses WHERE user_id = ?',
        [userId]
      );
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      res.status(500).json({ message: 'Lỗi lấy danh sách địa chỉ', error: error.message });
    }
  });

  router.get('/orders/:id/status', authenticateJWT, async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.userId;
  
      // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
      const [orderStatus] = await pool.query(
        'SELECT id, status, created_at, updated_at FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );
  
      if (orderStatus.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
  
      // Định nghĩa các trạng thái có thể có
      const statusMap = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'shipped': 'Đang giao hàng',
        'delivered': 'Đã giao hàng',
        'cancelled': 'Đã hủy'
      };
  
      // Lấy mô tả trạng thái từ statusMap, nếu không có thì giữ nguyên giá trị gốc
      const statusDescription = statusMap[orderStatus[0].status] || orderStatus[0].status;
  
      res.json({
        orderId: orderStatus[0].id,
        status: orderStatus[0].status,
        statusDescription: statusDescription,
        createdAt: orderStatus[0].created_at,
        updatedAt: orderStatus[0].updated_at
      });
    } catch (error) {
      console.error('Error fetching order status:', error);
      res.status(500).json({ message: 'Lỗi kiểm tra trạng thái đơn hàng', error: error.message });
    }
  });

  //lấy danh sách đơn hàng của người dùng
  router.get('/orders', authenticateJWT, async (req, res) => {
    console.log('Auth Header:', req.headers.authorization);
    try {
      const userId = req.user.userId;
      console.log('User ID:', userId);
      
      const [orders] = await pool.query(`
        SELECT 
          o.id, o.total, o.status, o.created_at,
          oi.product_id, oi.variant_id, oi.quantity, oi.price,
          p.name as product_name, p.image_url,
          pv.name as variant_name,
          b.name as brand_name
        FROM orders o
        LEFT JOIN orderitems oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN productvariants pv ON oi.variant_id = pv.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC`,
        [userId]
      );

      // Format lại dữ liệu
      const formattedOrders = orders.reduce((acc, curr) => {
        const existingOrder = acc.find(o => o.id === curr.id);
        if (existingOrder) {
          if (curr.product_id) {
            existingOrder.items.push({
              product_id: curr.product_id,
              product_name: curr.product_name,
              variant_name: curr.variant_name,
              brand_name: curr.brand_name,
              quantity: curr.quantity,
              price: curr.price,
              image_url: curr.image_url
            });
          }
        } else {
          acc.push({
            id: curr.id,
            total: curr.total,
            status: curr.status,
            created_at: curr.created_at,
            items: curr.product_id ? [{
              product_id: curr.product_id,
              product_name: curr.product_name,
              variant_name: curr.variant_name,
              brand_name: curr.brand_name,
              quantity: curr.quantity,
              price: curr.price,
              image_url: curr.image_url
            }] : []
          });
        }
        return acc;
      }, []);

      res.json(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ 
        message: 'Lỗi lấy danh sách đơn hàng',
        error: error.message 
      });
    }
  });
  
  // Hàm hỗ trợ để lấy mô tả trạng thái
  function getStatusDescription(status) {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'shipped': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }
  // Cho phép người dùng hủy đơn hàng khi trạng thái đơn hàng là pending
  router.post('/orders/:id/cancel', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const orderId = req.params.id;
      const userId = req.user.userId;
  
      const [orderResult] = await connection.query(
        'SELECT status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
        [orderId, userId]
      );
  
      if (orderResult.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
  
      if (orderResult[0].status !== 'pending') {
        return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trng thái này' });
      }
  
      await connection.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
  
      // Hoàn trả số lượng khi hủy đơn
      await connection.query(`
        UPDATE productvariants pv
        JOIN orderitems oi ON pv.id = oi.variant_id
        SET pv.sold_count = GREATEST(COALESCE(pv.sold_count, 0) - oi.quantity, 0)
        WHERE oi.order_id = ?
      `, [orderId]);
  
      // Thêm ghi nhận hoàn trả
      await connection.query(`
        INSERT INTO inventory_transactions (variant_id, quantity, type, note)
        SELECT variant_id, quantity, 'import', CONCAT('Cancel Order ID: ', ?)
        FROM orderitems
        WHERE order_id = ?
      `, [orderId, orderId]);
  
      await connection.commit();
      res.json({ message: 'Đơn hàng đã được hủy thành công' });
    } catch (error) {
      await connection.rollback();
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Lỗi hủy đơn hàng', error: error.message });
    } finally {
      connection.release();
    }
  });
// Thêm đánh giá sản phẩm
router.post('/orders/:orderId/products/:productId/review', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const { orderId, productId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.userId;
  
      // Kiểm tra xem đơn hàng đã được giao và thuộc về người dùng
      const [orderCheck] = await connection.query(
        'SELECT 1 FROM orders WHERE id = ? AND user_id = ? AND status = "delivered"',
        [orderId, userId]
      );
  
      if (orderCheck.length === 0) {
        return res.status(400).json({ message: 'Không thể đánh giá sản phẩm này' });
      }
  
      // Kiểm tra xem sản phẩm có trong đơn hàng không
      const [productCheck] = await connection.query(
        'SELECT 1 FROM orderitems WHERE order_id = ? AND product_id = ?',
        [orderId, productId]
      );
  
      if (productCheck.length === 0) {
        return res.status(400).json({ message: 'Sản phẩm không thuộc đơn hàng này' });
      }
  
      // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
      const [existingReview] = await connection.query(
        'SELECT 1 FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );
  
      if (existingReview.length > 0) {
        return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
      }
  
      // Thêm đánh giá
      await connection.query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [productId, userId, rating, comment]
      );
  
      await connection.commit();
      res.status(201).json({ message: 'Đánh giá đã được thêm thành công' });
    } catch (error) {
      await connection.rollback();
      console.error('Error adding product review:', error);
      res.status(500).json({ message: 'Lỗi thêm đánh giá sản phẩm', error: error.message });
    } finally {
      connection.release();
    }
  });

//lấy đánh giá sản phẩm
  router.get('/products/:productId/reviews', async (req, res) => {
    try {
      const { productId } = req.params;
      const [reviews] = await pool.query(
        `SELECT r.*, u.fullname AS username
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.product_id = ? 
         ORDER BY r.created_at DESC`,
        [productId]
      );
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      res.status(500).json({ message: 'Lỗi lấy đánh giá sản phẩm', error: error.message });
    }
  });

  //cập nhật đánh giá sản phẩm
  router.put('/reviews/:reviewId', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.userId;
  
      const [reviewCheck] = await connection.query(
        'SELECT 1 FROM reviews WHERE id = ? AND user_id = ?',
        [reviewId, userId]
      );
  
      if (reviewCheck.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa' });
      }
  
      await connection.query(
        'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
        [rating, comment, reviewId]
      );
  
      await connection.commit();
      res.json({ message: 'Đánh giá đã được cp nhật thành công' });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating review:', error);
      res.status(500).json({ message: 'Lỗi cập nhật đánh giá', error: error.message });
    } finally {
      connection.release();
    }
  });


  //xoa đánh giá sản phẩm
  router.delete('/reviews/:reviewId', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const { reviewId } = req.params;
      const userId = req.user.userId;
  
      const [reviewCheck] = await connection.query(
        'SELECT 1 FROM reviews WHERE id = ? AND user_id = ?',
        [reviewId, userId]
      );
  
      if (reviewCheck.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa' });
      }
  
      await connection.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
  
      await connection.commit();
      res.json({ message: 'Đánh giá đã được xóa thành công' });
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Lỗi xóa đánh giá', error: error.message });
    } finally {
      connection.release();
    }
  });

  // Lấy trạng thái đơn hàng
  router.get('/orders/:orderId/status', authenticateJWT, async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;
      
      const [order] = await pool.query(`
        SELECT o.id, o.status, o.created_at, o.updated_at,
          COUNT(oi.id) as total_items,
          SUM(oi.quantity) as total_quantity
        FROM orders o
        JOIN orderitems oi ON o.id = oi.order_id
        WHERE o.id = ? AND o.user_id = ?
        GROUP BY o.id`,
        [orderId, userId]
      );
      
      if (order.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      
      res.json(order[0]);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy trạng thái đơn hàng', error: error.message });
    }
  });

  // Thêm route xử lý địa chỉ
  router.post('/addresses', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        recipient_name,
        recipient_phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default
      } = req.body;
      
      // Lấy userId từ token thông qua middleware authenticateJWT
      const userId = req.user.userId;

      // Validate dữ liệu bt buộc
      if (!address_line1 || !city || !postal_code || !country || !recipient_name || !recipient_phone) {
        throw new Error('Thiếu thông tin bắt buộc');
      }

      // Validate số điện thoại
      const phoneRegex = /^[0-9]{10}$/;  // Định dạng 10 số
      if (!phoneRegex.test(recipient_phone)) {
        throw new Error('Số điện thoại không hợp lệ');
      }

      // Nếu là địa chỉ mặc định
      if (is_default) {
        await connection.query(
          'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      // Thêm địa chỉ mới
      const [result] = await connection.query(
        `INSERT INTO addresses (
          user_id,
          recipient_name,
          recipient_phone,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country,
          is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          recipient_name,
          recipient_phone,
          address_line1,
          address_line2 || null,
          city,
          state || null,
          postal_code,
          country,
          is_default ? 1 : 0
        ]
      );

      await connection.commit();

      // Trả về địa chỉ vừa tạo
      const [newAddress] = await connection.query(
        'SELECT * FROM addresses WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newAddress[0]);

    } catch (error) {
      await connection.rollback();
      console.error('Error creating address:', error);
      res.status(500).json({ 
        message: 'Lỗi khi thêm địa chỉ: ' + error.message
      });
    } finally {
      connection.release();
    }
  });

  // Lấy danh sách địa chỉ
  router.get('/addresses', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const [addresses] = await pool.query(
        'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
        [userId]
      );
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ 
        message: 'Lỗi khi lấy danh sách địa chỉ', 
        error: error.message 
      });
    }
  });

  // Xóa địa chỉ
  router.delete('/addresses/:id', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const userId = req.user.userId;

      const [result] = await connection.query(
        'DELETE FROM addresses WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Địa chỉ không tồn tại hoặc không có quyền xóa');
      }

      await connection.commit();
      res.json({ message: 'Xóa địa chỉ thành công' });

    } catch (error) {
      await connection.rollback();
      console.error('Error deleting address:', error);
      res.status(500).json({ 
        message: 'Lỗi khi xóa địa chỉ', 
        error: error.message 
      });
    } finally {
      connection.release();
    }
  });

  // Thêm route để đặt địa chỉ mặc định
  router.put('/addresses/:id/default', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const userId = req.user.userId;

      // Kiểm tra địa chỉ tồn tại và thuộc về user
      const [addressCheck] = await connection.query(
        'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (addressCheck.length === 0) {
        throw new Error('Địa chỉ không tồn tại hoặc không có quyền truy cập');
      }

      // Reset tất cả địa chỉ mặc định của user này
      await connection.query(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );

      // Đặt địa chỉ được chọn làm mặc định
      await connection.query(
        'UPDATE addresses SET is_default = 1 WHERE id = ?',
        [id]
      );

      await connection.commit();
      res.json({ 
        message: 'Cập nhật địa chỉ mặc định thành công',
        addressId: id
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error setting default address:', error);
      res.status(500).json({ 
        message: 'Lỗi khi cập nhật địa chỉ mặc định', 
        error: error.message 
      });
    } finally {
      connection.release();
    }
  });

  // // Thêm route để lấy thông tin người dùng
  // router.get('/user/profile', authenticateJWT, async (req, res) => {
  //   try {
  //     const userId = req.user.userId;
  //     const [userInfo] = await pool.query(
  //       `SELECT u.id, u.fullname, u.email, u.phone, u.avatar_url
  //        FROM users u 
  //        WHERE u.id = ?`,
  //       [userId]
  //     );

  //     if (userInfo.length === 0) {
  //       return res.status(404).json({ 
  //         message: 'Không tìm thấy thông tin người dùng' 
  //       });
  //     }

  //     // Loại bỏ các thông tin nhạy cảm trước khi gửi về client
  //     const sanitizedUserInfo = {
  //       id: userInfo[0].id,
  //       fullname: userInfo[0].fullname,
  //       email: userInfo[0].email,
  //       phone: userInfo[0].phone,
  //       avatar_url: userInfo[0].avatar_url
  //     };

  //     res.json(sanitizedUserInfo);
  //   } catch (error) {
  //     console.error('Error fetching user info:', error);
  //     res.status(500).json({ 
  //       message: 'Lỗi lấy thông tin người dùng',
  //       error: error.message 
  //     });
  //   }
  // });

  // Thêm prefix cho tất cả các routes
  // router.use('/api', router);

  // Sửa lại route để match với client request
  
  // router.get('/api/orders', authenticateJWT, async (req, res) => {
  //   try {
  //     const userId = req.user.userId;
  //     const { status } = req.query;

  //     let query = `
  //       SELECT o.*, 
  //         oi.product_id, oi.variant_id, oi.quantity, oi.price,
  //         p.name as product_name, p.image_url,
  //         pv.name as variant_name
  //       FROM orders o
  //       LEFT JOIN orderitems oi ON o.id = oi.order_id
  //       LEFT JOIN products p ON oi.product_id = p.id
  //       LEFT JOIN productvariants pv ON oi.variant_id = pv.id
  //       WHERE o.user_id = ?
  //     `;
  //     let queryParams = [userId];

  //     if (status && status !== 'all') {
  //       query += ' AND o.status = ?';
  //       queryParams.push(status);
  //     }

  //     query += ' ORDER BY o.created_at DESC';

  //     const [orders] = await pool.query(query, queryParams);

  //     // Group items by order
  //     const formattedOrders = orders.reduce((acc, curr) => {
  //       const order = acc.find(o => o.id === curr.id);
  //       if (order) {
  //         order.items.push({
  //           id: curr.product_id,
  //           name: curr.product_name,
  //           variant_name: curr.variant_name,
  //           quantity: curr.quantity,
  //           price: curr.price,
  //           image_url: curr.image_url
  //         });
  //       } else {
  //         acc.push({
  //           id: curr.id,
  //           total: curr.total,
  //           status: curr.status,
  //           statusDescription: getStatusDescription(curr.status),
  //           created_at: curr.created_at,
  //           items: curr.product_id ? [{
  //             id: curr.product_id,
  //             name: curr.product_name,
  //             variant_name: curr.variant_name,
  //             quantity: curr.quantity,
  //             price: curr.price,
  //             image_url: curr.image_url
  //           }] : []
  //         });
  //       }
  //       return acc;
  //     }, []);

  //     res.json(formattedOrders);
  //   } catch (error) {
  //     console.error('Error fetching orders:', error);
  //     res.status(500).json({ 
  //       message: 'Lỗi lấy danh sách đơn hàng',
  //       error: error.message 
  //     });
  //   }
  // });

  // Get order details with all related information
  router.get('/orders/:id/details', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const orderId = req.params.id;
      const userId = req.user.userId;

      // Get order basic information and address
      const [orderDetails] = await connection.query(`
        SELECT 
          o.id as order_id,
          o.total,
          o.status,
          o.created_at,
          o.updated_at,
          
          -- Address information
          a.address_line1,
          a.address_line2,
          a.city,
          a.state,
          a.postal_code,
          a.country,
          
          -- User information
          u.fullname as customer_name,
          u.email as customer_email,
          u.phonenumber as customer_phone,
          
          -- Payment information
          p.payment_date,
          p.amount as payment_amount,
          p.method as payment_method,
          p.status as payment_status
        FROM orders o
        JOIN addresses a ON o.address_id = a.id
        JOIN users u ON o.user_id = u.id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.id = ? AND o.user_id = ?
      `, [orderId, userId]);

      if (!orderDetails.length) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Get order items with product details
      const [orderItems] = await connection.query(`
        SELECT 
          oi.id as order_item_id,
          oi.quantity,
          oi.price as item_price,
          
          -- Product information
          p.id as product_id,
          p.name as product_name,
          p.image_url as product_image,
          p.description as product_description,
          
          -- Brand information
          b.name as brand_name,
          b.logo_url as brand_logo,
          
          -- Variant information
          pv.name as variant_name,
          
          -- Category information
          c.name as category_name,
          
          -- Review status
          CASE 
            WHEN r.id IS NOT NULL THEN true 
            ELSE false 
          END as has_review,
          r.rating,
          r.comment
        FROM orderitems oi
        JOIN products p ON oi.product_id = p.id
        JOIN productvariants pv ON oi.variant_id = pv.id
        JOIN brands b ON p.brand_id = b.id
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN reviews r ON p.id = r.product_id AND r.user_id = ?
        WHERE oi.order_id = ?
      `, [userId, orderId]);

      // Get order timeline/history
      const [orderTimeline] = await connection.query(`
        SELECT 
          status,
          created_at as timestamp,
          CASE status
            WHEN 'pending' THEN 'Đơn hàng được tạo'
            WHEN 'processing' THEN 'Đang xử lý đơn hàng'
            WHEN 'shipped' THEN 'Đơn hàng đang được giao'
            WHEN 'delivered' THEN 'Đơn hàng đã giao thành công'
            WHEN 'cancelled' THEN 'Đơn hàng đã hủy'
          END as description
        FROM orders
        WHERE id = ?
        UNION
        SELECT 
          'payment' as status,
          payment_date as timestamp,
          CONCAT('Thanh toán ', LOWER(status)) as description
        FROM payments
        WHERE order_id = ?
        ORDER BY timestamp DESC
      `, [orderId, orderId]);

      // Calculate order summary
      const orderSummary = {
        subtotal: orderItems.reduce((sum, item) => sum + (item.item_price * item.quantity), 0),
        total_items: orderItems.length,
        total_quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        status_description: getStatusDescription(orderDetails[0].status),
        can_cancel: orderDetails[0].status === 'pending',
        can_review: orderDetails[0].status === 'delivered'
      };

      res.json({
        order_info: orderDetails[0],
        order_items: orderItems,
        order_timeline: orderTimeline,
        order_summary: orderSummary
      });

    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ 
        message: 'Lỗi khi lấy thông tin đơn hàng', 
        error: error.message 
      });
    } finally {
      connection.release();
    }
  });

  // Trong route cập nhật trạng thái đơn hàng
  router.put('/orders/:id/status', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { status } = req.body;
      const orderId = req.params.id;
      const userId = req.user.userId;

      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Trạng thái không hợp lệ');
      }

      // Kiểm tra quyền cập nhật đơn hàng
      const [orderCheck] = await connection.query(
        'SELECT status FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orderCheck.length === 0) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Cập nht trạng thái đơn hàng
      await connection.query(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, orderId]
      );

      await connection.commit();

      // Broadcast update qua WebSocket
      broadcastOrderUpdate(orderId, status);

      res.json({ 
        message: 'Cập nhật trạng thái đơn hàng thành công',
        status: status,
        orderId: orderId
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error updating order status:', error);
      res.status(500).json({ 
        message: 'Lỗi cập nhật trạng thái đơn hàng', 
        error: error.message 
      });
    } finally {
      connection.release();
    }
  });

  // // Kiểm tra quyền đánh giá sản phẩm
  // router.get('/products/:productId/can-review', authenticateJWT, async (req, res) => {
  //   let connection;
  //   try {
  //     connection = await pool.getConnection();
  //     const { productId } = req.params;
  //     const userId = req.user.userId;

  //     // Kiểm tra sản phẩm có tồn tại không
  //     const [products] = await connection.query(
  //       'SELECT id FROM products WHERE id = ?',
  //       [productId]
  //     );

  //     if (!products || products.length === 0) {
  //       return res.status(404).json({
  //         canReview: false,
  //         message: 'Không tìm thy sản phẩm'
  //       });
  //     }

  //     // Kiểm tra đơn hàng đã giao và sản phẩm
  //     const [orders] = await connection.query(
  //       `SELECT DISTINCT o.id 
  //        FROM orders o
  //        INNER JOIN orderitems oi ON o.id = oi.order_id 
  //        WHERE o.user_id = ? 
  //        AND oi.product_id = ?
  //        AND o.status = 'delivered'
  //        LIMIT 1`,
  //       [userId, productId]
  //     );

  //     // Kiểm tra đã đánh giá chưa
  //     const [reviews] = await connection.query(
  //       `SELECT id FROM reviews 
  //        WHERE user_id = ? 
  //        AND product_id = ?
  //        LIMIT 1`,
  //       [userId, productId]
  //     );

  //     const hasOrder = orders && orders.length > 0;
  //     const hasReview = reviews && reviews.length > 0;
  //     const canReview = hasOrder && !hasReview;

  //     return res.status(200).json({
  //       canReview,
  //       message: canReview 
  //         ? 'Bạn có thể đánh giá sản phẩm này'
  //         : !hasOrder 
  //           ? 'Bạn cần mua và nhận sản phẩm này để đánh giá'
  //           : 'Bạn đã đánh giá sản phẩm này rồi',
  //       hasOrder,
  //       hasReview
  //     });

  //   } catch (error) {
  //     console.error('Error checking review permission:', error);
  //     if (!res.headersSent) {
  //       return res.status(500).json({
  //         canReview: false,
  //         message: 'Lỗi kiểm tra quyền đánh giá',
  //         error: error.message
  //       });
  //     }
  //   } finally {
  //     if (connection) {
  //       connection.release();
  //     }
  //   }
  // });

  // Thêm middleware kiểm tra vai trò
  const checkCustomerRole = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
      next();
    } else {
      res.status(403).json({ message: 'Chỉ khách hàng mới có thể thực hiện thao tác này' });
    }
  };

  // Sửa route tính tổng đơn hàng
  
  router.get('/calculate-total', authenticateJWT, async (req, res) => {
    try {
      const items = JSON.parse(req.query.items);
      
      if (!Array.isArray(items)) {
        return res.status(400).json({
          message: 'Dữ liệu sản phẩm không hợp lệ'
        });
      }

      // Tính toán tổng tiền
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingFee = 30000;
      const total = subtotal + shippingFee;

      res.json({
        subtotal,
        shipping_fee: shippingFee,
        total,
        items: items
      });

    } catch (error) {
      console.error('Error calculating order total:', error);
      res.status(500).json({
        message: 'Lỗi tính tổng đơn hàng',
        error: error.message
      });
    }
  });

  // Thêm đánh giá sản phẩm
  router.post('/products/:productId/reviews', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { productId } = req.params;
      const { rating, content } = req.body;
      const userId = req.user.userId;

      // Kiểm tra sản phẩm có trong đơn hàng đã giao không
      const [orderCheck] = await connection.query(
        `SELECT DISTINCT o.id 
         FROM orders o
         JOIN orderitems oi ON o.id = oi.order_id
         WHERE o.user_id = ?
         AND oi.product_id = ?
         AND o.status = 'delivered'`,
        [userId, productId]
      );

      if (orderCheck.length === 0) {
        return res.status(400).json({ 
          message: 'Bạn cần mua và nhận sản phẩm này để đánh giá'
        });
      }

      // Kiểm tra đã đánh giá chưa
      const [reviewCheck] = await connection.query(
        `SELECT id FROM reviews 
         WHERE user_id = ? AND product_id = ?`,
        [userId, productId]
      );

      if (reviewCheck.length > 0) {
        return res.status(400).json({
          message: 'Bạn đã đánh giá sản phẩm này rồi'
        });
      }

      // Thêm đánh giá mới
      const [result] = await connection.query(
        `INSERT INTO reviews (user_id, product_id, rating, comment)
         VALUES (?, ?, ?, ?)`,
        [userId, productId, rating, content]
      );

      await connection.commit();
      res.status(201).json({
        message: 'Đánh giá sản phẩm thành công'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error adding review:', error);
      res.status(500).json({
        message: 'Lỗi thêm đánh giá',
        error: error.message
      });
    } finally {
      connection.release();
    }
  });

  // Thêm route để lấy orderId của sản phẩm đã giao
  router.get('/orders/delivered/:productId', authenticateJWT, async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const { productId } = req.params;
      const userId = req.user.userId;

      // Tìm đơn hàng đã giao có chứa sản phẩm này
      const [order] = await connection.query(`
        SELECT DISTINCT o.id as orderId
        FROM orders o
        JOIN orderitems oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        AND oi.product_id = ?
        AND o.status = 'delivered'
        AND NOT EXISTS (
          SELECT 1 FROM reviews 
          WHERE user_id = ? 
          AND product_id = ?
        )
        LIMIT 1
      `, [userId, productId, userId, productId]);

      if (order.length === 0) {
        return res.status(404).json({ 
          message: 'Không tìm thấy đơn hàng đã giao của sản phẩm này hoặc bạn đã đánh giá sản phẩm này rồi'
        });
      }

      res.json({ orderId: order[0].orderId });
    } catch (error) {
      console.error('Error getting delivered order:', error);
      res.status(500).json({ 
        message: 'Lỗi khi lấy thông tin đơn hàng',
        error: error.message 
      });
    } finally {
      if (connection) connection.release();
    }
  });

  module.exports = router;