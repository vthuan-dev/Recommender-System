

// Thêm sản phẩm mới
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
// API cho Reviews




const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  // try {
  //   await addProductsFromJSON();
  // } catch (error) {
  //   console.error('Lỗi khi thêm sản phẩm từ JSON:', error);
  // }
});