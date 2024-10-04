const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, authenticateJWT } = require('./database/dbconfig');
const { testFirebaseConnection } = require('./firebaseConfig');

const productRoutes = require('./client/products/product.js');
const cartRoutes = require('./client/carts/cart.js');
const orderRoutes = require('./client/orders/order.js');
const accountRoutes = require('./client/account/log.js');
const addProductRoutes = require('./admin/ad-product/add-products.js');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sử dụng các route
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/', accountRoutes);
app.use('/', addProductRoutes);
// Middleware xử lý lỗi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Có lỗi xảy ra!');
});

// Route mặc định

// Thêm đoạn code này vào cuối file app.js
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(r.route.path)
    } else if (r.name === 'router') {
      r.handle.stack.forEach(function(nestedRoute){
        if (nestedRoute.route){
          console.log(r.regexp, nestedRoute.route.path)
        }
      })
    }
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    const isFirebaseConnected = await testFirebaseConnection();
    if (isFirebaseConnected) {
        console.log('Kết nối Firebase thành công.');
    } else {
        console.log('Kết nối Firebase thất bại. Vui lòng kiểm tra cấu hình.');
    }
});
