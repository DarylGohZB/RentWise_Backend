const ApiLoggerModel = require('../model/ApiLoggerModel');

async function logApiWrapper(operationLabel, handlerFn) {
  const start = Date.now();
  let recordSummary = '-';
  let status = 'Success';
  let errorMessage = null;

  try {
    const result = await handlerFn();
    if (result?.records) {
      recordSummary = `${result.records} ${result.statusWord || 'retrieved'}`;
    }
    return result;
  } catch (err) {
    status = 'Error';
    errorMessage = err.message;
    throw err;
  } finally {
    const duration = (Date.now() - start) / 1000;
    await ApiLoggerModel.logApiActivity({
      operation: operationLabel,
      status,
      recordSummary,
      duration,
      errorMessage
    });
  }
}

// Simple passthrough logging function so callers (middleware/controllers)
// can call a service-level API instead of touching the model directly.
async function logApiActivity({ operation, status, recordSummary = '-', duration = null, errorMessage = null }) {
  return ApiLoggerModel.logApiActivity({ operation, status, recordSummary, duration, errorMessage });
}

// Expose helper to retrieve recent logs via the service layer
async function getRecentLogs(limit = 10) {
  return ApiLoggerModel.getRecentLogs(limit);
}

module.exports = { logApiWrapper, logApiActivity, getRecentLogs };