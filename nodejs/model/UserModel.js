const mysql = require('mysql2/promise');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '3306', 10) || 3306,
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
  // Check if an email already exists in the users table.
  // Returns { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } }
  // when the email is present, otherwise { ok: true }.
  checkEmailExists: async function (email) {
    const p = getPool();
    const [rows] = await p.execute('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows && rows.length) {
      return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } };
    }
    return { ok: true };
  },

  createUser: async function (email, passwordHash, displayName) {
    const p = getPool();
    // Pre-check to provide a friendlier error when email already exists.
    try {
      // The appropriate checks for email
      const exists = await module.exports.checkEmailExists(email);
      if (exists && exists.ok === false) {
        return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } };
      }

      const [result] = await p.execute('INSERT INTO users (email, passwordHash, displayName) VALUES (?, ?, ?)', [email, passwordHash, displayName]);
      return { ok: true, insertId: result.insertId };
    } catch (err) {
      // If the insert still fails due to race condition (duplicate key), normalize the error shape
      if (err && err.code === 'ER_DUP_ENTRY') {
        return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists', raw: err } };
      }
      console.log(err);
      return { ok: false, error: err };
    }
  }
};
