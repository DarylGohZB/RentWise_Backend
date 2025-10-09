const express = require('express');
const router = express.Router();
const searchController = require('../controller/searchController');

// -------------------------
// Basic test endpoint
// -------------------------
router.all('/test', async (req, res) => {
  console.log('[ROUTES/SEARCH] /test called');
  try {
    const result = await searchController.handleTest(req);
    console.log('[ROUTES/SEARCH] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/SEARCH] /test error:', err);
    res.json(false);
  }
});

// -------------------------
// Government Data Endpoints
// -------------------------

router.get('/gov/count', async (req, res) => {
  console.log('[ROUTES/SEARCH] /gov/count called');
  try {
    const data = await searchController.getGovCount(req);
    console.log('[ROUTES/SEARCH] /gov/count result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/SEARCH] /gov/count error:', err);
    res.status(500).json({ error: 'Failed to read count' });
  }
});

router.get('/gov/sample', async (req, res) => {
  console.log('[ROUTES/SEARCH] /gov/sample called');
  try {
    const data = await searchController.getGovSample(req);
    console.log('[ROUTES/SEARCH] /gov/sample result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/SEARCH] /gov/sample error:', err);
    res.status(500).json({ error: 'Failed to read sample' });
  }
});

router.get('/gov/search', async (req, res) => {
  console.log('[ROUTES/SEARCH] /gov/search called');
  try {
    const data = await searchController.searchGovByTown(req);
    console.log('[ROUTES/SEARCH] /gov/search result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/SEARCH] /gov/search error:', err);
    res.status(500).json({ error: 'Failed to search' });
  }
});

router.get('/gov/towns', async (req, res) => {
  console.log('[ROUTES/SEARCH] /gov/towns called');
  try {
    const data = await searchController.rankTowns(req);
    console.log('[ROUTES/SEARCH] /gov/towns result:', data);
    res.json(data);
  } catch (err) {
    console.error('[ROUTES/SEARCH] /gov/towns error:', err);
    res.status(500).json({ error: 'Failed to list towns' });
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
