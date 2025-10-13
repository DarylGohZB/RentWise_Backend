const express = require('express');
const router = express.Router();
const govListingController = require('../controller/govListingController');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/GOVLISTING] /test called');
  try {
    const result = await govListingController.handleTest(req);
    console.log('[ROUTES/GOVLISTING] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/GOVLISTING] /test error:', err);
    res.json(false);
  }
});

// GET /search - Search government listings by town, roomType, and timePeriod
router.get('/search', async (req, res) => {
  console.log('[ROUTES/GOVLISTING] /search called with query:', req.query);
  try {
    const result = await govListingController.search(req);
    console.log('[ROUTES/GOVLISTING] /search result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/GOVLISTING] /search error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;

