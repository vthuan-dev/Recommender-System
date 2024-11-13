const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, authenticateJWT } = require('./database/dbconfig.js');
const { testFirebaseConnection } = require('./firebaseConfig.js');
const session = require('express-session');




//client
const productRoutes = require('./client/products/product.js');
//client
const cartRoutes = require('./client/carts/cart.js');
//client
const orderRoutes = require('./client/orders/order.js');
//client
const accountRoutesClient = require('./client/users/log.js');
//admin
const productManagementRoutes = require('./admin/products/product-management.js');
//admin
const adminAuthRoutes = require('./admin/user/log.js');
//admin
const userManageRoutes = require('./admin/user/user-manage.js');
//admin
const orderManagementRoutes = require('./admin/orders/order-management.js');

const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });



const app = express();



app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 1 ngày
   }
}));


const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files - QUAN TRỌNG: Thêm options để set đúng MIME type
app.use(express.static(path.join(__dirname, '../public')));



app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/homepage/homepage.html'));
});

app.get('/admin/manage', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/admin/manage.html'));
});


app.use('/admin', adminAuthRoutes);
// Sử dụng các route
app.use('/api', [
    productRoutes,
    cartRoutes,
    orderRoutes,
    accountRoutesClient
]);
app.use('/api/admin', [
    productManagementRoutes,

    orderManagementRoutes,
    adminAuthRoutes
]);
app.use('/api/admin', userManageRoutes);
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

// app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});

