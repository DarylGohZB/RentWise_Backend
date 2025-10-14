const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/AuthMiddleware');
const { uploadMultiple, handleUploadError, getFileUrls } = require('../services/uploadService');

// Upload images for listing (authenticated users only)
router.post('/images', AuthMiddleware.verifyTokenMiddleware, uploadMultiple, handleUploadError, async (req, res) => {
  console.log('[ROUTES/UPLOAD] POST /images called');
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images uploaded'
      });
    }

    const imageUrls = getFileUrls(req.files);
    
    console.log('[ROUTES/UPLOAD] Images uploaded successfully:', imageUrls.length);
    
    res.json({
      success: true,
      message: `${imageUrls.length} image(s) uploaded successfully`,
      images: imageUrls,
      count: imageUrls.length
    });
  } catch (err) {
    console.error('[ROUTES/UPLOAD] POST /images error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
});

// Upload single image (for testing)
router.post('/image', AuthMiddleware.verifyTokenMiddleware, (req, res) => {
  const { uploadSingle, handleUploadError } = require('../services/uploadService');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, () => {});
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image: imageUrl
    });
  });
});

module.exports = router;
