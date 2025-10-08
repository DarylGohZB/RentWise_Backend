const mysql = require('mysql2/promise');

console.log('[SERVICES/DB] Initializing MySQL connection pool...');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rentwiseDB',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// Validate connection right after creating the pool
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping(); // low-cost connectivity test
    console.log('[SERVICES/DB] MySQL connection successful');
    connection.release();
  } catch (err) {
    console.error('[SERVICES/DB] MySQL connection failed:', err.message);
    console.log("Stopping app as DB is unreachable!");
    process.exit(1); // stop app if DB is unreachable
  }
})();

module.exports = pool;
