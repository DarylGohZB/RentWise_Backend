const pool = require('../services/db');

module.exports = {
  getUser: async function (email, hash) {
    const [rows] = await pool.execute(
      'SELECT user_id, displayName, email, isDisable, userRole FROM users WHERE email = ? AND passwordHash = ?',
      [email, hash]
    );
    return rows.length ? rows[0] : null;
  },

  getUserById: async function (user_id) {
    const [rows] = await pool.execute(
      'SELECT user_id, displayName, email, isDisable, userRole FROM users WHERE user_id = ?',
      [user_id]
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

  updateUserProfile: async function (user_id, email, displayName) {
    try {
      console.log('[DB] updateUserProfile called for user_id:', user_id);

      // Check if new email already exists for a different user
      if (email) {
        const [existingUser] = await pool.execute(
          'SELECT user_id FROM users WHERE email = ? AND user_id != ? LIMIT 1',
          [email, user_id]
        );
        
        if (existingUser.length > 0) {
          console.warn('[DB] updateUserProfile failed: email already exists for another user');
          return { ok: false, error: { code: 'ER_DUP_ENTRY', message: 'Email already exists' } };
        }
      }

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (displayName) {
        updates.push('displayName = ?');
        values.push(displayName);
      }

      // If nothing to update
      if (updates.length === 0) {
        return { ok: true, message: 'No changes to update' };
      }

      values.push(user_id);

      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        console.warn('[DB] updateUserProfile: no rows affected for user_id:', user_id);
        return { ok: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
      }

      console.log('[DB] updateUserProfile successful for user_id:', user_id);
      return { ok: true, affectedRows: result.affectedRows };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { ok: false, error: { code: 'ER_DUP_ENTRY', message: 'Email already exists' } };
      }
      console.error('[DB] updateUserProfile error:', err);
      return { ok: false, error: err };
    }
  },
};
