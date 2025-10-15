const listingManagementService = require('../services/listingManagementService');

class ListingManagementController {
  /**
   * Test endpoint
   */
  async test(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Test endpoint called');
    try {
      res.json(true);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Test error:', error);
      res.json(false);
    }
  }

  /**
   * Get all listings pending review
   */
  async getPendingListings(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Getting pending listings');
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const result = await listingManagementService.getPendingReviewListings(limit, offset);

      res.json(result);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Error getting pending listings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pending listings'
      });
    }
  }

  /**
   * Get specific listing for review
   */
  async getListingForReview(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Getting listing for review');
    try {
      const listingId = parseInt(req.params.listingId);

      const result = await listingManagementService.getListingForReview(listingId);

      res.json(result);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Error getting listing for review:', error);

      const statusCode = error.message === 'Listing not found' ? 404 :
                        error.message === 'Invalid listing ID' ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Approve listing
   */
  async approveListing(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Approving listing');
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Request body:', req.body);
    try {
      const listingId = parseInt(req.params.listingId);
      const { review_notes } = req.body || {};

      const result = await listingManagementService.approveListing(listingId, review_notes);

      res.json(result);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Error approving listing:', error);

      const statusCode = error.message === 'Invalid listing ID' ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reject listing
   */
  async rejectListing(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Rejecting listing');
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Request body:', req.body);
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Request headers:', req.headers);
    try {
      const listingId = parseInt(req.params.listingId);
      const { review_notes } = req.body || {};

      const result = await listingManagementService.rejectListing(listingId, review_notes);

      res.json(result);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Error rejecting listing:', error);

      const statusCode = error.message.includes('required') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Request more information from landlord
   */
  async requestMoreInfo(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Requesting more info');
    try {
      const listingId = parseInt(req.params.listingId);
      const { review_notes, admin_message } = req.body;

      const result = await listingManagementService.requestMoreInfo(listingId, review_notes, admin_message);

      res.json(result);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Error requesting more info:', error);

      const statusCode = error.message === 'Listing not found' ? 404 :
                        error.message.includes('required') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get review statistics
   */
  async getStatistics(req, res) {
    console.log('[CONTROLLER/LISTING-MANAGEMENT] Getting statistics');
    try {
      const result = await listingManagementService.getReviewStatistics();

      res.json(result);
    } catch (error) {
      console.error('[CONTROLLER/LISTING-MANAGEMENT] Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = new ListingManagementController();