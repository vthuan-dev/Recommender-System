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
    try {
      const { addressId, items } = req.body;
      const userId = req.user.userId;
      
      // Tạo đơn hàng mới
      const [orderResult] = await pool.query(
        'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
        [userId, 0, 'pending']
      );
      const orderId = orderResult.insertId;
      
      // Thêm các mục vào đơn hàng
      let total = 0;
      for (const item of items) {
        const [priceResult] = await pool.query(
          'SELECT price FROM productvariants WHERE id = ?',
          [item.variantId]
        );
        const price = priceResult[0].price;
        total += price * item.quantity;
        
        await pool.query(
          'INSERT INTO orderitems (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.productId, item.variantId, item.quantity, price]
        );
  
        // Cập nhật số lượng bán cho biến thể sản phẩm
        await pool.query(
          'UPDATE productvariants SET sold_count = sold_count + ?, stock = stock - ? WHERE id = ?',
          [item.quantity, item.quantity, item.variantId]
        );
  
        // Cập nhật tổng số lượng bán cho sản phẩm chính
        await pool.query(
          'UPDATE products SET sold_count = (SELECT SUM(sold_count) FROM productvariants WHERE product_id = ?) WHERE id = ?',
          [item.productId, item.productId]
        );
      }
      
      // Cập nhật tổng giá trị đơn hàng
      await pool.query('UPDATE orders SET total = ? WHERE id = ?', [total, orderId]);
      
      // Xóa giỏ hàng sau khi đặt hàng thành công
      await pool.query('DELETE FROM cartitems WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId]);
      
      res.status(201).json({ orderId, message: 'Đơn hàng đã được tạo' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
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

  module.exports = router;