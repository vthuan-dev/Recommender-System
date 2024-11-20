const { faker } = require('@faker-js/faker/locale/vi');
const { pool } = require('../dbconfig');

// Mapping sản phẩm theo category
const categoryProducts = {
  'Điện thoại': {
    namePattern: (brand) => {
      switch(brand) {
        case 'Apple': return `iPhone ${faker.number.int({min: 13, max: 15})} ${faker.helpers.arrayElement(['', 'Pro', 'Pro Max'])}`;
        case 'Samsung': return `Galaxy ${faker.helpers.arrayElement(['S24', 'S24+', 'S24 Ultra', 'A54', 'A34'])}`;
        case 'Xiaomi': return `Redmi ${faker.helpers.arrayElement(['Note 13', 'Note 12', '13C'])} ${faker.helpers.arrayElement(['', 'Pro'])}`;
        case 'OPPO': return `OPPO ${faker.helpers.arrayElement(['Reno10', 'Find N3', 'A58'])}`;
        case 'Vivo': return `Vivo ${faker.helpers.arrayElement(['V29e', 'V27', 'Y36'])}`;
        case 'Realme': return `Realme ${faker.helpers.arrayElement(['11 Pro', 'C55', 'GT Neo5'])}`;
        default: return `${brand} ${faker.helpers.arrayElement(['Pro', 'Ultra', 'Plus'])} ${faker.number.int({min: 1, max: 99})}`;
      }
    },
    variants: (brand) => {
      const storage = ['128GB', '256GB', '512GB'];
      const colors = ['Đen', 'Trắng', 'Xanh', 'Vàng'];
      return storage.map(s => colors.map(c => ({
        name: `${s} ${c}`,
        price: faker.number.int({min: 5000000, max: 45000000}),
        initial_stock: faker.number.int({min: 20, max: 100})
      }))).flat();
    }
  },
  'Máy tính bảng': {
    namePattern: (brand) => {
      switch(brand) {
        case 'Apple': return `iPad ${faker.helpers.arrayElement(['Pro', 'Air', 'mini'])} ${faker.number.int({min: 5, max: 6})}`;
        case 'Samsung': return `Galaxy Tab ${faker.helpers.arrayElement(['S9', 'S8', 'A8'])}`;
        case 'Xiaomi': return `Xiaomi Pad ${faker.number.int({min: 6, max: 7})}`;
        case 'Lenovo': return `Lenovo Tab ${faker.helpers.arrayElement(['P12', 'M10', 'Y700'])}`;
        default: return `${brand} Tab ${faker.helpers.arrayElement(['Pro', 'Plus'])} ${faker.number.int({min: 1, max: 10})}`;
      }
    },
    variants: () => {
      const configs = ['64GB Wifi', '256GB Wifi', '512GB 5G'];
      return configs.map(c => ({
        name: c,
        price: faker.number.int({min: 8000000, max: 35000000}),
        initial_stock: faker.number.int({min: 15, max: 50})
      }));
    }
  },
  'Đồng hồ thông minh': {
    namePattern: (brand) => {
      switch(brand) {
        case 'Apple': return `Apple Watch ${faker.helpers.arrayElement(['Series 9', 'Series 8', 'Ultra 2'])}`;
        case 'Samsung': return `Galaxy Watch ${faker.helpers.arrayElement(['6', '5', '4'])} ${faker.helpers.arrayElement(['', 'Classic'])}`;
        case 'Xiaomi': return `Xiaomi Watch ${faker.helpers.arrayElement(['S3', 'S2', 'Fit'])}`;
        case 'Huawei': return `Huawei Watch ${faker.helpers.arrayElement(['GT4', 'GT3', 'Fit'])}`;
        default: return `${brand} Watch ${faker.number.int({min: 1, max: 5})}`;
      }
    },
    variants: () => {
      const sizes = ['41mm', '45mm'];
      const types = ['GPS', 'GPS + Cellular'];
      return sizes.map(s => types.map(t => ({
        name: `${s} ${t}`,
        price: faker.number.int({min: 5000000, max: 25000000}),
        initial_stock: faker.number.int({min: 10, max: 50})
      }))).flat();
    }
  },
  'Laptop văn phòng': {
    namePattern: (brand) => {
      const series = {
        'Dell': ['Inspiron', 'Vostro', 'Latitude'],
        'HP': ['Pavilion', 'Envy', 'EliteBook'],
        'Lenovo': ['ThinkPad', 'IdeaPad', 'Yoga'],
        'Asus': ['VivoBook', 'ZenBook', 'ExpertBook'],
        'Acer': ['Aspire', 'Swift', 'TravelMate']
      };
      const brandSeries = series[brand] || ['Business'];
      return `${brand} ${faker.helpers.arrayElement(brandSeries)} ${faker.string.alpha(2).toUpperCase()}${faker.number.int({min: 13, max: 15})}`;
    },
    variants: () => {
      const configs = [
        'i5 8GB 256GB',
        'i5 16GB 512GB',
        'i7 16GB 512GB'
      ];
      return configs.map(c => ({
        name: c,
        price: faker.number.int({min: 15000000, max: 35000000}),
        initial_stock: faker.number.int({min: 10, max: 40})
      }));
    }
  },
  'Laptop gaming': {
    namePattern: (brand) => {
      const series = {
        'Asus': ['ROG Strix', 'TUF Gaming'],
        'MSI': ['Katana', 'Pulse', 'Raider'],
        'Acer': ['Nitro', 'Predator'],
        'Lenovo': ['Legion', 'IdeaPad Gaming'],
        'HP': ['Victus', 'OMEN']
      };
      const brandSeries = series[brand] || ['Gaming'];
      return `${brand} ${faker.helpers.arrayElement(brandSeries)} ${faker.string.alpha(2).toUpperCase()}${faker.number.int({min: 15, max: 17})}`;
    },
    variants: () => {
      const configs = [
        'RTX 3050 16GB 512GB',
        'RTX 3060 16GB 512GB',
        'RTX 4060 32GB 1TB'
      ];
      return configs.map(c => ({
        name: c,
        price: faker.number.int({min: 22000000, max: 85000000}),
        initial_stock: faker.number.int({min: 5, max: 30})
      }));
    }
  },
  'PC & Linh kiện': {
    namePattern: (brand) => {
      const types = ['Gaming PC', 'Workstation', 'Mini PC'];
      return `${brand} ${faker.helpers.arrayElement(types)} ${faker.string.alpha(3).toUpperCase()}`;
    },
    variants: () => {
      const configs = [
        'i5 16GB RTX 3060',
        'i7 32GB RTX 3070',
        'i9 64GB RTX 4080'
      ];
      return configs.map(c => ({
        name: c,
        price: faker.number.int({min: 15000000, max: 120000000}),
        initial_stock: faker.number.int({min: 5, max: 20})
      }));
    }
  },
  'Tai nghe': {
    namePattern: (brand) => {
      switch(brand) {
        case 'Apple': return `AirPods ${faker.helpers.arrayElement(['Pro 2', '3', 'Max'])}`;
        case 'Sony': return `Sony ${faker.helpers.arrayElement(['WH-1000XM5', 'WF-1000XM4', 'LinkBuds'])}`;
        case 'JBL': return `JBL ${faker.helpers.arrayElement(['Quantum', 'Live', 'Tune'])} ${faker.number.int({min: 100, max: 999})}`;
        default: return `${brand} ${faker.helpers.arrayElement(['Pro', 'Air', 'Elite'])} ${faker.number.int({min: 1, max: 99})}`;
      }
    },
    variants: () => {
      const colors = ['Đen', 'Trắng', 'Xanh'];
      return colors.map(c => ({
        name: c,
        price: faker.number.int({min: 1000000, max: 15000000}),
        initial_stock: faker.number.int({min: 20, max: 100})
      }));
    }
  },
  'Loa & Âm thanh': {
    namePattern: (brand) => {
      const series = {
        'JBL': ['Flip', 'Charge', 'PartyBox'],
        'Sony': ['SRS-XB', 'SRS-XG', 'HT'],
        'Bose': ['SoundLink', 'Smart Speaker', 'TV Speaker']
      };
      const brandSeries = series[brand] || ['Audio'];
      return `${brand} ${faker.helpers.arrayElement(brandSeries)} ${faker.number.int({min: 100, max: 999})}`;
    },
    variants: () => {
      const colors = ['Đen', 'Xanh Navy', 'Đỏ'];
      return colors.map(c => ({
        name: c,
        price: faker.number.int({min: 2000000, max: 25000000}),
        initial_stock: faker.number.int({min: 10, max: 50})
      }));
    }
  },
  'Camera & Máy ảnh': {
    namePattern: (brand) => {
      switch(brand) {
        case 'Canon': return `Canon ${faker.helpers.arrayElement(['EOS R5', 'EOS R6', '90D'])}`;
        case 'Sony': return `Sony ${faker.helpers.arrayElement(['A7 IV', 'A7R V', 'ZV-E1'])}`;
        case 'Nikon': return `Nikon ${faker.helpers.arrayElement(['Z6 II', 'Z7 II', 'Z8'])}`;
        default: return `${brand} ${faker.helpers.arrayElement(['Pro', 'Elite'])} ${faker.number.int({min: 1, max: 99})}`;
      }
    },
    variants: () => {
      const configs = ['Body', 'Kit 24-70mm', 'Kit 24-105mm'];
      return configs.map(c => ({
        name: c,
        price: faker.number.int({min: 30000000, max: 150000000}),
        initial_stock: faker.number.int({min: 5, max: 20})
      }));
    }
  },
  'Gaming Gear': {
    namePattern: (brand) => {
      const types = ['Mouse', 'Keyboard', 'Headset'];
      return `${brand} ${faker.helpers.arrayElement(types)} ${faker.helpers.arrayElement(['Pro', 'Elite', 'Ultimate'])}`;
    },
    variants: () => {
      const colors = ['Black', 'White', 'Pink'];
      return colors.map(c => ({
        name: c,
        price: faker.number.int({min: 1000000, max: 8000000}),
        initial_stock: faker.number.int({min: 20, max: 100})
      }));
    }
  },
  'Console & Games': {
    namePattern: (brand) => {
      switch(brand) {
        case 'Sony': return `PlayStation ${faker.helpers.arrayElement(['5', '5 Digital'])}`;
        case 'Microsoft': return `Xbox ${faker.helpers.arrayElement(['Series X', 'Series S'])}`;
        case 'Nintendo': return `Nintendo ${faker.helpers.arrayElement(['Switch OLED', 'Switch Lite'])}`;
        default: return `${brand} Console ${faker.number.int({min: 1, max: 99})}`;
      }
    },
    variants: () => {
      const bundles = ['Standard', 'Digital Edition', 'Bundle Pack'];
      return bundles.map(b => ({
        name: b,
        price: faker.number.int({min: 8000000, max: 20000000}),
        initial_stock: faker.number.int({min: 10, max: 50})
      }));
    }
  },
  'Stream & Vlog': {
    namePattern: (brand) => {
      const types = ['Webcam', 'Microphone', 'Capture Card'];
      return `${brand} ${faker.helpers.arrayElement(types)} ${faker.helpers.arrayElement(['Pro', 'Studio'])}`;
    },
    variants: () => {
      const models = ['Basic', 'Advanced', 'Professional'];
      return models.map(m => ({
        name: m,
        price: faker.number.int({min: 2000000, max: 15000000}),
        initial_stock: faker.number.int({min: 10, max: 40})
      }));
    }
  },
  'Phụ kiện di động': {
    namePattern: (brand) => {
      const types = ['Sạc', 'Ốp lưng', 'Dán màn hình'];
      return `${brand} ${faker.helpers.arrayElement(types)} ${faker.helpers.arrayElement(['Pro', 'Plus', 'Basic'])}`;
    },
    variants: () => {
      const types = ['iPhone Series', 'Samsung Galaxy', 'Universal'];
      return types.map(t => ({
        name: t,
        price: faker.number.int({min: 100000, max: 2000000}),
        initial_stock: faker.number.int({min: 50, max: 200})
      }));
    }
  },
  'Thiết bị mạng': {
    namePattern: (brand) => {
      const types = ['Router', 'Mesh Wifi', 'Access Point'];
      return `${brand} ${faker.helpers.arrayElement(types)} ${faker.helpers.arrayElement(['AX', 'AC'])}${faker.number.int({min: 1000, max: 9999})}`;
    },
    variants: () => {
      const models = ['Basic', 'Pro', 'Enterprise'];
      return models.map(m => ({
        name: m,
        price: faker.number.int({min: 500000, max: 10000000}),
        initial_stock: faker.number.int({min: 10, max: 50})
      }));
    }
  },
  'Thiết bị thông minh': {
    namePattern: (brand) => {
      const types = ['Camera', 'Khóa', 'Bóng đèn'];
      return `${brand} Smart ${faker.helpers.arrayElement(types)} ${faker.helpers.arrayElement(['Pro', 'Plus', 'Lite'])}`;
    },
    variants: () => {
      const models = ['1080p', '2K', '4K'];
      return models.map(m => ({
        name: m,
        price: faker.number.int({min: 500000, max: 5000000}),
        initial_stock: faker.number.int({min: 20, max: 100})
      }));
    }
  }
};

