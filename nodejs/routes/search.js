const express = require('express');
const router = express.Router();
const searchController = require('../controller/searchController');

router.all('/test', async (req, res) => {
	try {
		const result = await searchController.handleTest(req);
		return res.json(result === true);
	} catch (err) {
		return res.json(false);
	}
});

router.get('/gov/count', async (req, res) => {
	try {
		const data = await searchController.getGovCount(req);
		return res.json(data);
	} catch (err) {
		console.error('Error in /api/search/gov/count:', err);
		return res.status(500).json({ error: 'Failed to read count' });
	}
});

router.get('/gov/sample', async (req, res) => {
	try {
		const data = await searchController.getGovSample(req);
		return res.json(data);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to read sample' });
	}
});

router.get('/gov/search', async (req, res) => {
	try {
		const data = await searchController.searchGovByTown(req);
		return res.json(data);
	} catch (err) {
		console.error('Error in /api/search/gov/search:', err);
		return res.status(500).json({ error: 'Failed to search' });
	}
});

router.get('/gov/towns', async (req, res) => {
	try {
		const data = await searchController.rankTowns(req);
		return res.json(data);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to list towns' });
	}
});

module.exports = router;
