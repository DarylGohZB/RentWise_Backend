const mysql = require('mysql2/promise');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'loginDB',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

module.exports = {
  getUser: async function (email, hash) {
    const p = getPool();
    const [rows] = await p.execute('SELECT user_id, displayName, email, isDisable, userRole FROM users WHERE email = ? AND passwordHash = ?', [email, hash]);
    return rows && rows.length ? rows[0] : null;
  }
,

  createUser: async function (email, passwordHash, displayName) {
    const p = getPool();
    try {
      const [result] = await p.execute('INSERT INTO users (email, passwordHash, displayName) VALUES (?, ?, ?)', [email, passwordHash, displayName]);
      return { ok: true, insertId: result.insertId };
    } catch (err) {
      // propagate error to caller for handling duplicate keys etc.
      console.log(err)
      return { ok: false, error: err };
    }
  }
};
