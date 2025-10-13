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

  // User Management Methods
  getAllUsers: async function () {
    try {
      const [rows] = await pool.execute(
        'SELECT user_id, displayName, email, isDisable, userRole FROM users'
      );
      return { ok: true, users: rows };
    } catch (err) {
      console.error('[DB] getAllUsers error:', err);
      return { ok: false, error: err };
    }
  },

  updateUserByAdmin: async function (user_id, updateData) {
    try {
      console.log('[DB] updateUserByAdmin called for user_id:', user_id);

      // Check if new email already exists for a different user
      if (updateData.email) {
        const [existingUser] = await pool.execute(
          'SELECT user_id FROM users WHERE email = ? AND user_id != ? LIMIT 1',
          [updateData.email, user_id]
        );
        
        if (existingUser.length > 0) {
          console.warn('[DB] updateUserByAdmin failed: email already exists for another user');
          return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } };
        }
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      const allowedFields = ['displayName', 'email', 'userRole', 'isDisable'];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });

      // If nothing to update
      if (updates.length === 0) {
        return { ok: false, error: { message: 'No valid fields to update' } };
      }

      values.push(user_id);

      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        console.warn('[DB] updateUserByAdmin: no rows affected for user_id:', user_id);
        return { ok: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
      }

      console.log('[DB] updateUserByAdmin successful for user_id:', user_id);
      return { ok: true, affectedRows: result.affectedRows };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email already exists' } };
      }
      console.error('[DB] updateUserByAdmin error:', err);
      return { ok: false, error: err };
    }
  },

  toggleUserDisable: async function (user_id) {
    try {
      console.log('[DB] toggleUserDisable called for user_id:', user_id);

      // First get current isDisable status
      const [rows] = await pool.execute(
        'SELECT isDisable FROM users WHERE user_id = ?',
        [user_id]
      );

      if (rows.length === 0) {
        console.warn('[DB] toggleUserDisable: user not found for user_id:', user_id);
        return { ok: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
      }

      const currentStatus = rows[0].isDisable;
      const newStatus = !currentStatus;

      // Update the status
      const [result] = await pool.execute(
        'UPDATE users SET isDisable = ? WHERE user_id = ?',
        [newStatus, user_id]
      );

      console.log('[DB] toggleUserDisable successful for user_id:', user_id, 'new status:', newStatus);
      return { ok: true, affectedRows: result.affectedRows, newStatus };
    } catch (err) {
      console.error('[DB] toggleUserDisable error:', err);
      return { ok: false, error: err };
    }
  },

  deleteUserById: async function (user_id) {
    try {
      console.log('[DB] deleteUserById called for user_id:', user_id);

      // TODO IF NEEDED: Handle cascade delete for related records
      // Currently CASCADE DELETE is handled by MySQL foreign key constraints
      // If additional cleanup is needed (e.g., S3 images, external services), add here

      const [result] = await pool.execute(
        'DELETE FROM users WHERE user_id = ?',
        [user_id]
      );

      if (result.affectedRows === 0) {
        console.warn('[DB] deleteUserById: no rows affected for user_id:', user_id);
        return { ok: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } };
      }

      console.log('[DB] deleteUserById successful for user_id:', user_id);
      return { ok: true, affectedRows: result.affectedRows };
    } catch (err) {
      console.error('[DB] deleteUserById error:', err);
      return { ok: false, error: err };
    }
  },

  getUserStats: async function () {
    try {
      console.log('[DB] getUserStats called');

      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN userRole = 'LANDLORD' THEN 1 ELSE 0 END) as landlordCount,
          SUM(CASE WHEN userRole = 'ADMIN' THEN 1 ELSE 0 END) as adminCount,
          SUM(CASE WHEN isDisable = 1 THEN 1 ELSE 0 END) as disabledCount
        FROM users
      `);

      const stats = {
        totalUsers: rows[0].totalUsers || 0,
        landlordCount: rows[0].landlordCount || 0,
        adminCount: rows[0].adminCount || 0,
        disabledCount: rows[0].disabledCount || 0,
      };

      console.log('[DB] getUserStats successful:', stats);
      return { ok: true, stats };
    } catch (err) {
      console.error('[DB] getUserStats error:', err);
      return { ok: false, error: err };
    }
  },
};
