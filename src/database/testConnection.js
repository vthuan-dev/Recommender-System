const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('./dbconfig');

async function testConnection() {
  try {
    // Log các biến môi trường
    console.log('Environment variables:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PORT:', process.env.DB_PORT);

    const connection = await pool.getConnection();
    console.log('✓ Kết nối database thành công!');
    
    const [result] = await connection.query('SELECT 1');
    console.log('✓ Test query:', result);

    connection.release();
  } catch (error) {
    console.error('✕ Lỗi kết nối:', error.message);
  } finally {
    process.exit();
  }
}

testConnection();