const express = require('express');
const router = express.Router();
const profileController = require('../controller/profileController');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/PROFILE] /test called');
  try {
    const result = await profileController.handleTest(req);
    console.log('[ROUTES/PROFILE] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/PROFILE] /test error:', err);
    res.json(false);
  }
});

module.exports = router;
