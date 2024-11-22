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

// Thêm middleware kiểm tra vai trò
const checkCustomerRole = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(403).json({ message: 'Chỉ khách hàng mới có thể thực hiện thao tác này' });
  }
};

// Sử dụng middleware kiểm tra vai trò trong route thêm sản phẩm vào giỏ hàng
router.post('/cart/add', authenticateJWT, checkCustomerRole, async (req, res) => {
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
  
  
  router.get('/cart', authenticateJWT, checkCustomerRole, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Kiểm tra xem người dùng có giỏ hàng hay không
      const [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      
      if (carts.length === 0) {
        // Nếu không có giỏ hàng, trả về mảng rỗng
        return res.json({ items: [] });
      }
      
      const cartId = carts[0].id;
      
      const [cartItems] = await pool.query(
        `SELECT 
          ci.id, 
          ci.quantity, 
          p.id AS product_id,
          p.name AS product_name, 
          p.image_url, 
          pv.id AS variant_id,
          pv.name AS variant_name, 
          pv.price,
          (ci.quantity * pv.price) AS total_price
         FROM cartitems ci 
         JOIN products p ON ci.product_id = p.id 
         JOIN productvariants pv ON ci.variant_id = pv.id 
         WHERE ci.cart_id = ?`,
        [cartId]
      );
      
      res.json({ 
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.total_price, 0)
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi lấy thông tin giỏ hàng', error: error.message });
    }
  });
  //cập nhật số lượng sản phẩm trong giỏ hàng
  router.put('/cart/update', authenticateJWT, checkCustomerRole, async (req, res) => {
    try {
      const { cartItemId, quantity } = req.body;
      const userId = req.user.userId;
  
      // Kiểm tra xem cartItem có thuộc về user không
      const [cartItem] = await pool.query(
        `SELECT ci.id FROM cartitems ci 
         JOIN carts c ON ci.cart_id = c.id 
         WHERE ci.id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );
  
      if (cartItem.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
      }
  
      await pool.query('UPDATE cartitems SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
      res.json({ message: 'Đã cập nhật số lượng sản phẩm' });
    } catch (error) {
      console.error('Lỗi cập nhật giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi cập nhật giỏ hàng', error: error.message });
    }
  });

  //xóa sản phẩm trong giỏ hàng
  router.delete('/cart/remove/:cartItemId', authenticateJWT, checkCustomerRole, async (req, res) => {
    try {
      const { cartItemId } = req.params;
      const userId = req.user.userId;
  
      // Kiểm tra xem cartItem có thuộc về user không
      const [cartItem] = await pool.query(
        `SELECT ci.id FROM cartitems ci 
         JOIN carts c ON ci.cart_id = c.id 
         WHERE ci.id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );
  
      if (cartItem.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
      }
  
      await pool.query('DELETE FROM cartitems WHERE id = ?', [cartItemId]);
      res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
    } catch (error) {
      console.error('Lỗi xóa sản phẩm khỏi giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi xóa sản phẩm khỏi giỏ hàng', error: error.message });
    }
  });
//xóa toàn bộ giỏ hàng
router.delete('/cart/clear', authenticateJWT, checkCustomerRole, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [cart] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    if (cart.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    await pool.query('DELETE FROM cartitems WHERE cart_id = ?', [cart[0].id]);
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (error) {
    console.error('Lỗi xóa toàn bộ giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi xóa toàn bộ giỏ hàng', error: error.message });
    }
  });

  // lấy toonhr soos luong san pham trong giỏ hàng
  router.get('/cart/count', authenticateJWT, checkCustomerRole, async (req, res) => {
    try {
      const userId = req.user.userId;
  
      const [result] = await pool.query(
        `SELECT SUM(ci.quantity) as totalItems 
         FROM carts c 
         JOIN cartitems ci ON c.id = ci.cart_id 
         WHERE c.user_id = ?`,
        [userId]
      );
  
      const totalItems = result[0].totalItems || 0;
      res.json({ totalItems });
    } catch (error) {
      console.error('Lỗi lấy số lượng sản phẩm trong giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi lấy số lượng sản phẩm trong giỏ hàng', error: error.message });
    }
  });
//Tính tổng giá trị giỏ hàng
  router.get('/cart/total', authenticateJWT, checkCustomerRole, async (req, res) => {
    try {
      const userId = req.user.userId;
  
      const [result] = await pool.query(
        `SELECT SUM(ci.quantity * pv.price) as totalValue 
         FROM carts c 
         JOIN cartitems ci ON c.id = ci.cart_id 
         JOIN productvariants pv ON ci.variant_id = pv.id 
         WHERE c.user_id = ?`,
        [userId]
      );
  
      const totalValue = result[0].totalValue || 0;
      res.json({ totalValue });
    } catch (error) {
      console.error('Lỗi tính tổng giá trị giỏ hàng:', error);
      res.status(500).json({ message: 'Lỗi tính tổng giá trị giỏ hàng', error: error.message });
    }
  });
  
  
 module.exports = router;
