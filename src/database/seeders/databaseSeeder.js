const { faker } = require('@faker-js/faker/locale/vi');
const { pool } = require('../dbconfig');

// Định nghĩa brands theo category
const categoryBrands = {
  'Điện thoại': ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme'],
  'Máy tính bảng': ['Apple', 'Samsung', 'Xiaomi', 'Lenovo'],
  'Đồng hồ thông minh': ['Apple', 'Samsung', 'Xiaomi', 'Huawei'],
  'Laptop văn phòng': ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer'],
  'Laptop gaming': ['Asus', 'MSI', 'Acer', 'Lenovo', 'HP'],
  'PC & Linh kiện': ['Intel', 'AMD', 'NVIDIA', 'MSI', 'Asus'],
  'Tai nghe': ['Apple', 'Sony', 'JBL', 'Samsung', 'Xiaomi'],
  'Loa & Âm thanh': ['JBL', 'Sony', 'Bose', 'Harman Kardon'],
  'Camera & Máy ảnh': ['Canon', 'Sony', 'Nikon', 'Fujifilm'],
  'Gaming Gear': ['Logitech', 'Razer', 'Corsair', 'SteelSeries'],
  'Console & Games': ['Sony', 'Microsoft', 'Nintendo'],
  'Stream & Vlog': ['Elgato', 'Razer', 'Blue Microphones', 'Sony'],
  'Phụ kiện di động': ['Anker', 'Belkin', 'Xiaomi', 'Samsung']
};

async function seedProducts(count = 50) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Lấy danh sách category và brand
    const [categories] = await connection.query('SELECT id, name FROM categories');
    const [brands] = await connection.query('SELECT id, name FROM brands');
    
    if (!categories.length || !brands.length) {
      throw new Error('Cần có sẵn categories và brands trong database');
    }

    for (let i = 0; i < count; i++) {
      // Chọn ngẫu nhiên category
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Lọc brands phù hợp với category
      const validBrands = brands.filter(brand => 
        categoryBrands[category.name]?.includes(brand.name)
      );
      
      // Chọn ngẫu nhiên brand từ danh sách phù hợp
      const brand = validBrands[Math.floor(Math.random() * validBrands.length)];

      // Tạo tên sản phẩm phù hợp với category
      let productName = '';
      switch(category.name) {
        case 'Điện thoại':
          productName = `${brand.name} ${faker.number.int({min: 5, max: 14})} Pro Max`;
          break;
        case 'Laptop văn phòng':
          productName = `${brand.name} ${faker.string.alpha(3).toUpperCase()}-${faker.number.int({min: 1000, max: 9999})}`;
          break;
        case 'Laptop gaming':
          productName = `${brand.name} Gaming ${faker.string.alpha(2).toUpperCase()}${faker.number.int({min: 15, max: 17})}`;
          break;
        default:
          productName = `${brand.name} ${faker.commerce.productName()}`;
      }

      // Thêm sản phẩm
      const [productResult] = await connection.query(`
        INSERT INTO products (category_id, name, description, brand_id, image_url)
        VALUES (?, ?, ?, ?, ?)
      `, [
        category.id,
        productName,
        faker.commerce.productDescription(),
        brand.id,
        faker.image.urlLoremFlickr({ category: 'technology' })
      ]);

      // Tạo giá phù hợp với từng category
      const getPriceRange = (categoryName) => {
        const ranges = {
          'Điện thoại': { min: 2000000, max: 45000000 },
          'Laptop văn phòng': { min: 10000000, max: 25000000 },
          'Laptop gaming': { min: 20000000, max: 60000000 },
          'PC & Linh kiện': { min: 5000000, max: 40000000 },
          'Tai nghe': { min: 200000, max: 5000000 },
          default: { min: 1000000, max: 30000000 }
        };
        return ranges[categoryName] || ranges.default;
      };

      // Thêm variants
      const variantCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < variantCount; j++) {
        const priceRange = getPriceRange(category.name);
        const initialStock = faker.number.int({ min: 10, max: 100 });
        
        const [variantResult] = await connection.query(`
          INSERT INTO productvariants (product_id, name, price, initial_stock)
          VALUES (?, ?, ?, ?)
        `, [
          productResult.insertId,
          faker.commerce.productAdjective(),
          faker.number.int(priceRange),
          initialStock
        ]);

        // Thêm giao dịch nhập kho
        await connection.query(`
          INSERT INTO inventory_transactions (variant_id, quantity, type, note)
          VALUES (?, ?, 'import', ?)
        `, [variantResult.insertId, initialStock, 'Nhập kho ban đầu']);
      }

      console.log(`✓ Đã tạo sản phẩm ${i + 1}/${count}`);
    }

    await connection.commit();
    console.log('✅ Hoàn thành tạo dữ liệu sản phẩm!');

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi tạo dữ liệu:', error);
  } finally {
    connection.release();
  }
}

