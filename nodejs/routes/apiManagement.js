const express = require('express');
const router = express.Router();
const apiManagementController = require('../controller/apiManagementController');

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

// Rank towns
router.get('/gov/towns', async (req, res) => {
  console.log('[ROUTES/API-MGMT] /gov/towns called');
  try {
    const data = await apiManagementController.rankTowns(req);
    console.log('[ROUTES/API-MGMT] /gov/towns result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/API-MGMT] /gov/towns error:', err);
    res.status(500).json({ error: 'Failed to list towns' });
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

router.get('/gov/towns', async (req, res) => {
	try {
		const data = await apiManagementController.rankTowns(req);
		return res.json(data);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to list towns' });
	}
});

router.post('/gov/sync', async (req, res) => {
	try {
		const data = await apiManagementController.syncGovData(req);
		return res.json(data);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to sync gov data' });
	}
});