const express = require('express');
const router = express.Router();
const mapController = require('../controller/mapController');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/MAP] /test called');
  try {
    const result = await mapController.handleTest(req);
    console.log('[ROUTES/MAP] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/MAP] /test error:', err);
    res.json(false);
  }
});

router.get('/recommend-town', async (req, res) => {
  try {
    const result = await mapController.recommendTown(req);
    return res.json(result);
  } catch (err) {
    console.error(err);
    const status = err && err.status ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Failed to recommend town' });
  }
});

module.exports = router;
