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

console.log('DB Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD
});

const app = express();


app.use(cors());
app.use(bodyParser.json());



//lấy danh sách sản phẩm
app.get('/products', async (req, res) => {
    try {
      const [products] = await pool.query('SELECT * FROM products');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm', error: error.message });
    }
  });
  
  app.get('/products/:id', async (req, res) => {
    try {
      const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
      if (products.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      res.json(products[0]);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thông tin sản phẩm', error: error.message });
    }
  });
  
  // API cho Categories lấy danh mục sản phẩm
  app.get('/categories', async (req, res) => {
    try {
      const [categories] = await pool.query('SELECT * FROM categories');
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách danh mục', error: error.message });
    }
  });

  
  app.get('/api/products/bestsellers', async (req, res) => {
    try {
      const [bestsellers] = await pool.query(
        `SELECT p.*, SUM(pv.sold_count) as total_sold
         FROM products p
         JOIN productvariants pv ON p.id = pv.product_id
         GROUP BY p.id
         ORDER BY total_sold DESC
         LIMIT 10`
      );
      res.json(bestsellers);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm bán chạy', error: error.message });
    }
  });

module.exports = router;