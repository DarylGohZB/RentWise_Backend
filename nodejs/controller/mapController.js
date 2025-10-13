// mapController.js
const mapService = require('../services/mapService');

module.exports.handleTest = async function (req) {
  return true;
};

module.exports.getTownData = async function (req) {
  console.log('[CONTROLLER/MAPCONTROLLER] getTownData called');
  
  try {
    const result = await mapService.getTownData();
    
    if (result.ok) {
      console.log('[CONTROLLER/MAPCONTROLLER] getTownData successful:', result.data.length, 'towns');
      return {
        status: 200,
        body: result.data,
      };
    }
    
    // Handle errors
    console.error('[CONTROLLER/MAPCONTROLLER] getTownData failed:', result.error);
    return {
      status: 500,
      body: {
        message: 'Failed to retrieve town data',
        error: result.error?.message || 'Unknown error',
      },
    };
  } catch (err) {
    console.error('[CONTROLLER/MAPCONTROLLER] getTownData exception:', err);
    return {
      status: 500,
      body: {
        message: 'Internal server error',
        error: err.message || 'Unknown error',
      },
    };
  }
};
