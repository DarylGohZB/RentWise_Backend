const express = require('express');
const router = express.Router();
const enquiryController = require('../controller/enquiryController');

// Basic test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] /test called');
  try {
    const result = await enquiryController.handleTest(req);
    console.log('[ROUTES/ENQUIRY] /test result:', result);
    res.json(result === true);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] /test error:', err);
    res.json(false);
  }
});

module.exports = router;
