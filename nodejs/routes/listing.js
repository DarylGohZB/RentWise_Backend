const express = require('express');
const router = express.Router();
const listingController = require('../controller/listingController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

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

// Create a new listing (requires authentication)
router.post('/', AuthMiddleware.verifyTokenMiddleware, async (req, res) => {
  console.log('[ROUTES/LISTING] POST / called');
  try {
    const result = await listingController.createListing(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] POST / error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get listing by ID
router.get('/:listingId', async (req, res) => {
  console.log('[ROUTES/LISTING] GET /:listingId called');
  try {
    const result = await listingController.getListing(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] GET /:listingId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get listings by landlord
router.get('/landlord/:landlordId', async (req, res) => {
  console.log('[ROUTES/LISTING] GET /landlord/:landlordId called');
  try {
    const result = await listingController.getLandlordListings(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] GET /landlord/:landlordId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search listings with filters
router.post('/search', async (req, res) => {
  console.log('[ROUTES/LISTING] POST /search called');
  try {
    const result = await listingController.searchListings(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] POST /search error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update listing (requires authentication)
router.put('/:listingId', AuthMiddleware.verifyTokenMiddleware, async (req, res) => {
  console.log('[ROUTES/LISTING] PUT /:listingId called');
  try {
    const result = await listingController.updateListing(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] PUT /:listingId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete listing (requires authentication)
router.delete('/:listingId', AuthMiddleware.verifyTokenMiddleware, async (req, res) => {
  console.log('[ROUTES/LISTING] DELETE /:listingId called');
  try {
    const result = await listingController.deleteListing(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] DELETE /:listingId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get listing statistics for a landlord
router.get('/stats/:landlordId', async (req, res) => {
  console.log('[ROUTES/LISTING] GET /stats/:landlordId called');
  try {
    const result = await listingController.getListingStats(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] GET /stats/:landlordId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
