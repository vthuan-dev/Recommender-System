const express = require('express');
const db = require('./database/config');
const authMiddleware = require('./middlewares/auth');
const userRoutes = require('./routes/userRoute');

const app = express();

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/api', userRoutes);

// Kết nối database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));