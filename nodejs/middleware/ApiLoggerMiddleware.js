const ApiLoggerModel = require('../model/ApiLoggerModel');

module.exports = function apiLogger(req, res, next) {
  const start = process.hrtime();
  let responseBody = null;

  // Patch res.send to capture response body
  const originalSend = res.send;
  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Always run this after response is finished
  res.on('finish', async () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = Math.round((seconds * 1000) + (nanoseconds / 1e6));
    const statusCode = res.statusCode;

    // Attempt to summarize records returned
    let recordSummary = '-';
    try {
      const parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
      if (Array.isArray(parsedBody)) {
        recordSummary = `${parsedBody.length} records`;
      } else if (parsedBody?.count !== undefined) {
        recordSummary = `${parsedBody.count} records`;
      }
    } catch (_) {
      // ignore JSON parsing issues
    }

    // Log errors if status is 400+
    let errorMessage = null;
    if (statusCode >= 400) {
      try {
        const parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        errorMessage = parsedBody?.error || parsedBody?.message || 'Unknown error';
      } catch (_) {
        errorMessage = 'Unknown error';
      }
    }

    // Save API activity
    try {
      await ApiLoggerModel.logApiActivity({
        operation: `${req.method} ${req.originalUrl}`,
        status: statusCode,
        recordSummary,
        duration,
        errorMessage
      });
    } catch (err) {
      console.error('[LOGGER] Failed to log API activity:', err);
    }
  });

  next();
};