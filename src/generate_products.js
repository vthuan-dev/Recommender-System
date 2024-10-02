const fs = require('fs');
const { faker } = require('@faker-js/faker');

const categories = [
  { id: 1, name: 'Điện thoại di động' },
  { id: 2, name: 'Laptop' },
  { id: 3, name: 'Máy tính bảng' },
  { id: 4, name: 'Phụ kiện điện thoại' },
  { id: 5, name: 'Phụ kiện máy tính' },
  { id: 6, name: 'Thiết bị âm thanh' },
  { id: 7, name: 'Smartwatch' },
  { id: 8, name: 'Máy ảnh' },
  { id: 9, name: 'Thiết bị mạng' },
  { id: 10, name: 'Thiết bị thông minh' }
];

const brands = {
  'Điện thoại di động': ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Nokia'],
  'Laptop': ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple', 'MSI'],
  'Máy tính bảng': ['Apple', 'Samsung', 'Lenovo', 'Huawei', 'Microsoft'],
  'Phụ kiện điện thoại': ['Anker', 'Belkin', 'Spigen', 'Mophie', 'Otterbox'],
  'Phụ kiện máy tính': ['Logitech', 'Corsair', 'Razer', 'SteelSeries', 'HyperX'],
  'Thiết bị âm thanh': ['Sony', 'Bose', 'JBL', 'Sennheiser', 'Audio-Technica'],
  'Smartwatch': ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei'],
  'Máy ảnh': ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'],
  'Thiết bị mạng': ['TP-Link', 'Netgear', 'Linksys', 'D-Link', 'Asus'],
  'Thiết bị thông minh': ['Google', 'Amazon', 'Xiaomi', 'Philips Hue', 'Nest']
};

