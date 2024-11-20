const { pool } = require('../dbconfig');

const productsByBrand = {
  // APPLE
  'Apple': {
    'Điện thoại': [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Chip A17 Pro, Dynamic Island, Camera 48MP, Titanium',
        image_url: 'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-1.jpg',
        variants: [
          { name: '256GB Titan Tự Nhiên', price: 34990000, initial_stock: 50 },
          { name: '512GB Titan Đen', price: 41990000, initial_stock: 30 },
          { name: '1TB Titan Xanh', price: 47990000, initial_stock: 20 }
        ]
      },
      {
        name: 'iPhone 15 Pro',
        description: 'Chip A17 Pro, Dynamic Island, Camera 48MP',
        image_url: 'https://cdn.tgdd.vn/Products/Images/42/299033/iphone-15-pro-black-1.jpg',
        variants: [
          { name: '128GB Titan Tự Nhiên', price: 28990000, initial_stock: 50 },
          { name: '256GB Titan Đen', price: 32990000, initial_stock: 30 }
        ]
      }
    ],
    'Máy tính bảng': [
      {
        name: 'iPad Pro M2 12.9 inch',
        description: 'Màn hình Liquid Retina XDR, Chip M2, Face ID',
        image_url: 'https://cdn.tgdd.vn/Products/Images/522/294105/ipad-pro-m2-12-9-inch-1.jpg',
        variants: [
          { name: '256GB WiFi', price: 31990000, initial_stock: 30 },
          { name: '256GB WiFi + 5G', price: 37990000, initial_stock: 20 }
        ]
      }
    ]
  },

  // SAMSUNG
  'Samsung': {
    'Điện thoại': [
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Snapdragon 8 Gen 3, Camera 200MP, S Pen',
        image_url: 'https://cdn.tgdd.vn/Products/Images/42/309816/samsung-galaxy-s24-ultra-1.jpg',
        variants: [
          { name: '256GB Xám Titan', price: 31990000, initial_stock: 45 },
          { name: '512GB Kem Titan', price: 35990000, initial_stock: 25 }
        ]
      },
      {
        name: 'Samsung Galaxy Z Fold5',
        description: 'Màn hình gập 7.6", Snapdragon 8 Gen 2',
        image_url: 'https://cdn.tgdd.vn/Products/Images/42/310805/samsung-galaxy-z-fold5-1.jpg',
        variants: [
          { name: '256GB Xanh', price: 40990000, initial_stock: 30 },
          { name: '512GB Kem', price: 44990000, initial_stock: 20 }
        ]
      }
    ],
    'Đồng hồ thông minh': [
      {
        name: 'Samsung Galaxy Watch6 Classic',
        description: 'Vòng bezel xoay, Màn hình 1.5", Đo SpO2',
        image_url: 'https://cdn.tgdd.vn/Products/Images/7077/289788/samsung-galaxy-watch6-classic-1.jpg',
        variants: [
          { name: '43mm LTE', price: 9990000, initial_stock: 40 },
          { name: '47mm LTE', price: 10990000, initial_stock: 30 }
        ]
      }
    ]
  },

  // ASUS
  'Asus': {
    'Laptop gaming': [
      {
        name: 'ROG Strix SCAR 18',
        description: 'Intel Core i9-14900HX, RTX 4090, 32GB RAM',
        image_url: 'https://cdn.tgdd.vn/Products/Images/44/309669/asus-rog-strix-scar-18-1.jpg',
        variants: [
          { name: 'RTX 4090 32GB 2TB', price: 119990000, initial_stock: 15 },
          { name: 'RTX 4080 32GB 2TB', price: 89990000, initial_stock: 20 }
        ]
      }
    ],
    'Laptop văn phòng': [
      {
        name: 'Zenbook 14 OLED',
        description: 'Intel Core i5-1340P, 16GB RAM, 512GB SSD',
        image_url: 'https://cdn.tgdd.vn/Products/Images/44/309670/asus-zenbook-14-1.jpg',
        variants: [
          { name: 'i5 16GB 512GB', price: 24990000, initial_stock: 35 },
          { name: 'i7 16GB 512GB', price: 29990000, initial_stock: 25 }
        ]
      }
    ]
  }
  // Thêm các brand khác...
};

async function seedProductsByBrand() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Lấy mapping của categories và brands
    const [categories] = await connection.query('SELECT id, name FROM categories');
    const [brands] = await connection.query('SELECT id, name FROM brands');

    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const brandMap = new Map(brands.map(b => [b.name, b.id]));

    for (const [brandName, categories] of Object.entries(productsByBrand)) {
      const brandId = brandMap.get(brandName);
      
      for (const [categoryName, products] of Object.entries(categories)) {
        const categoryId = categoryMap.get(categoryName);
        
        for (const product of products) {
          // Thêm sản phẩm
          const [productResult] = await connection.query(`
            INSERT INTO products (category_id, name, description, brand_id, image_url)
            VALUES (?, ?, ?, ?, ?)
          `, [categoryId, product.name, product.description, brandId, product.image_url]);

          // Thêm variants
          for (const variant of product.variants) {
            const [variantResult] = await connection.query(`
              INSERT INTO productvariants (product_id, name, price, initial_stock)
              VALUES (?, ?, ?, ?)
            `, [productResult.insertId, variant.name, variant.price, variant.initial_stock]);

            // Thêm giao dịch nhập kho
            await connection.query(`
              INSERT INTO inventory_transactions (variant_id, quantity, type, note)
              VALUES (?, ?, 'import', ?)
            `, [variantResult.insertId, variant.initial_stock, 'Nhập kho ban đầu']);
          }

          console.log(`✓ Đã thêm sản phẩm: ${product.name}`);
        }
      }
    }

    await connection.commit();
    console.log('✅ Hoàn thành thêm dữ liệu sản phẩm!');

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi thêm dữ liệu:', error);
  } finally {
    connection.release();
  }
}

// Chạy seeder
seedProductsByBrand().then(() => {
  console.log('Done seeding products by brand');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});