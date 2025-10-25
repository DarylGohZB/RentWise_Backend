const express = require('express');
const router = express.Router();
const apiManagementController = require('../controller/apiManagementController');
const schedulerController = require('../controller/schedulerController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /test called');
  try {
    const result = await apiManagementController.handleTest(req);
    console.log('[ROUTES/API-MGMT] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /test error:', err);
    res.json(false);
  }
});

// -------------------------
// Gov Data Management Routes
// -------------------------

// Get total record count
router.get('/gov/count', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/count called');
  try {
    const data = await apiManagementController.getGovCount(req);
    console.log('[ROUTES/API-MGMT] /gov/count result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/count error:', err);
    res.status(500).json({ error: 'Failed to read count' });
  }
});

// Get sample of gov data
router.get('/gov/sample', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/sample called');
  try {
    const data = await apiManagementController.getGovSample(req);
    console.log('[ROUTES/API-MGMT] /gov/sample result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/sample error:', err);
    res.status(500).json({ error: 'Failed to read sample' });
  }
});

// Search gov data by town
router.get('/gov/search', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/search called');
  try {
    const data = await apiManagementController.searchGovByTown(req);
    console.log('[ROUTES/API-MGMT] /gov/search result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/search error:', err);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Force sync of government HDB data
router.post('/gov/sync', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/sync called');
  try {
    const data = await apiManagementController.syncGovData(req);
    console.log('[ROUTES/API-MGMT] /gov/sync result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/sync error:', err);
    res.status(500).json({ error: 'Failed to sync gov data' });
  }
});

// Update API key
router.post('/updateApiKey', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /updateApiKey called');
  try {
    const result = await apiManagementController.updateApiKey(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /updateApiKey error:', err);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// Test external DataGov API connection
router.post('/testGovtApi', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /testGovtApi called');
  try {
    const result = await apiManagementController.testGovtApiKey(req);
    console.log('[ROUTES/API-MGMT] testGovtApi result:', result);
    return res.json(result);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] testGovtApi error:', err);
    return res.status(500).json({ ok: false, message: 'Unexpected error occurred' });
  }
});

// Get API status + last sync and key update info
router.get('/gov/getApiStatus', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/getApiStatus called');
  try {
    const result = await apiManagementController.getGovtApiStatus(req);
    console.log('[ROUTES/API-MGMT] /gov/getApiStatus result:', result);
    return res.json(result);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/getApiStatus error:', err);
    return res.status(500).json({ error: 'Failed to fetch API status' });
  }
});

// Manually update API status audit info (admin use only)
router.post('/gov/updateStatus', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/status (POST) called');
  try {
    const result = await apiManagementController.updateGovApiAudit(req);
    console.log('[ROUTES/API-MGMT] /gov/status (POST) result:', result);
    return res.json(result);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/status (POST) error:', err);
    return res.status(500).json({ error: 'Failed to update audit log' });
  }
});

// Get API key (admin only)
router.get('/getApiKey', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, (req, res) => {
  const apiKey = process.env.DATA_GOV_SG_API_KEY;
  if (!apiKey) {
    return res.status(404).json({ success: false, message: 'API key not set' });
  }

  return res.json({ success: true, apiKey });
});

// Get API logs (admin only)
router.get('/getApiLogs', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  try {
    const result = await apiManagementController.getApiLogs(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] getApiLogs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get sync schedule
router.get('/getSyncSchedule', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /getSyncSchedule called');
  try {
    const result = await schedulerController.getSyncSchedule(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /getSyncSchedule error:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Update sync schedule
router.post('/updateSyncSchedule', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /updateSyncSchedule called');
  try {
    const result = await schedulerController.updateSyncSchedule(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /updateSyncSchedule error:', err);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

module.exports = router;