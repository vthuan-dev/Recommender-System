const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const { pool } = require('./database/dbconfig');
dotenv.config();


const productRoutes = require('./client/products/product.js');
const cartRoutes = require('./client/carts/cart.js');
//const orderRoutes = require('./client/orders/order.js');
const accountRoutes = require('./client/account/log.js');


app.use(cors());
app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
//app.use('/api/orders', orderRoutes);
app.use('/api/account', accountRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Có lỗi xảy ra!');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


module.exports = app;



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});

