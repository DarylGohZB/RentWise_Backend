const express = require('express');
const router = express.Router();
const listingController = require('../controller/listingController');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/LISTING] /test called');
  try {
    const result = await listingController.handleTest(req);
    console.log('[ROUTES/LISTING] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/LISTING] /test error:', err);
    res.json(false);
  }
});

module.exports = router;
