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

// Create a new enquiry
router.post('/', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] POST / called');
  try {
    const result = await enquiryController.createEnquiry(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] POST / error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get enquiries for a landlord
router.get('/landlord/:landlordId', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] GET /landlord/:landlordId called');
  try {
    const result = await enquiryController.getLandlordEnquiries(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] GET /landlord/:landlordId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
