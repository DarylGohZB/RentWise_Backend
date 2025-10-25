const schedulerService = require('../services/schedulerService');

module.exports = {
  // Test endpoint
  handleTest: async function (req) {
    console.log('[CONTROLLER/SCHEDULERCONTROLLER] handleTest called');
    return true;
  },

  // Get current sync schedule and available schedule options
  getSyncSchedule: async function (req) {
    console.log('[CONTROLLER/SCHEDULERCONTROLLER] getSyncSchedule called');
    try {
      const result = await schedulerService.getSyncSchedule();
      return {
        status: 200,
        body: {
          success: true,
          result: result.currentSchedule,
          scheduleMap: result.scheduleMap
        }
      };
    } catch (err) {
      console.error('[CONTROLLER/SCHEDULERCONTROLLER] getSyncSchedule error:', err);
      return {
        status: 500,
        body: {
          success: false,
          message: 'Failed to get sync schedule',
          error: err.message || 'Unknown error'
        }
      };
    }
  },

  // Update sync schedule
  updateSyncSchedule: async function (req) {
    console.log('[CONTROLLER/SCHEDULERCONTROLLER] updateSyncSchedule called');
    try {
      const { selectedScheduleLabel } = req.body || {};
      
      if (!selectedScheduleLabel) {
        return {
          status: 400,
          body: {
            success: false,
            message: 'selectedScheduleLabel is required'
          }
        };
      }

      const result = await schedulerService.updateSyncSchedule(selectedScheduleLabel);
      
      if (result.ok) {
        return {
          status: 200,
          body: {
            success: true,
            message: 'Sync schedule updated successfully'
          }
        };
      } else {
        return {
          status: 400,
          body: {
            success: false,
            message: result.error || 'Failed to update sync schedule'
          }
        };
      }
    } catch (err) {
      console.error('[CONTROLLER/SCHEDULERCONTROLLER] updateSyncSchedule error:', err);
      return {
        status: 500,
        body: {
          success: false,
          message: 'Failed to update sync schedule',
          error: err.message || 'Unknown error'
        }
      };
    }
  },

  // Schedule data synchronization
  scheduleDataSync: async function (req) {
    console.log('[CONTROLLER/SCHEDULERCONTROLLER] scheduleDataSync called');
    try {
      await schedulerService.scheduleDataSync();
      return {
        status: 200,
        body: {
          message: 'Data synchronization scheduled successfully',
        },
      };
    } catch (err) {
      console.error('[CONTROLLER/SCHEDULERCONTROLLER] scheduleDataSync error:', err);
      return {
        status: 500,
        body: {
          message: 'Failed to schedule data synchronization',
          error: err.message || 'Unknown error',
        },
      };
    }
  },
};
