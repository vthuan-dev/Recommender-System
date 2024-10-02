

//cho phép người dùng lấy thông tin của mình

// API cho Products



//thêm sản phẩm
// Thêm sản phẩm mới
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, category_id, brand, image_url, variants } = req.body;
    
    // Kiểm tra xem category có tồn tại không
    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (categories.length === 0) {
      return res.status(400).json({ message: 'Danh mục không tồn tại' });
    }
    
    // Thêm sản phẩm
    const [productResult] = await pool.query(
      'INSERT INTO products (name, description, category_id, brand, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description, category_id, brand, image_url]
    );
    
    const productId = productResult.insertId;
    
    // Thêm các biến thể sản phẩm
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await pool.query(
          'INSERT INTO productvariants (product_id, name, price, stock) VALUES (?, ?, ?, ?)',
          [productId, variant.name, variant.price, variant.stock]
        );
      }
    }
    
    res.status(201).json({ productId, message: 'Sản phẩm đã được thêm' });
  } catch (error) {
    console.error('Lỗi thêm sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi thêm sản phẩm', error: error.message });
  }
});
async function addProductsFromJSON() {
  try {
    const rawdata = fs.readFileSync(path.join(__dirname, 'products.json'));
    const products = JSON.parse(rawdata);

    for (const product of products) {
      // Thêm sản phẩm vào bảng products
      const [productResult] = await pool.query(
        'INSERT INTO products (name, description, category_id, brand, image_url) VALUES (?, ?, ?, ?, ?)',
        [
          product.name,
          product.name, // Sử dụng tên sản phẩm làm mô tả tạm thời
          product.category_id,
          product.brand,
          product.thumbnail_url
        ]
      );

      const newProductId = productResult.insertId; // ID mới được tạo tự động

      // Thêm biến thể sản phẩm vào bảng productvariants
      await pool.query(
        'INSERT INTO productvariants (product_id, name, price, stock) VALUES (?, ?, ?, ?)',
        [newProductId, 'Default', product.price, 10000]
      );

      console.log(`Đã thêm sản phẩm: ${product.name} với ID mới: ${newProductId}`);
    }

    console.log('Đã thêm tất cả sản phẩm từ file JSON vào cơ sở dữ liệu');
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm từ JSON:', error);
    throw error;
  }
}


// API cho Orders
app.post('/api/orders', authenticateJWT, async (req, res) => {
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

app.get('/api/orders', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng', error: error.message });
  }
});
app.get('/api/orders/:id', authenticateJWT, async (req, res) => {
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
// API cho Reviews
app.post('/api/reviews', authenticateJWT, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.userId;
    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [productId, userId, rating, comment]
    );
    res.status(201).json({ message: 'Đánh giá đã được thêm' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thêm đánh giá', error: error.message });
  }
});

app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.*, u.fullname 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ?`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy đánh giá sản phẩm', error: error.message });
  }
});

app.post('/api/place-order', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId } = req.body; // Địa chỉ giao hàng

    // Lấy thông tin giỏ hàng của người dùng
    const [cartItems] = await pool.query(
      `SELECT ci.product_id, ci.variant_id, ci.quantity, pv.price 
       FROM carts c 
       JOIN cartitems ci ON c.id = ci.cart_id 
       JOIN productvariants pv ON ci.variant_id = pv.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Tạo đơn hàng mới
    const [orderResult] = await pool.query(
      'INSERT INTO orders (user_id, address_id, total, status) VALUES (?, ?, ?, ?)',
      [userId, addressId, 0, 'pending']
    );
    const orderId = orderResult.insertId;

    // Thêm các mục vào đơn hàng và tính tổng giá trị
    let total = 0;
    for (const item of cartItems) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      await pool.query(
        'INSERT INTO orderitems (order_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.variant_id, item.quantity, item.price]
      );

      // Cập nhật số lượng tồn kho và số lượng đã bán
      await pool.query(
        'UPDATE productvariants SET sold_count = sold_count + ?, stock = stock - ? WHERE id = ?',
        [item.quantity, item.quantity, item.variant_id]
      );

      // Thêm đoạn code này vào trong vòng lặp xử lý các mục trong giỏ hàng
      const [stockCheck] = await pool.query(
        'SELECT stock FROM productvariants WHERE id = ?',
        [item.variant_id]
      );

      if (stockCheck[0].stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm ${item.product_id} không đủ số lượng trong kho` });
      }
    }

    // Cập nhật tổng giá trị đơn hàng
    await pool.query('UPDATE orders SET total = ? WHERE id = ?', [total, orderId]);

    // Xóa giỏ hàng sau khi đặt hàng thành công
    await pool.query('DELETE FROM cartitems WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId]);

    res.status(201).json({ orderId, message: 'Đơn hàng đã được tạo thành công' });
  } catch (error) {
    console.error('Lỗi khi đặt hàng:', error);
    res.status(500).json({ message: 'Lỗi khi đặt hàng', error: error.message });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  // try {
  //   await addProductsFromJSON();
  // } catch (error) {
  //   console.error('Lỗi khi thêm sản phẩm từ JSON:', error);
  // }
});