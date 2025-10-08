const express = require('express');
const router = express.Router();
const apiManagementController = require('../controller/apiManagementController');

router.all('/test', async (req, res) => {
	try {
		const result = await apiManagementController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
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