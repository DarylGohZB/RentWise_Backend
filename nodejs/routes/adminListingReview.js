const express = require('express');
const router = express.Router();
const ListingModel = require('../model/ListingModel');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// Test endpoint
router.all('/test', async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /test called');
  try {
    res.json(true);
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /test error:', err);
    res.json(false);
  }
});

// Get all listings pending review (Admin only)
router.get('/pending', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /pending called');
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const listings = await ListingModel.getPendingReviewListings(limit, offset);
    
    res.json({
      success: true,
      listings,
      count: listings.length,
      limit,
      offset
    });
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /pending error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending listings'
    });
  }
});

// Get specific listing for review (Admin only)
router.get('/review/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /review/:listingId called');
  try {
    const listingId = parseInt(req.params.listingId);
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    const listing = await ListingModel.getListingById(listingId);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    res.json({
      success: true,
      listing
    });
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /review/:listingId error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listing'
    });
  }
});

// Approve listing (Admin only)
router.post('/approve/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /approve/:listingId called');
  console.log('[ROUTES/ADMIN-LISTING] Request body:', req.body);
  try {
    const listingId = parseInt(req.params.listingId);
    const { review_notes } = req.body || {};
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    const result = await ListingModel.updateListingReview(listingId, {
      review_status: 'approved',
      review_notes: review_notes || 'Listing approved by admin'
    });
    
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Listing approved successfully',
      listingId,
      status: result.status,
      reviewStatus: result.reviewStatus
    });
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /approve/:listingId error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to approve listing'
    });
  }
});

// Reject listing (Admin only)
router.post('/reject/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /reject/:listingId called');
  console.log('[ROUTES/ADMIN-LISTING] Request body:', req.body);
  console.log('[ROUTES/ADMIN-LISTING] Request headers:', req.headers);
  try {
    const listingId = parseInt(req.params.listingId);
    const { review_notes } = req.body || {};
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    if (!review_notes) {
      return res.status(400).json({
        success: false,
        error: 'Review notes are required for rejection'
      });
    }
    
    const result = await ListingModel.updateListingReview(listingId, {
      review_status: 'rejected',
      review_notes
    });
    
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Listing rejected successfully',
      listingId,
      status: result.status,
      reviewStatus: result.reviewStatus
    });
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /reject/:listingId error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reject listing'
    });
  }
});

// Request more information from landlord (Admin only) - sends email notification
router.post('/request-info/:listingId', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /request-info/:listingId called');
  try {
    const listingId = parseInt(req.params.listingId);
    const { review_notes, admin_message } = req.body;
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    if (!review_notes) {
      return res.status(400).json({
        success: false,
        error: 'Review notes are required when requesting more information'
      });
    }
    
    // Get listing details with landlord info
    const listing = await ListingModel.getListingById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Update listing review status
    const result = await ListingModel.updateListingReview(listingId, {
      review_status: 'needs_info',
      review_notes
    });
    
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    // Send email notification to landlord (if email service is available)
    let emailSent = false;
    try {
      if (!listing.landlord_email) {
        console.warn(`[ADMIN] No email found for landlord of listing ${listingId}`);
        throw new Error('No landlord email available');
      }
      
      const MailService = require('../services/MailService');
      const subject = `RentWise: Additional Information Required for Your Listing`;
      const message = `
Dear Landlord,

We need additional information for your property listing "${listing.title}" (Listing ID: ${listingId}).

Admin Message: ${admin_message || 'Please provide additional details as requested.'}

Review Notes: ${review_notes}

Please log in to your account and update your listing with the requested information.

Best regards,
RentWise Admin Team
      `;
      
      await MailService.sendEmail(listing.landlord_email, subject, message);
      emailSent = true;
      console.log(`[ADMIN] Email sent to landlord ${listing.landlord_email} for listing ${listingId}`);
    } catch (emailErr) {
      console.error('[ADMIN] Failed to send email notification:', emailErr.message);
      emailSent = false;
      // Don't fail the request if email fails
    }
    
    res.json({
      success: true,
      message: 'More information requested from landlord',
      listingId,
      status: result.status,
      reviewStatus: result.reviewStatus,
      emailSent: emailSent
    });
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /request-info/:listingId error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to request more information'
    });
  }
});

// Get review statistics (Admin only)
router.get('/stats', AuthMiddleware.verifyTokenMiddleware, AuthMiddleware.isAdmin, async (req, res) => {
  console.log('[ROUTES/ADMIN-LISTING] /stats called');
  try {
    const pool = require('../services/db');
    
    // Get overall statistics
    const [overallStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_listings,
        SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
        SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) as approved_listings,
        SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) as rejected_listings,
        SUM(CASE WHEN review_status = 'needs_info' THEN 1 ELSE 0 END) as needs_info_listings
      FROM listings
    `);
    
    // Get recent activity (last 7 days)
    const [recentActivity] = await pool.execute(`
      SELECT 
        DATE(created_date) as date,
        COUNT(*) as created_count,
        SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM listings 
      WHERE created_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_date)
      ORDER BY date DESC
    `);
    
    res.json({
      success: true,
      stats: {
        overall: overallStats[0],
        recentActivity
      }
    });
  } catch (err) {
    console.error('[ROUTES/ADMIN-LISTING] /stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
