const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const apiManagementController = require('../controller/apiManagementController');
const { logGovtApiKeyUpdate } = require('../services/govtApiService');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const { scheduleDataSync } = require('../services/schedulerService');

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

module.exports = router;

// Gov data admin/management endpoints
router.get('/gov/count', async (req, res) => {
  try {
    const data = await apiManagementController.getGovCount(req);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read count' });
  }
});

router.get('/gov/sample', async (req, res) => {
  try {
    const data = await apiManagementController.getGovSample(req);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read sample' });
  }
});

router.get('/gov/search', async (req, res) => {
  try {
    const data = await apiManagementController.searchGovByTown(req);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search' });
  }
});

router.post('/updateApiKey', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /updateApiKey called');
  try {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Missing apiKey in request body' });
    }

    const envPath = path.join(__dirname, '..', '..', '.env');

    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      console.warn('[ROUTES/API-MGMT] .env not found, will create a new one.');
      envContent = '';
    }

    const keyName = 'DATA_GOV_SG_API_KEY';
    const sanitizedValue = apiKey.replace(/\r?\n/g, '').trim();

    const regexp = new RegExp(`^${keyName}=.*$`, 'm');
    if (regexp.test(envContent)) {
      envContent = envContent.replace(regexp, `${keyName}='${sanitizedValue}'`);
    } else {
      if (envContent.length && !envContent.endsWith('\n')) envContent += '\n';
      envContent += `${keyName}='${sanitizedValue}'\n`;
    }

    fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
    console.log('[ROUTES/API-MGMT] DATA_GOV_SG_API_KEY updated in .env');

    // Log last key update time in DB using the service
    const result = await logGovtApiKeyUpdate();
    if (!result.success) {
      throw new Error('Failed to log key update in DB');
    }

    return res.json({ ok: true, message: 'API key saved and last update time logged' });
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /updateApiKey error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to save API key' });
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

router.get('/getApiKey', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, (req, res) => {
  const apiKey = process.env.DATA_GOV_SG_API_KEY;
  if (!apiKey) {
    return res.status(404).json({ success: false, message: 'API key not set' });
  }

  return res.json({ success: true, apiKey });
});

router.get('/getSyncSchedule', async (req, res) => {
  const scheduleMap = getScheduleMap();
  const result = await getSyncSchedule();
  return res.json({ success: true, result, scheduleMap });
});

router.post('/updateSyncSchedule', async (req, res) => {
  const { selectedScheduleLabel } = req.body;

  const scheduleMap = getScheduleMap();
  const cronExpr = scheduleMap[selectedScheduleLabel];
  if (!cronExpr) return res.status(400).json({ success: false, message: 'Invalid schedule' });

  await saveSyncSchedule(cronExpr);
  await scheduleDataSync(); // Reschedule with new timing

  res.json({ success: true, message: 'Sync schedule updated!' });
});

router.get('/getApiLogs', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  try {
    const result = await apiManagementController.getApiLogs(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] getApiLogs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});