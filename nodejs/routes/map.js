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

// GET /towndata - Get all towns with coordinates, prices, and colors
router.get('/towndata', async (req, res) => {
  console.log('[ROUTES/MAP] /towndata called');
  try {
    const result = await mapController.getTownData(req);
    console.log('[ROUTES/MAP] /towndata result:', result.status || 200);
    res.status(result.status || 200).json(result.body);
  } catch (err) {
    console.error('[ROUTES/MAP] /towndata error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;
