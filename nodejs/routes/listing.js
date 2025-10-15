const express = require('express');
const router = express.Router();
const listingController = require('../controller/listingController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const { uploadMultiple, handleUploadError, getFileUrls } = require('../services/uploadService');
const ListingModel = require('../model/ListingModel');

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
      
      // Always merge with existing images when uploading new files
      const existingListing = await ListingModel.getListingById(req.params.listingId);
      console.log('[ROUTES/LISTING] Retrieved existing listing:', existingListing);
      
      if (existingListing) {
        let existingImages = existingListing.images || [];
        
        // Parse images if it's a JSON string
        if (typeof existingImages === 'string') {
          try {
            existingImages = JSON.parse(existingImages);
          } catch (e) {
            console.log('[ROUTES/LISTING] Failed to parse images JSON:', e);
            existingImages = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(existingImages)) {
          existingImages = [];
        }
        
        console.log('[ROUTES/LISTING] Existing images (raw):', existingListing.images);
        console.log('[ROUTES/LISTING] Existing images (parsed):', existingImages);
        console.log('[ROUTES/LISTING] Type of existing images:', typeof existingImages);
        
        const allImages = [...existingImages, ...newImageUrls];
        
        console.log('[ROUTES/LISTING] All images after merge:', allImages);
        
        // Check total image count
        if (allImages.length > 5) {
          return res.status(400).json({
            message: "Failed to update listing. You cannot have more than 5 images."
          });
        }
        
        req.body.images = allImages;
        console.log('[ROUTES/LISTING] Final merged images:', req.body.images);
      } else {
        req.body.images = newImageUrls;
      }
    } else if (req.body.images) {
      // If no files uploaded but images are in request body, merge with existing
      console.log('[ROUTES/LISTING] No files uploaded, but images in request body:', req.body.images);
      
      const existingListing = await ListingModel.getListingById(req.params.listingId);
      if (existingListing) {
        let existingImages = existingListing.images || [];
        
        // Parse images if it's a JSON string
        if (typeof existingImages === 'string') {
          try {
            existingImages = JSON.parse(existingImages);
          } catch (e) {
            console.log('[ROUTES/LISTING] Failed to parse images JSON:', e);
            existingImages = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(existingImages)) {
          existingImages = [];
        }
        
        console.log('[ROUTES/LISTING] Frontend sent images:', req.body.images);
        console.log('[ROUTES/LISTING] Existing images:', existingImages);
        
        // Merge frontend images with existing images
        const frontendImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        const allImages = [...existingImages, ...frontendImages];
        
        // Remove duplicates
        const uniqueImages = [...new Set(allImages)];
        
        console.log('[ROUTES/LISTING] All images after merge:', uniqueImages);
        
        // Check total image count
        if (uniqueImages.length > 5) {
          return res.status(400).json({
            message: "Failed to update listing. You cannot have more than 5 images."
          });
        }
        
        req.body.images = uniqueImages;
        console.log('[ROUTES/LISTING] Final merged images:', req.body.images);
      }
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
    const { listingId, filename } = req.params;
    
    // Validate parameters
    if (!listingId || !filename) {
      return res.status(400).json({
        message: 'Listing ID and filename are required'
      });
    }
    
    // Get the current listing
    const existingListing = await ListingModel.getListingById(listingId);
    if (!existingListing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }
    
    // Check ownership (only owner or admin can delete images)
    if (req.user.role !== 'ADMIN' && existingListing.landlord_id !== req.user.user_id) {
      return res.status(403).json({
        message: 'You can only delete images from your own listings'
      });
    }
    
    // Parse existing images
    let existingImages = existingListing.images || [];
    if (typeof existingImages === 'string') {
      try {
        existingImages = JSON.parse(existingImages);
      } catch (e) {
        console.log('[ROUTES/LISTING] Failed to parse images JSON:', e);
        existingImages = [];
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(existingImages)) {
      existingImages = [];
    }
    
    console.log('[ROUTES/LISTING] Current images:', existingImages);
    
    // Check if the image exists in the listing
    const imageToRemove = `/uploads/${filename}`;
    const imageIndex = existingImages.indexOf(imageToRemove);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        message: 'Image not found in this listing'
      });
    }
    
    // Remove the image from the array
    const updatedImages = existingImages.filter(img => img !== imageToRemove);
    
    console.log('[ROUTES/LISTING] Updated images after removal:', updatedImages);
    
    // Update the listing with the new images array
    const updateData = {
      images: updatedImages
    };
    
    const result = await ListingModel.updateListing(listingId, updateData);
    
    if (result.ok) {
      console.log('[ROUTES/LISTING] Image deleted successfully');
      res.status(200).json({
        message: 'Image deleted successfully',
        remainingImages: updatedImages.length,
        images: updatedImages
      });
    } else {
      console.error('[ROUTES/LISTING] Failed to update listing after image deletion:', result.error);
      res.status(500).json({
        message: 'Failed to delete image. Please try again.'
      });
    }
    
  } catch (err) {
    console.error('[ROUTES/LISTING] DELETE /:listingId/image/:filename error:', err);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;
