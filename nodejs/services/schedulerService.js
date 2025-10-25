const cron = require('node-cron');
const SchedulerModel = require('../model/SchedulerModel');

let currentTask = null;

async function scheduleDataSync() {
  try {
    const cronExpr = await SchedulerModel.getSyncSchedule(); // e.g. "0 2 * * *"

    if (cron.validate(cronExpr)) {
      if (currentTask) {
        currentTask.stop();
      }

      currentTask = cron.schedule(cronExpr, async () => {
        console.log('[SCHEDULER] Running scheduled gov data sync at', new Date());
        //await performSync(); // Your actual sync logic
      });

      const label = SchedulerModel.getReadableLabel(cronExpr);
      console.log(`[SCHEDULER] Scheduled sync gov data with cron: ${cronExpr} (${label})`);
    } else {
      console.error('[SCHEDULER] Invalid cron expression:', cronExpr);
    }
  } catch (error) {
    console.error('[SCHEDULER] Failed to schedule data sync:', error.message);
    console.log('[SCHEDULER] Scheduler disabled due to database error');
  }
}

// Get current sync schedule and available schedule options
async function getSyncSchedule() {
  try {
    const currentSchedule = await SchedulerModel.getSyncSchedule();
    const scheduleMap = SchedulerModel.getScheduleMap();
    
    return {
      ok: true,
      currentSchedule,
      scheduleMap
    };
  } catch (error) {
    console.error('[SCHEDULER-SERVICE] Failed to get sync schedule:', error.message);
    return {
      ok: false,
      error: error.message
    };
  }
}

// Update sync schedule
async function updateSyncSchedule(selectedScheduleLabel) {
  try {
    const scheduleMap = SchedulerModel.getScheduleMap();
    const cronExpr = scheduleMap[selectedScheduleLabel];
    
    if (!cronExpr) {
      return {
        ok: false,
        error: 'Invalid schedule label'
      };
    }

    // Save the new schedule to database
    await SchedulerModel.saveSyncSchedule(cronExpr);
    
    // Reschedule the data sync with new timing
    await scheduleDataSync();
    
    console.log(`[SCHEDULER-SERVICE] Updated sync schedule to: ${cronExpr} (${selectedScheduleLabel})`);
    
    return {
      ok: true,
      message: 'Sync schedule updated successfully'
    };
  } catch (error) {
    console.error('[SCHEDULER-SERVICE] Failed to update sync schedule:', error.message);
    return {
      ok: false,
      error: error.message
    };
  }
}

module.exports = { 
  scheduleDataSync,
  getSyncSchedule,
  updateSyncSchedule
};
