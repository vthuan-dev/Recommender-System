const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, authenticateJWT } = require('./database/dbconfig.js');
const { testFirebaseConnection } = require('./firebaseConfig.js');
const session = require('express-session');
const passport = require('./config/passport');
const { initUploadDirs } = require('./utils/init');




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
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Cấu hình CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cấu hình session trước khi sử dụng passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Khởi tạo passport
app.use(passport.initialize());
app.use(passport.session());

// Import và sử dụng routes
const googleAuthRoutes = require('./client/auth/google_route');
app.use('/', googleAuthRoutes);

// Serve static files từ thư mục assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Khởi tạo thư mục uploads khi start server
initUploadDirs().catch(console.error);

// Sửa lại cấu hình serve static files
app.use('/assets/uploads', express.static(path.join(__dirname, 'assets/uploads')));

// Thêm middleware để handle image MIME types
app.use((req, res, next) => {
  if (req.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    res.type(`image/${path.extname(req.url).slice(1)}`);
  }
  next();
});

