const govListingService = require('../services/govListingService');
const schedulerService = require('../services/schedulerService');

module.exports = {
  // Used for /test endpoint
  handleTest: async function (req) {
    console.log('[CONTROLLER/GOVLISTINGCONTROLLER] handleTest called');
    return true;
  },

  search: async function (req) {
    const { town, roomType, timePeriod } = req.query || {};

    console.log('[CONTROLLER/GOVLISTINGCONTROLLER] search request:', { town, roomType, timePeriod });

    // Validate required parameters
    if (!town || !roomType || !timePeriod) {
      console.warn('[CONTROLLER/GOVLISTINGCONTROLLER] search failed: missing required parameters');
      return {
        status: 400,
        body: {
          message: 'Missing required parameters: town, roomType, and timePeriod are required',
        },
      };
    }

    // Validate timePeriod is a valid integer
    const timePeriodInt = parseInt(timePeriod, 10);
    if (isNaN(timePeriodInt) || timePeriodInt < 1) {
      console.warn('[CONTROLLER/GOVLISTINGCONTROLLER] search failed: invalid timePeriod');
      return {
        status: 400,
        body: {
          message: 'timePeriod must be a positive integer (number of months)',
        },
      };
    }

    // Calculate the date range based on timePeriod (number of months back)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - timePeriodInt, 1);
    const startYearMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    
    console.log('[CONTROLLER/GOVLISTINGCONTROLLER] Searching from date:', startYearMonth);

    // Build filters for the search
    const filters = {
      town: town.toUpperCase(),
      flatType: roomType.toUpperCase(),
      startDate: startYearMonth,
      limit: 200,
    };

    // Call service to search government listings
    const result = await govListingService.searchGovListings(filters);

    if (result.ok) {
      console.log('[CONTROLLER/GOVLISTINGCONTROLLER] search successful:', result.data.length, 'listings found');
      return {
        status: 200,
        body: {
          message: result.data.length > 0 
            ? `Found ${result.data.length} government listings` 
            : 'No listings found matching the criteria',
          data: result.data,
        },
      };
    }

    // Handle errors
    console.error('[CONTROLLER/GOVLISTINGCONTROLLER] search failed:', result.error);
    return {
      status: 500,
      body: {
        message: 'Failed to search government listings',
        error: result.error?.message || 'Unknown error',
      },
    };
  },

  // Schedule data synchronization
  scheduleDataSync: async function (req) {
    console.log('[CONTROLLER/GOVLISTINGCONTROLLER] scheduleDataSync called');
    try {
      await schedulerService.scheduleDataSync();
      return {
        status: 200,
        body: {
          message: 'Data synchronization scheduled successfully',
        },
      };
    } catch (err) {
      console.error('[CONTROLLER/GOVLISTINGCONTROLLER] scheduleDataSync error:', err);
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
