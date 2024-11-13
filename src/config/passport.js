const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Tạo pool connection với retry logic
const createPool = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3307,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log('MySQL connected successfully');
      connection.release();
      return pool;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Initialize pool
let pool;
createPool().then(p => pool = p).catch(error => {
  console.error('Failed to create pool:', error);
  process.exit(1);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Kiểm tra user có tồn tại
      const [existingUsers] = await connection.query(
        'SELECT users.*, roles.name as role_name FROM users LEFT JOIN roles ON users.role_id = roles.id WHERE google_id = ?',
        [profile.id]
      );

      let user;
      if (existingUsers.length > 0) {
        user = existingUsers[0];
      } else {
        // Lấy role_id của customer
        const [roles] = await connection.query(
          'SELECT id FROM roles WHERE name = ?',
          ['customer']
        );
        
        const roleId = roles[0]?.id;
        
        // Tạo user mới
        const [result] = await connection.query(
          `INSERT INTO users (
            fullname, 
            email, 
            google_id, 
            avatar_url, 
            role_id,
            auth_type
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            profile.displayName,
            profile.emails[0].value,
            profile.id,
            profile.photos[0]?.value,
            roleId,
            'google'
          ]
        );

        const [newUser] = await connection.query(
          'SELECT users.*, roles.name as role_name FROM users LEFT JOIN roles ON users.role_id = roles.id WHERE users.id = ?',
          [result.insertId]
        );

        user = newUser[0];
      }

      await connection.commit();
      return done(null, user);

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      return done(error, null);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        `SELECT users.*, roles.name as role_name 
         FROM users 
         LEFT JOIN roles ON users.role_id = roles.id 
         WHERE users.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return done(null, false);
      }

      done(null, users[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;