/* =========================================================
   ClickFit — MySQL connection pool
   ========================================================= */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clickfit',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL connection pool ready.');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check your .env values and that MySQL is running.');
  }
})();

module.exports = pool;