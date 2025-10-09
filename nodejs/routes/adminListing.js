const express = require('express');
const router = express.Router();
const adminListingController = require('../controller/adminListingController');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/ADMINLISTING] /test called');
  try {
    const result = await adminListingController.handleTest(req);
    console.log('[ROUTES/ADMINLISTING] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/ADMINLISTING] /test error:', err);
    res.json(false);
  }
});

module.exports = router;