function generateProduct(id) {
  const category = faker.helpers.arrayElement(categories);
  const brand = faker.helpers.arrayElement(brands[category.name]);
  
  let name = `${brand} ${faker.commerce.productName()}`;
  let specs = [];

  switch (category.name) {
    case 'Điện thoại di động':
      specs = [
        { key: 'Màn hình', value: `${faker.number.int({ min: 5, max: 7 })} inch` },
        { key: 'RAM', value: `${faker.helpers.arrayElement([4, 6, 8, 12])} GB` },
        { key: 'Bộ nhớ trong', value: `${faker.helpers.arrayElement([64, 128, 256, 512])} GB` },
        { key: 'Camera', value: `${faker.number.int({ min: 12, max: 108 })} MP` }
      ];
      break;
    case 'Laptop':
      specs = [
        { key: 'CPU', value: faker.helpers.arrayElement(['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'AMD Ryzen 7']) },
        { key: 'RAM', value: `${faker.helpers.arrayElement([8, 16, 32, 64])} GB` },
        { key: 'Ổ cứng', value: `${faker.helpers.arrayElement([256, 512, 1024])} GB SSD` },
        { key: 'Màn hình', value: `${faker.number.int({ min: 13, max: 17 })} inch` }
      ];
      break;
    case 'Máy tính bảng':
      specs = [
        { key: 'Màn hình', value: `${faker.number.int({ min: 7, max: 13 })} inch` },
        { key: 'RAM', value: `${faker.helpers.arrayElement([2, 4, 6, 8])} GB` },
        { key: 'Bộ nhớ trong', value: `${faker.helpers.arrayElement([32, 64, 128, 256])} GB` },
        { key: 'Camera', value: `${faker.number.int({ min: 5, max: 20 })} MP` }
      ];
      break;
    case 'Phụ kiện điện thoại':
      specs = [
        { key: 'Loại', value: faker.helpers.arrayElement(['Ốp lưng', 'Tai nghe', 'Sạc dự phòng', 'Cáp sạc', 'Miếng dán màn hình']) },
        { key: 'Tương thích', value: faker.helpers.arrayElement(['iPhone', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Tất cả']) },
        { key: 'Chất liệu', value: faker.helpers.arrayElement(['Nhựa', 'Silicon', 'Kim loại', 'Da', 'Kính cường lực']) }
      ];
      break;
    case 'Phụ kiện máy tính':
      specs = [
        { key: 'Loại', value: faker.helpers.arrayElement(['Chuột', 'Bàn phím', 'Tai nghe', 'Webcam', 'Loa']) },
        { key: 'Kết nối', value: faker.helpers.arrayElement(['Có dây', 'Không dây', 'Bluetooth']) },
        { key: 'Tương thích', value: faker.helpers.arrayElement(['Windows', 'MacOS', 'Linux', 'Tất cả']) }
      ];
      break;
    case 'Thiết bị âm thanh':
      specs = [
        { key: 'Loại', value: faker.helpers.arrayElement(['Loa bluetooth', 'Tai nghe true wireless', 'Tai nghe over-ear', 'Soundbar']) },
        { key: 'Thời lượng pin', value: `${faker.number.int({ min: 4, max: 40 })} giờ` },
        { key: 'Chống nước', value: faker.helpers.arrayElement(['Có', 'Không']) }
      ];
      break;
    case 'Smartwatch':
      specs = [
        { key: 'Màn hình', value: `${faker.number.float({ min: 1, max: 2, precision: 0.1 })} inch` },
        { key: 'Thời lượng pin', value: `${faker.number.int({ min: 1, max: 14 })} ngày` },
        { key: 'Chống nước', value: faker.helpers.arrayElement(['5 ATM', '3 ATM', 'IP68', 'Không']) },
        { key: 'Tính năng sức khỏe', value: faker.helpers.arrayElement(['Đo nhịp tim', 'Đo SpO2', 'Theo dõi giấc ngủ', 'Đếm bước chân']) }
      ];
      break;
    case 'Máy ảnh':
      specs = [
        { key: 'Độ phân giải', value: `${faker.number.int({ min: 12, max: 60 })} MP` },
        { key: 'Zoom quang học', value: `${faker.number.int({ min: 3, max: 30 })}x` },
        { key: 'Kích thước cảm biến', value: faker.helpers.arrayElement(['Full-frame', 'APS-C', 'Micro 4/3', '1 inch']) },
        { key: 'Quay video', value: faker.helpers.arrayElement(['4K', '1080p', '8K']) }
      ];
      break;
    case 'Thiết bị mạng':
      specs = [
        { key: 'Loại', value: faker.helpers.arrayElement(['Router', 'Modem', 'Switch', 'Access Point']) },
        { key: 'Chuẩn Wi-Fi', value: faker.helpers.arrayElement(['Wi-Fi 6', 'Wi-Fi 5', 'Wi-Fi 4']) },
        { key: 'Tốc độ', value: `${faker.number.int({ min: 300, max: 6000 })} Mbps` },
        { key: 'Số cổng LAN', value: faker.helpers.arrayElement([1, 2, 4, 8]) }
      ];
      break;
    case 'Thiết bị thông minh':
      specs = [
        { key: 'Loại', value: faker.helpers.arrayElement(['Loa thông minh', 'Bóng đèn thông minh', 'Ổ cắm thông minh', 'Camera an ninh']) },
        { key: 'Kết nối', value: faker.helpers.arrayElement(['Wi-Fi', 'Bluetooth', 'Zigbee', 'Z-Wave']) },
        { key: 'Tương thích', value: faker.helpers.arrayElement(['Google Home', 'Amazon Alexa', 'Apple HomeKit', 'Tất cả']) },
        { key: 'Điều khiển bằng giọng nói', value: faker.helpers.arrayElement(['Có', 'Không']) }
      ];
      break;
  }

  return {
    id: id,
    name: name,
    category_id: category.id,
    category_name: category.name,
    brand: brand,
    price: faker.number.int({ min: 1000000, max: 50000000, precision: 10000 }),
    original_price: faker.number.int({ min: 1000000, max: 50000000, precision: 10000 }),
    thumbnail_url: `https://example.com/images/${faker.string.uuid()}.jpg`,
    rating: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
    review_count: faker.number.int({ min: 0, max: 1000 }),
    specs: specs
  };
}

const products = Array.from({ length: 100 }, (_, i) => generateProduct(i + 1));

fs.writeFileSync('products.json', JSON.stringify(products, null, 2));

console.log('Đã tạo file products.json với 100 sản phẩm mẫu');