const categoryImages = {
  'Điện thoại': {
    'Apple': [
      'https://cdn.tgdd.vn/Products/Images/42/305658/iphone-15-pro-max-blue-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/299033/iphone-15-pro-black-1.jpg'
    ],
    'Samsung': [
      'https://images.samsung.com/vn/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-color-titanium-gray-mo.jpg',
      'https://images.samsung.com/vn/smartphones/galaxy-s24/images/galaxy-s24-highlights-color-amber-yellow-mo.jpg'
    ],
    'Xiaomi': [
      'https://cdn.tgdd.vn/Products/Images/42/309816/xiaomi-14-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/307172/xiaomi-13t-pro-1.jpg'
    ],
    'OPPO': [
      'https://cdn.tgdd.vn/Products/Images/42/306979/oppo-reno10-5g-blue-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/299033/oppo-find-n3-flip-1.jpg'
    ],
    'Vivo': [
      'https://cdn.tgdd.vn/Products/Images/42/309864/vivo-v29e-5g-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/308722/vivo-v27e-1.jpg'
    ],
    'Realme': [
      'https://cdn.tgdd.vn/Products/Images/42/301603/realme-11-pro-plus-5g-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/42/292672/realme-c55-1.jpg'
    ]
  },

  'Máy tính bảng': {
    'Apple': [
      'https://cdn.tgdd.vn/Products/Images/522/294104/ipad-pro-m2-11-inch-1.jpg',
      'https://cdn.tgdd.vn/Products/Images/522/248096/ipad-air-5-1.jpg'
    ],
    'Samsung': [
      'https://images.samsung.com/vn/galaxy-tab-s9/feature/galaxy-tab-s9-ultra-kv.jpg',
      'https://images.samsung.com/vn/galaxy-tab-s9/feature/galaxy-tab-s9-plus-kv.jpg'
    ],
    'Lenovo': [
      'https://www.lenovo.com/medias/lenovo-tab-p12-pro-subseries-hero.png',
      'https://www.lenovo.com/medias/lenovo-tab-m10-plus-gen-3-subseries-hero.png'
    ]
  },

  'Laptop văn phòng': {
    'Dell': [
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/14-5420/media-gallery/in5420t-xnb-01-sl.psd',
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-3440/media-gallery/notebook-latitude-3440-gray-gallery-1.psd'
    ],
    'HP': [
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08173326.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08174151.png'
    ],
    'Lenovo': [
      'https://www.lenovo.com/medias/lenovo-laptops-thinkpad-x1-carbon-gen-11-hero.png',
      'https://www.lenovo.com/medias/lenovo-laptop-yoga-9i-gen-8-14-intel-hero.png'
    ]
  },

  'Laptop gaming': {
    'Asus': [
      'https://dlcdnwebimgs.asus.com/gain/28104E63-F126-4FE5-8B9D-D52D60847594/w1000/h732',
      'https://dlcdnwebimgs.asus.com/gain/C08F1909-E0F9-4C6B-B7B9-C8D163830BCD/w1000/h732'
    ],
    'MSI': [
      'https://storage.googleapis.com/msigaming/msigaming2023/Laptop/Product_List/Raider%20GE78%20HX%2014V/ge78hx-14v-1.png',
      'https://storage.googleapis.com/msigaming/msigaming2023/Laptop/Product_List/Stealth%2016%20Studio%20A13V/stealth16-studio-a13v-1.png'
    ],
    'Acer': [
      'https://images.acer.com/is/image/acer/predator-triton-17x-ptx17-71-gallery-01',
      'https://images.acer.com/is/image/acer/nitro-5-an515-58-gallery-01'
    ]
  },

  'Camera & Máy ảnh': {
    'Canon': [
      'https://asia.canon/media/image/2022/05/19/c2f6e71c217f4018b5c2e1172f5a4727_EOS+R7+RF-S18-150mm+Front+Slant.png',
      'https://asia.canon/media/image/2022/05/19/c19c8ac8f80f4e0f9c6497c1c2f700eb_EOS+R10+RF-S18-45mm+Front+Slant.png'
    ],
    'Sony': [
      'https://electronics.sony.com/image/5d02da5c0a04b705cc0b32e9f56e05c7/A7-IV-wFE-28-70mm-lens-right-side-angle-shot',
      'https://electronics.sony.com/image/e328a15c0a04b705cc0b32fee2605c7c/ZV-1-II-right-side-angle-shot'
    ],
    'Nikon': [
      'https://cdn-4.nikon-cdn.com/e/Q5NM96RZZo-YRYNeYvAi9beHK4x3L-8go_p7JUL6JpU=/Views/1592_Z8_front.png',
      'https://cdn-4.nikon-cdn.com/e/Q5NM96RZZo-YRYNeYvAi9beHK4x3L-8go_p7JUL6JpU=/Views/1679_Z6II_front.png'
    ]
  },

  'Gaming Gear': {
    'Logitech': [
      'https://resource.logitechg.com/w_692,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-1.png',
      'https://resource.logitechg.com/w_692,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/g915/g915-tkl-gallery/us-g915-tkl-gallery-topdown.png'
    ],
    'Razer': [
      'https://assets3.razerzone.com/CKqcqX_uVNYGiRPOJ_mlAyXEkRI=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh51%2Fh09%2F9459618693150%2Fdeathadder-v3-pro-white-500x500.png',
      'https://assets3.razerzone.com/9chPRJD1c0ZcMkiNYEt9ZmGYQQ0=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fhc3%2Fh09%2F9459618660382%2Fblackwidow-v4-pro-500x500.png'
    ]
  },

  'Loa & Âm thanh': {
    'JBL': [
      'https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw5b2e4d43/JBL_Charge_5_WiFi_Product_Image_Hero_Black.png',
      'https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw5b2e4d43/JBL_PartyBox_110_Hero_004_x2.png'
    ],
    'Sony': [
      'https://electronics.sony.com/image/5c02da5c0a04b705cc0b32e9f56e05c7/SRS-XB100-black-hero',
      'https://electronics.sony.com/image/5d02da5c0a04b705cc0b32e9f56e05c7/SRS-XG300-black-hero'
    ],
    'Bose': [
      'https://assets.bose.com/content/dam/Bose_DAM/Web/consumer_electronics/global/products/speakers/soundlink_flex/product_silo_images/SLF_PDP_GALLERY-01.png',
      'https://assets.bose.com/content/dam/Bose_DAM/Web/consumer_electronics/global/products/speakers/smart_speaker_500/product_silo_images/ss500_pdp_gallery-01.png'
    ]
  }
};

