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
    variants: () => {
      const colors = ['Đen', 'Trắng', 'Xanh'];
      return colors.map(c => ({
        name: c,
        price: faker.number.int({min: 2000000, max: 40000000}),
        initial_stock: faker.number.int({min: 20, max: 100})
      }));
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
      const configs = ['RTX 3050', 'RTX 3060', 'RTX 4060'];
      return configs.map(c => ({
        name: c,
        price: faker.number.int({min: 15000000, max: 60000000}),
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
        price: faker.number.int({min: 10000000, max: 90000000}),
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
        price: faker.number.int({min: 500000, max: 8000000}),
        initial_stock: faker.number.int({min: 20, max: 100})
      }));
    }
  }
};

const categoryImages = {
  'Điện thoại': {
    'Apple': [
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png',
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-16-plus-1_1.png'
    ],
    'Samsung': [
      'https://cdn.hoanghamobile.com/i/preview-np-V2/Uploads/ImageHightlight/3570_samsung-galaxy-z-fold6/galaxy-z-fold6-thietke-1020x570.jpg',
      'https://cdn.hoanghamobile.com/i/previewV2/Uploads/2024/07/10/z-fold6-pink-1.png'
    ],
    'Xiaomi': [
      'https://cdn.hoanghamobile.com/i/previewV2/Uploads/2024/04/22/xiaomi-14-ultra-3.png',
      'https://cdn.hoanghamobile.com/i/previewV2/Uploads/2024/04/22/xiaomi-14-ultra-4.png'
    ],
    'OPPO': [
      'https://cdn.nguyenkimmall.com/images/thumbnails/382/382/detailed/839/10053753-dien-thoai-oppo-a17-4gb-64gb-xanh-1.jpg',
      'https://lh3.googleusercontent.com/3vVR3IRJR1YKHHsPM3WubJclSuUnW_37vHMEZitGstR50AnrYAKPCicQJg4DbwnhgHzAIRy6QJCbRL55nsTqy_i10g3_fOBe=rw'
    ],
    'Vivo': [
      'https://cdn.hoanghamobile.com/i/previewV2/Uploads/2023/10/20/den-dai-ngan-1.png',
      'https://cdn.hoanghamobile.com/i/previewV2/Uploads/2023/10/20/xanh-song-bang-6.png'
    ],
    'Realme': [
      'https://store.sony.com.vn/cdn/shop/files/747_ProductPrimary_image_Khaki-Green_400x.png?v=1700110016',
      'https://cdn.hoanghamobile.com/i/previewV2/Uploads/2024/04/16/realme-c53-3.png'
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
      'https://s.alicdn.com/@sc04/kf/H665fa3869e9e4268ab782660d7569e5dw.jpg_720x720q50.jpg',
      'https://s.alicdn.com/@sc04/kf/Hc8aa85f888a9498f8517b88192538a8cm.jpg_720x720q50.jpg'
    ],
    'HP': [
      'https://www.laptopvip.vn/images/ab__webp/thumbnails/1100/900/detailed/26/5MT98UA-ABL-4-1750x1285-www.laptopvip.vn-1624951443.png.webp',
      'https://www.laptopvip.vn/images/ab__webp/thumbnails/1100/900/detailed/26/6428658cv10d-www.laptopvip.vn-1619429646-itag-0j-www.laptopvip.vn-1624951443.png.webp'
    ],
    'Lenovo': [
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_15__7_14.png',
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_15__7_14.png'
    ]
  },

  'Laptop gaming': {
    'Asus': [
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_4__5_35_1.png',
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_4__5_35_1.png',
    ],
    'MSI': [
      'https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/7/5/acer-predator-helios-neo-16-phn16-72-91rf-undefined.jpg',
      'https://product.hstatic.net/200000420363/product/laptop-gaming-msi-katana-15-b13vek_24b6d078bd91414daaf0f02e8d38c83d_master.png'
    ],
    'Acer': [
      'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/2/8/28_1_17.jpg',
      'https://cdn.tgdd.vn/Products/Images/44/325051/acer-swift-go-14-ai-73-71zx-ultra-7-nxkslsv002-2-1-750x500.jpg'
    ]
  },

  'Camera & Máy ảnh': {
    'Canon': [
      'https://imagedelivery.net/ZeGtsGSjuQe1P3UP_zk3fQ/b9a7da25-de82-40bc-ecc6-90473f619400/storedata',
      'https://imagedelivery.net/ZeGtsGSjuQe1P3UP_zk3fQ/75bef658-3b0d-466f-7df0-b9227c548d00/storedata'
    ],
    'Sony': [
      'https://imagedelivery.net/ZeGtsGSjuQe1P3UP_zk3fQ/b68b77a1-6ca6-4523-6a08-2a572840ee00/storedata',
      'https://cdn.vjshop.vn/may-anh/mirrorless/sony/sony-alpha-a7-mark-iv/lens-28-70mm-f35-56/sony-alpha-a7-mark-iv-lens-28-70mm-f35-56-500x500.jpg'
    ],
    'Nikon': [
      'https://imagedelivery.net/ZeGtsGSjuQe1P3UP_zk3fQ/c06fd9d1-bc40-49ab-76c0-3a282e806400/storedata',
      'https://imagedelivery.net/ZeGtsGSjuQe1P3UP_zk3fQ/7f306e41-9711-4897-5760-768897715f00/storedata'
    ]
  },

  'Gaming Gear': {
    'Logitech': [
      'https://product.hstatic.net/1000129940/product/01_acdcdaa5d203400bb4173ce82e520be6_master.jpg',
      'https://product.hstatic.net/200000420363/product/1_7f940c220a6c4e938ecfefa264af5fab_master.jpg'
    ],
    'Razer': [
      'https://product.hstatic.net/200000420363/product/chuot-gaming-razer-basilisk-v3-rz01-04000100-r3m1-1__1__4bad60b240474d4db03c365ce9adcbe7_master.jpg',
      'https://product.hstatic.net/200000420363/product/chuot-logitech-pro-x-superlight-2-wireless-gaming-7_70bc279fb0e14554ab63e23b45f74d3f_master.jpg'
    ]
  },

  'Loa & Âm thanh': {
    'JBL': [
      'https://antien.vn/uploaded/B%26O%20Beosound%20Balance%20Google%20Assistant/B-O-Beosound-Balance-Google-Assistant.jpg',
      'hthttps://store.sony.com.vn/cdn/shop/files/Primary_image_1200-9_400x.jpg?v=1723014578'
    ],
    'Sony': [
      'https://product.hstatic.net/200000567141/product/hifuture-vent-1_069b0255818a4867b2e2e3a30f87c774_master.jpg',
      'https://product.hstatic.net/200000567141/product/bang-max-portable-party-speaker_e0063a92ca4f4f4c8b2f7841757841f1_master.jpg'
    ],
    'Bose': [
      'https://topav.vn/thumbnails/products/large/uploads/2023/11/loa-cqa-10dvd-400x399.jpg.webp',
      'https://topav.vn/thumbnails/products/large/uploads/2023/11/loa-cqa-10dvd-400x399.jpg.webp'
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