// Chạy seeder với 50 sản phẩm
seedProducts(50).then(() => {
  console.log('Done seeding products');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

async function seedAdditionalProducts() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Danh sách 10 sản phẩm công nghệ thực tế
    const products = [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Điện thoại cao cấp mới nhất từ Apple với chip A17 Pro, camera 48MP',
        category_id: 1, // Điện thoại
        brand_id: 1, // Apple
        image_url: 'https://example.com/iphone15.jpg',
        variants: [
          { name: '256GB Titan Tự Nhiên', price: 34990000, initial_stock: 50 },
          { name: '512GB Titan Đen', price: 41990000, initial_stock: 30 },
          { name: '1TB Titan Xanh', price: 47990000, initial_stock: 20 }
        ]
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Flagship Samsung với S Pen, màn hình Dynamic AMOLED 2X 6.8 inch',
        category_id: 1,
        brand_id: 2, // Samsung
        image_url: 'https://example.com/s24ultra.jpg',
        variants: [
          { name: '256GB Xám Titan', price: 31990000, initial_stock: 45 },
          { name: '512GB Kem Titan', price: 35990000, initial_stock: 25 }
        ]
      },
      {
        name: 'MacBook Pro 14 M3 Pro',
        description: 'Laptop chuyên nghiệp với chip M3 Pro, màn hình Liquid Retina XDR',
        category_id: 4, // Laptop văn phòng
        brand_id: 1,
        image_url: 'https://example.com/macbook14.jpg',
        variants: [
          { name: '512GB Space Black', price: 49990000, initial_stock: 30 },
          { name: '1TB Silver', price: 59990000, initial_stock: 20 }
        ]
      },
      {
        name: 'ROG Strix SCAR 18',
        description: 'Laptop gaming cao cấp với RTX 4090, CPU Intel Core i9 Gen 14',
        category_id: 5, // Laptop gaming
        brand_id: 3, // ASUS
        image_url: 'https://example.com/rogscar18.jpg',
        variants: [
          { name: '2TB RTX 4090', price: 119990000, initial_stock: 15 }
        ]
      },
      {
        name: 'iPad Pro M2',
        description: 'Máy tính bảng chuyên nghiệp với chip M2, hỗ trợ Apple Pencil 2',
        category_id: 2, // Máy tính bảng
        brand_id: 1,
        image_url: 'https://example.com/ipadpro.jpg',
        variants: [
          { name: '11 inch 256GB Wifi', price: 23990000, initial_stock: 40 },
          { name: '12.9 inch 512GB 5G', price: 39990000, initial_stock: 25 }
        ]
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Tai nghe chống ồn cao cấp với LDAC, 30 giờ pin',
        category_id: 7, // Tai nghe
        brand_id: 4, // Sony
        image_url: 'https://example.com/wh1000xm5.jpg',
        variants: [
          { name: 'Bạc', price: 9990000, initial_stock: 60 },
          { name: 'Đen', price: 9990000, initial_stock: 60 }
        ]
      },
      {
        name: 'Apple Watch Ultra 2',
        description: 'Đồng hồ thông minh cao cấp với màn hình 49mm, pin 36 giờ',
        category_id: 3, // Đồng hồ thông minh
        brand_id: 1,
        image_url: 'https://example.com/watchultra2.jpg',
        variants: [
          { name: 'GPS', price: 21990000, initial_stock: 35 },
          { name: 'GPS + Cellular', price: 24990000, initial_stock: 25 }
        ]
      },
      {
        name: 'Logitech G Pro X Superlight',
        description: 'Chuột gaming không dây siêu nhẹ 63g với cảm biến HERO 25K',
        category_id: 10, // Gaming Gear
        brand_id: 5, // Logitech
        image_url: 'https://example.com/superlight.jpg',
        variants: [
          { name: 'Đen', price: 2990000, initial_stock: 100 },
          { name: 'Trắng', price: 2990000, initial_stock: 100 }
        ]
      },
      {
        name: 'Canon EOS R5',
        description: 'Máy ảnh mirrorless full-frame 45MP, quay video 8K',
        category_id: 9, // Camera & Máy ảnh
        brand_id: 6, // Canon
        image_url: 'https://example.com/eosr5.jpg',
        variants: [
          { name: 'Body', price: 89990000, initial_stock: 20 },
          { name: 'Kit 24-105mm F4L', price: 109990000, initial_stock: 15 }
        ]
      },
      {
        name: 'JBL PartyBox 710',
        description: 'Loa di động công suất 800W với đèn LED RGB',
        category_id: 8, // Loa & Âm thanh
        brand_id: 7, // JBL
        image_url: 'https://example.com/partybox710.jpg',
        variants: [
          { name: 'Đen', price: 21990000, initial_stock: 30 }
        ]
      }
    ];

    // Thêm từng sản phẩm và variants
    for (const product of products) {
      const [productResult] = await connection.query(`
        INSERT INTO products (name, description, category_id, brand_id, image_url)
        VALUES (?, ?, ?, ?, ?)
      `, [product.name, product.description, product.category_id, product.brand_id, product.image_url]);

      // Thêm variants cho sản phẩm
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
seedAdditionalProducts().then(() => {
  console.log('Done seeding additional products');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});