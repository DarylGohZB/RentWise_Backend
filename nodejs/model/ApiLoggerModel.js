const pool = require('../db/config');

module.exports = {
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