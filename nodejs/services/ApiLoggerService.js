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

module.exports = { logApiWrapper };