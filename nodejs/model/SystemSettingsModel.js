const pool = require('../db/config');

module.exports = {
    /**
     * Ensure system_settings table exists with proper schema
     */
    ensureTable: async function () {
        const p = pool;
        await p.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Insert default settings if they don't exist
        await p.execute(`
            INSERT INTO system_settings (setting_key, setting_value)
            VALUES 
            ('enable_2fa_admin', 'false'),
            ('session_timeout_minutes', '60')
            ON DUPLICATE KEY UPDATE setting_value = setting_value;
        `);

        console.log('[DB] System settings table ensured');
    },

    async getSetting(key) {
        const [rows] = await pool.execute(`SELECT setting_value FROM system_settings WHERE setting_key = ?`, [key]);
        return rows[0]?.setting_value || null;
    },

    async setSetting(key, value) {
        await pool.execute(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [key, value]);
    },

    async getAllSettings() {
        const [rows] = await pool.execute('SELECT * FROM system_settings');
        const map = {};

        for (const row of rows) {
            map[row.setting_key] = row.setting_value;
        }

        // Set defaults if not present
        if (!map['2fa_enabled']) map['2fa_enabled'] = 'false';
        if (!map['session_timeout']) map['session_timeout'] = '60'; // default 1 hour

        return map;
    }

};
