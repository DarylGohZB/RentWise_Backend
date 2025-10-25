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
  /**
   * Ensure govt_api_status table exists with proper schema
   */
  ensureTable: async function () {
    const p = pool;
    await p.execute(`
      CREATE TABLE IF NOT EXISTS govt_api_status (
        id INT PRIMARY KEY AUTO_INCREMENT,
        last_sync_time DATETIME,
        last_key_update_time DATETIME,
        current_status ENUM('operational', 'error') DEFAULT 'operational'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert default row if table is empty
    const [rows] = await p.execute(`SELECT COUNT(*) as count FROM govt_api_status`);
    if (rows[0].count === 0) {
      await p.execute(`
        INSERT INTO govt_api_status (last_sync_time, last_key_update_time, current_status)
        VALUES ('2025-10-22 10:00:00', '2025-10-21 18:30:00', 'operational')
      `);
    }

    console.log('[DB] Govt API status table ensured');
  },

  getStatusRow,
  setLastSyncNow,
  setLastKeyUpdateNow,
};
