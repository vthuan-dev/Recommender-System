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
app.use(express.static(path.join(__dirname, '..', 'public', 'cart')));

// API cho Cart thêm sản phẩm vào giỏ hàng
router.post('/cart/add', authenticateJWT, async (req, res) => {
    try {
      if(!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng' });
      }
      const { productId, variantId, quantity } = req.body;
      const userId = req.user.userId;
      
      // Kiểm tra sự tồn tại của sản phẩm
      const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
      if (product.length === 0) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }
  
      // Kiểm tra sự tồn tại của biến thể sản phẩm
      const [variant] = await pool.query('SELECT * FROM productvariants WHERE id = ? AND product_id = ?', [variantId, productId]);
      if (variant.length === 0) {
        return res.status(404).json({ message: 'Biến thể sản phẩm không tồn tại' });
      }
  
      // Kiểm tra xem người dùng đã có giỏ hàng chưa
      let [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      let cartId;
      
      if (carts.length === 0) {
        // Tạo giỏ hàng mới nếu chưa có
        const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
        cartId = result.insertId;
      } else {
        cartId = carts[0].id;
      }
      
      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      const [existingItem] = await pool.query(
        'SELECT * FROM cartitems WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
        [cartId, productId, variantId]
      );
  
      if (existingItem.length > 0) {
        // Nếu sản phẩm đã có, cập nhật số lượng
        await pool.query(
          'UPDATE cartitems SET quantity = quantity + ? WHERE id = ?',
          [quantity, existingItem[0].id]
        );
      } else {
        // Nếu sản phẩm chưa có, thêm mới
        await pool.query(
          'INSERT INTO cartitems (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
          [cartId, productId, variantId, quantity]
        );
      }
      
      res.status(200).json({ message: 'Đã thêm sản phẩm vào giỏ hàng' });
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi thêm vào giỏ hàng', error: error.message });
    }
  });
  
  
  router.get('/cart', authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.userId;
      const [cartItems] = await pool.query(
        `SELECT ci.id, ci.quantity, p.name, p.image_url, pv.name as variant_name, pv.price 
         FROM carts c 
         JOIN cartitems ci ON c.id = ci.cart_id 
         JOIN products p ON ci.product_id = p.id 
         JOIN productvariants pv ON ci.variant_id = pv.id 
         WHERE c.user_id = ?`,
        [userId]
      );
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thông tin giỏ hàng', error: error.message });
    }
  });
  
  
 module.exports = router;