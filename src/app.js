const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, authenticateJWT } = require('./database/dbconfig.js');
const { testFirebaseConnection } = require('./firebaseConfig.js');
const session = require('express-session');
const passport = require('./config/passport');
const { initUploadDirs } = require('./utils/init');
const { initializeWebSocket } = require('./websocket');
const http = require('http');
const axios = require('axios');

const app = express();


const server = http.createServer(app);

// Khởi tạo WebSocket server
initializeWebSocket(server);

//client
const productRoutes = require('./client/products/product.js');
//client
const cartRoutes = require('./client/carts/cart.js');
//client
const orderRoutes = require('./client/orders/order.js');
//client
const accountRoutesClient = require('./client/users/log.js');
// Thêm import cho recommended products
const recommendedProductsRoutes = require('./client/products/recommended-products.js');
//admin
const productManagementRoutes = require('./admin/products/product-management.js');
//admin
const adminAuthRoutes = require('./admin/user/log.js');
//admin
const userManageRoutes = require('./admin/user/user-manage.js');
//admin
const orderManagementRoutes = require('./admin/orders/order-management.js');

const locationRoutes = require('./client/proxy/location.js');

const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });






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
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
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
    accountRoutesClient,
    locationRoutes,
    recommendedProductsRoutes
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
server.listen(PORT, async () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    const isFirebaseConnected = await testFirebaseConnection();
    if (isFirebaseConnected) {
        console.log('Kết nối Firebase thành công.');
    } else {
        console.log('Kết nối Firebase thất bại.');
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
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp')
    }
  }
}))

// Khởi tạo thư mục uploads khi start server
initUploadDirs().catch(console.error);

// Sửa lại cấu hình serve static files
app.use('/assets/uploads', express.static(path.join(__dirname, 'assets/uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
      case '.webp':
        res.setHeader('Content-Type', 'image/webp')
        break
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg')
        break
      case '.png':
        res.setHeader('Content-Type', 'image/png')
        break
    }
  }
}))

// Thêm middleware để log requests (để debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

const reviewManagementRoutes = require('./admin/reviews/reviews-management');

// Đăng ký routes
app.use('/api/admin', [
  // ... other admin routes ...
  reviewManagementRoutes
]);

const aiRouter = require('./routes/ai');

app.use('/api/ai', aiRouter);

// Import recommender routes
const recommendationRoutes = require('./client/products/recommendations.js');

// Sử dụng routes
app.use('/api/recommendations', recommendationRoutes);

