const pool = require('../db/config');

module.exports = {
    getScheduleMap() {
        const scheduleMap = {
            'Every 6 hours': '0 */6 * * *',
            'Daily at 2:00 AM': '0 2 * * *',
            'Weekly on Sunday': '0 2 * * 0',
            'Monthly': '0 2 1 * *'
        };

        return scheduleMap;
    },

    /**
     * Get current cron expression from DB
     */
    async getSyncSchedule() {
        try {
            const [rows] = await pool.execute(`SELECT cron_expression FROM scheduled_operations LIMIT 1`);
            return rows[0]?.cron_expression || '0 2 * * *'; // fallback to 2 AM
        } catch (error) {
            console.error('[SCHEDULER-MODEL] Error getting sync schedule:', error.message);
            console.log('[SCHEDULER-MODEL] Using default schedule: 0 2 * * * (Daily at 2:00 AM)');
            return '0 2 * * *'; // fallback to 2 AM
        }
    },

    /**
     * Save or update cron expression in DB
     */
    async saveSyncSchedule(cronExpression) {
        const [rows] = await pool.execute(`SELECT COUNT(*) AS count FROM scheduled_operations`);
        if (rows[0].count === 0) {
            await pool.execute(`INSERT INTO scheduled_operations (cron_expression) VALUES (?)`, [cronExpression]);
        } else {
            await pool.execute(`UPDATE scheduled_operations SET cron_expression = ?`, [cronExpression]);
        }
    },

    getReadableLabel(cronExpression) {
        const scheduleMap = module.exports.getScheduleMap(); // safe direct reference
        const entry = Object.entries(scheduleMap).find(([label, expr]) => expr === cronExpression);
        return entry ? entry[0] : 'Custom Schedule';
    }
};
