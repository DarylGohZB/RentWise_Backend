const pool = require('../db/config');

/**
 * Get the current status row
 */
async function getStatusRow() {
  const [rows] = await pool.execute(`
    SELECT * FROM govt_api_status ORDER BY id DESC LIMIT 1
  `);
  return rows.length ? rows[0] : null;
}

/**
 * Set last sync time to NOW and optionally status
 */
async function setLastSyncNow(status = 'operational') {
  await pool.execute(`
    UPDATE govt_api_status
    SET last_sync_time = NOW(), current_status = ?
    ORDER BY id DESC LIMIT 1
  `, [status]);
}

/**
 * Set last key update time to NOW
 */
async function setLastKeyUpdateNow() {
  await pool.execute(`
      UPDATE govt_api_status
      SET last_key_update_time = NOW()
      ORDER BY id DESC LIMIT 1
    `);
}

module.exports = {
  getStatusRow,
  setLastSyncNow,
  setLastKeyUpdateNow,
};
