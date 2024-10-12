const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, authenticateJWT } = require('./database/dbconfig');
const { testFirebaseConnection } = require('./firebaseConfig');

//client
const productRoutes = require('./client/products/product.js');
//client
const cartRoutes = require('./client/carts/cart.js');
//client
const orderRoutes = require('./client/orders/order.js');
//client
const accountRoutesClient = require('./client/users/log.js');
//admin
const productManagementRoutes = require('./admin/products/projduct-management.js');
//admin
const adminAuthRoutes = require('./admin/user/log');
//admin
const userManageRoutes = require('./admin/user/user-manage');
//admin
const orderManagementRoutes = require('./admin/orders/order-management.js');

const dotenv = require('dotenv');

dotenv.config();
const app = express();



app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/admin/manage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'manage.html'));
});
app.get('/admin/test', (req, res) => {
  res.send('Test route working');
});

app.use('/admin', adminAuthRoutes);
// Sử dụng các route
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/', accountRoutesClient);
app.use('/admin', productManagementRoutes);
app.use('/admin', userManageRoutes);
app.use('/admin', orderManagementRoutes);
app.use('/admin', adminAuthRoutes);
// Middleware xử lý lỗi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Có lỗi xảy ra!');
});

// Route mặc định

// Thêm đoạn code này vào cuối file app.js

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


