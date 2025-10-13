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

module.exports = router;
