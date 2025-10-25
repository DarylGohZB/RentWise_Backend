const pool = require('../db/config');

module.exports = {
  /**
   * Ensure api_logs table exists with proper schema
   */
  ensureTable: async function () {
    const p = pool;
    await p.execute(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        operation VARCHAR(255),
        status VARCHAR(50),
        record_summary VARCHAR(255),
        duration FLOAT,
        error_message TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[DB] Api logs table ensured');
  },

  async logApiActivity({ operation, status, recordSummary = '-', duration = null, errorMessage = null }) {
    await pool.execute(
      `INSERT INTO api_logs (operation, status, record_summary, duration, error_message)
       VALUES (?, ?, ?, ?, ?)`,
      [operation, status, recordSummary, duration, errorMessage]
    );
  },

  async getRecentLogs(limit = 10) {
    // Sanitize limit to avoid SQL injection if this value ever comes from user input
    const safeLimit = Math.max(1, parseInt(limit) || 10);

    const [rows] = await pool.execute(
      `SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT ${safeLimit}`
    );
    return rows;
  }
};