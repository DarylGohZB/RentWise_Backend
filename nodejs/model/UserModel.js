const pool = require('../services/db');

module.exports = {
  getUser: async function (email, hash) {
    const [rows] = await pool.execute(
      'SELECT user_id, displayName, email, isDisable, userRole FROM users WHERE email = ? AND passwordHash = ?',
      [email, hash]
    );
    return rows.length ? rows[0] : null;
  },

  checkEmailExists: async function (email) {
    const [rows] = await pool.execute('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows.length) {
      return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } };
    }
    return { ok: true };
  },

  createUser: async function (email, passwordHash, displayName) {
    try {
      const exists = await module.exports.checkEmailExists(email);
      if (exists && !exists.ok) return exists;

      const [result] = await pool.execute(
        'INSERT INTO users (email, passwordHash, displayName) VALUES (?, ?, ?)',
        [email, passwordHash, displayName]
      );

      return { ok: true, insertId: result.insertId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } };
      }
      console.error('[DB] createUser error:', err);
      return { ok: false, error: err };
    }
  },
};
