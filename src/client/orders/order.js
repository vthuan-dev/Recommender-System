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

dotenv.config();

const app = express();
const { authenticateJWT } = require('../../database/dbconfig');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public', 'order')));

router.post('/orders', authenticateJWT, async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const { addressId, items } = req.body;
      const userId = req.user.userId;
  
      console.log(`Attempting to create order for userId: ${userId}, addressId: ${addressId}`);
  
      // Kiểm tra địa chỉ
      const [addressResult] = await connection.query(
        'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );
      console.log(`Address check result:`, addressResult);
      
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
          'SELECT price, stock FROM productvariants WHERE id = ? FOR UPDATE',
          [item.variantId]
        );
        if (variantResult.length === 0 || variantResult[0].stock < item.quantity) {
          throw new Error(`Sản phẩm ${item.variantId} không đủ số lượng`);
        }
  
        const price = variantResult[0].price;
        total += price * item.quantity;
  
        // Cập nhật đơn hàng và số lượng tồn kho
        await connection.query(
          'INSERT INTO orderitems (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.productId, item.variantId, item.quantity, price]
        );
        await connection.query(
          'UPDATE productvariants SET sold_count = sold_count + ?, stock = stock - ? WHERE id = ?',
          [item.quantity, item.quantity, item.variantId]
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
      res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
    } finally {
      connection.release();
    }
  });
  router.get('/orders/:id', authenticateJWT, async (req, res) => {
    try {
      const [orderDetails] = await pool.query(
        `SELECT o.*, oi.product_id, oi.variant_id, oi.quantity, oi.price, 
                p.name as product_name, pv.name as variant_name,
                a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country
         FROM orders o 
         JOIN orderitems oi ON o.id = oi.order_id 
         JOIN products p ON oi.product_id = p.id 
         JOIN productvariants pv ON oi.variant_id = pv.id 
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
    try {
      const userId = req.user.userId;
      const { status } = req.query; // Lấy trạng thái từ query parameter
  
      let query = 'SELECT id, total, status, created_at FROM orders WHERE user_id = ?';
      let queryParams = [userId];
  
      // Nếu có trạng thái được chỉ định, thêm điều kiện vào query
      if (status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (validStatuses.includes(status)) {
          query += ' AND status = ?';
          queryParams.push(status);
        } else {
          return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
      }
  
      query += ' ORDER BY created_at DESC';
  
      const [orders] = await pool.query(query, queryParams);
  
      // Thêm mô tả trạng thái cho mỗi đơn hàng
      const ordersWithDescription = orders.map(order => ({
        ...order,
        statusDescription: getStatusDescription(order.status)
      }));
  
      res.json(ordersWithDescription);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng', error: error.message });
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
        return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này' });
      }
  
      await connection.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
  
      // Hoàn trả số lượng sản phẩm vào kho
      await connection.query(`
        UPDATE productvariants pv
        JOIN orderitems oi ON pv.id = oi.variant_id
        SET pv.stock = pv.stock + oi.quantity,
            pv.sold_count = pv.sold_count - oi.quantity
        WHERE oi.order_id = ?
      `, [orderId]);
  
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
      res.json({ message: 'Đánh giá đã được cập nhật thành công' });
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

  module.exports = router;