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

router.get('/products/bestsellers', async (req, res) => {
  try {
    console.log('Đang truy vấn sản phẩm bán chạy...');
    const [bestsellers] = await pool.query(
      `SELECT p.*, SUM(pv.sold_count) as total_sold
       FROM products p
       JOIN productvariants pv ON p.id = pv.product_id
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 10`
    );
    
    console.log('Kết quả truy vấn:', bestsellers);
    
    if (bestsellers.length === 0) {
      console.log('Không tìm thấy sản phẩm bán chạy');
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm bán chạy' });
    }
    
    res.json(bestsellers);
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm bán chạy:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm bán chạy', error: error.message });
  }
});

//lấy danh sách sản phẩm


router.get('/products', async (req, res) => {
    try {
      const [products] = await pool.query('SELECT * FROM products');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm', error: error.message });
    }
  });
  
  router.get('/products/:id', async (req, res) => {
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
  router.get('/categories', async (req, res) => {
    try {
      const [categories] = await pool.query('SELECT * FROM categories');
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách danh mục', error: error.message });
    }
  });

  
  //tìm kiếm sản phẩm
  router.get('/products/search', async (req, res) => {
    try {
      const { query, category } = req.query;
      let sql = 'SELECT * FROM products WHERE name LIKE ?';
      let params = [`%${query}%`];
  
      if (category) {
        sql += ' AND category_id = ?';
        params.push(category);
      }
  
      const [products] = await pool.query(sql, params);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi tìm kiếm sản phẩm', error: error.message });
    }
  });
  //lấy sản phẩm theo danh mục
  router.get('/categories/:categoryId/products', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const [products] = await pool.query('SELECT * FROM products WHERE category_id = ?', [categoryId]);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy sản phẩm theo danh mục', error: error.message });
    }
  });
  //sản phẩm mới  nhất
  router.get('/products/new', async (req, res) => {
    try {
      const [newProducts] = await pool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 10');
      res.json(newProducts);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy sản phẩm mới', error: error.message });
    }
  });

  //sản phẩm theo thương hiệu
  router.get('/products/brand/:brand', async (req, res) => {
    try {
      const { brand } = req.params;
      const [products] = await pool.query('SELECT * FROM products WHERE brand = ?', [brand]);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy sản phẩm theo thương hiệu', error: error.message });
    }
  });

  //sản phẩm theo giá
  router.get('/products/filter', async (req, res) => {
    try {
      const { minPrice, maxPrice, category } = req.query;
      let sql = 'SELECT p.* FROM products p JOIN productvariants pv ON p.id = pv.product_id WHERE 1=1';
      const params = [];
  
      if (minPrice) {
        sql += ' AND pv.price >= ?';
        params.push(minPrice);
      }
      if (maxPrice) {
        sql += ' AND pv.price <= ?';
        params.push(maxPrice);
      }
      if (category) {
        sql += ' AND p.category_id = ?';
        params.push(category);
      }
  
      sql += ' GROUP BY p.id';
  
      const [products] = await pool.query(sql, params);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lọc sản phẩm', error: error.message });
    }
  });

module.exports = router;