const cron = require('node-cron');
const { getSyncSchedule, getReadableLabel } = require('../model/SchedulerModel');

let currentTask = null;

async function scheduleDataSync() {
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
}

module.exports = { scheduleDataSync };
