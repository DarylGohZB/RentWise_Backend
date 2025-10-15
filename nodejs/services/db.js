const mysql = require('mysql2/promise');

console.log('[SERVICES/DB] Initializing MySQL connection pool...');

const host = process.env.DB_HOST || 'localhost';
const portRaw = process.env.DB_PORT || 3306;
let port = Number(portRaw);
if (host === 'rentwiseDB') {
  port = 3306; // always use container port when talking to Docker MySQL service
}

console.log(`[DB] Connecting host=${host} port=${port} user=${process.env.DB_USER || 'root'} db=${process.env.DB_NAME || 'rentwiseDB'}`);

const pool = mysql.createPool({
  host,
  port,
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