async function seedBulkProducts(count = 10000) {
  const connection = await pool.getConnection();
  const batchSize = 100; // Xử lý 100 sản phẩm mỗi lần
  
  try {
    // Lấy categories và brands từ DB
    const [categories] = await connection.query('SELECT id, name FROM categories');
    const [brands] = await connection.query('SELECT id, name FROM brands');

    console.log(`Bắt đầu tạo ${count} sản phẩm...`);

    for (let i = 0; i < count; i += batchSize) {
      await connection.beginTransaction();
      const currentBatch = Math.min(batchSize, count - i);

      for (let j = 0; j < currentBatch; j++) {
        // Chọn ngẫu nhiên category và brand
        const category = faker.helpers.arrayElement(categories);
        const brand = faker.helpers.arrayElement(brands);

        // Lấy template cho category
        const template = categoryProducts[category.name] || {
          namePattern: (b) => `${b} ${faker.commerce.productName()}`,
          variants: () => [{
            name: faker.commerce.productName(),
            price: faker.number.int({min: 1000000, max: 50000000}),
            initial_stock: faker.number.int({min: 10, max: 100})
          }]
        };

        // Tạo sản phẩm
        const getProductImage = (category, brand) => {
          const categoryImageSet = categoryImages[category.name];
          if (!categoryImageSet) return `https://picsum.photos/seed/${faker.string.numeric(10)}/400/400`;
          
          const brandImages = categoryImageSet[brand.name] || categoryImageSet.default;
          if (!brandImages) return `https://picsum.photos/seed/${faker.string.numeric(10)}/400/400`;
          
          return faker.helpers.arrayElement(brandImages);
        };

        const [productResult] = await connection.query(`
          INSERT INTO products (category_id, name, description, brand_id, image_url)
          VALUES (?, ?, ?, ?, ?)
        `, [
          category.id,
          template.namePattern(brand.name),
          faker.commerce.productDescription(),
          brand.id,
          getProductImage(category, brand)
        ]);

        // Tạo variants
        const variants = template.variants(brand.name);
        for (const variant of variants) {
          const [variantResult] = await connection.query(`
            INSERT INTO productvariants (product_id, name, price, initial_stock)
            VALUES (?, ?, ?, ?)
          `, [productResult.insertId, variant.name, variant.price, variant.initial_stock]);

          // Tạo giao dịch nhập kho
          await connection.query(`
            INSERT INTO inventory_transactions (variant_id, quantity, type, note)
            VALUES (?, ?, 'import', ?)
          `, [variantResult.insertId, variant.initial_stock, 'Nhập kho ban đầu']);
        }
      }

      await connection.commit();
      console.log(`✓ Đã tạo ${i + currentBatch}/${count} sản phẩm`);
    }

    console.log('✅ Hoàn thành tạo dữ liệu sản phẩm!');

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi tạo dữ liệu:', error);
  } finally {
    connection.release();
  }
}

// Chạy seeder với 10000 sản phẩm
seedBulkProducts(10000).then(() => {
  console.log('Done seeding bulk products');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});