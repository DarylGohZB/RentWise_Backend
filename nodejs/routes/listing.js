const express = require('express');
const router = express.Router();
const listingController = require('../controller/listingController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const { uploadMultiple, handleUploadError, getFileUrls } = require('../services/uploadService');

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

// Create a new listing with file upload (requires authentication)
router.post('/', AuthMiddleware.verifyTokenMiddleware, uploadMultiple, handleUploadError, async (req, res) => {
  console.log('[ROUTES/LISTING] POST / called');
  try {
    // Add uploaded image URLs to request body
    if (req.files && req.files.length > 0) {
      req.body.images = getFileUrls(req.files);
    }
    
    const result = await listingController.createListing(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] POST / error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all active listings (for public viewing) - MUST be before /:listingId
router.get('/', async (req, res) => {
  console.log('[ROUTES/LISTING] GET / called');
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await listingController.getAllListings(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] GET / error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Filter listings by room type, town, min/max price (public endpoint) - MUST be before /:listingId
router.get('/filter', async (req, res) => {
  console.log('[ROUTES/LISTING] GET /filter called');
  try {
    const result = await listingController.filterListings(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] GET /filter error:', err);
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

// Search listings with filters (IS THIS BEING USED?)
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

// Update listing with file upload (requires authentication)
router.put('/:listingId', AuthMiddleware.verifyTokenMiddleware, uploadMultiple, handleUploadError, async (req, res) => {
  console.log('[ROUTES/LISTING] PUT /:listingId called');
  console.log('[ROUTES/LISTING] Request body before processing:', req.body);
  console.log('[ROUTES/LISTING] Files uploaded:', req.files ? req.files.length : 0);
  try {
    // Add uploaded image URLs to request body
    if (req.files && req.files.length > 0) {
      const newImageUrls = getFileUrls(req.files);
      console.log('[ROUTES/LISTING] New image URLs:', newImageUrls);
      
      // Pass new images to controller for proper handling
      req.body.newImages = newImageUrls;
    } else if (req.body.images) {
      console.log('[ROUTES/LISTING] No files uploaded, but images in request body:', req.body.images);
    }
    
    console.log('[ROUTES/LISTING] Final request body:', req.body);
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

// Delete a specific image from a listing
router.delete('/:listingId/image/:filename', AuthMiddleware.verifyTokenMiddleware, async (req, res) => {
  console.log('[ROUTES/LISTING] DELETE /:listingId/image/:filename called');
  console.log('[ROUTES/LISTING] Listing ID:', req.params.listingId);
  console.log('[ROUTES/LISTING] Filename:', req.params.filename);
  
  try {
    const result = await listingController.deleteListingImage(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/LISTING] DELETE /:listingId/image/:filename error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
