const cron = require('node-cron');
const { getSyncSchedule, getReadableLabel } = require('../model/SchedulerModel');

let currentTask = null;

async function scheduleDataSync() {
  try {
    const cronExpr = await getSyncSchedule(); // e.g. "0 2 * * *"

    if (cron.validate(cronExpr)) {
      if (currentTask) {
        currentTask.stop();
      }

      currentTask = cron.schedule(cronExpr, async () => {
        console.log('[SCHEDULER] Running scheduled gov data sync at', new Date());
        //await performSync(); // Your actual sync logic
      });

      const label = getReadableLabel(cronExpr);
      console.log(`[SCHEDULER] Scheduled sync gov data with cron: ${cronExpr} (${label})`);
    } else {
      console.error('[SCHEDULER] Invalid cron expression:', cronExpr);
    }
  } catch (error) {
    console.error('[SCHEDULER] Failed to schedule data sync:', error.message);
    console.log('[SCHEDULER] Scheduler disabled due to database error');
  }
}

module.exports = { scheduleDataSync };
