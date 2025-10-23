const ListingModel = require('../model/ListingModel');
const MailService = require('./MailService');
class ListingManagementService {
  /**
   * Get all listings pending review
   */
  async getPendingReviewListings(limit = 50, offset = 0) {
    console.log('[SERVICE/LISTING-MANAGEMENT] Getting pending review listings');
    try {
      const listings = await ListingModel.getPendingReviewListings(limit, offset);
      return {
        success: true,
        listings,
        count: listings.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error getting pending listings:', error);
      throw new Error('Failed to fetch pending listings');
    }
  }

  /**
   * Get specific listing for review
   */
  async getListingForReview(listingId) {
    console.log('[SERVICE/LISTING-MANAGEMENT] Getting listing for review:', listingId);
    try {
      if (!listingId || isNaN(listingId)) {
        throw new Error('Invalid listing ID');
      }

      const listing = await ListingModel.getListingById(parseInt(listingId));

      if (!listing) {
        throw new Error('Listing not found');
      }

      return {
        success: true,
        listing
      };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error getting listing for review:', error);
      throw error;
    }
  }

  /**
   * Approve a listing
   */
  async approveListing(listingId, reviewNotes = 'Listing approved by admin') {
    console.log('[SERVICE/LISTING-MANAGEMENT] Approving listing:', listingId);
    try {
      if (!listingId || isNaN(listingId)) {
        throw new Error('Invalid listing ID');
      }

      const result = await ListingModel.updateListingReview(parseInt(listingId), {
        review_status: 'approved',
        review_notes: reviewNotes
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to approve listing');
      }

      return {
        success: true,
        message: 'Listing approved successfully',
        listingId: parseInt(listingId),
        status: result.status,
        reviewStatus: result.reviewStatus
      };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error approving listing:', error);
      throw error;
    }
  }

  /**
   * Reject a listing
   */
  async rejectListing(listingId, reviewNotes) {
    console.log('[SERVICE/LISTING-MANAGEMENT] Rejecting listing:', listingId);
    try {
      if (!listingId || isNaN(listingId)) {
        throw new Error('Invalid listing ID');
      }

      if (!reviewNotes) {
        throw new Error('Review notes are required for rejection');
      }

      const result = await ListingModel.updateListingReview(parseInt(listingId), {
        review_status: 'rejected',
        review_notes: reviewNotes
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to reject listing');
      }

      return {
        success: true,
        message: 'Listing rejected successfully',
        listingId: parseInt(listingId),
        status: result.status,
        reviewStatus: result.reviewStatus
      };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error rejecting listing:', error);
      throw error;
    }
  }

  /**
   * Request more information from landlord
   */
  async requestMoreInfo(listingId, reviewNotes, adminMessage = '') {
    console.log('[SERVICE/LISTING-MANAGEMENT] Requesting more info for listing:', listingId);
    try {
      if (!listingId || isNaN(listingId)) {
        throw new Error('Invalid listing ID');
      }

      if (!reviewNotes) {
        throw new Error('Review notes are required when requesting more information');
      }

      // Get listing details with landlord info
      const listing = await ListingModel.getListingById(parseInt(listingId));
      if (!listing) {
        throw new Error('Listing not found');
      }

      // Update listing review status
      const result = await ListingModel.updateListingReview(parseInt(listingId), {
        review_status: 'needs_info',
        review_notes: reviewNotes
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to update listing status');
      }

      // Send email notification to landlord
      let emailSent = false;
      try {
        if (!listing.landlord_email) {
          console.warn(`[SERVICE/LISTING-MANAGEMENT] No email found for landlord of listing ${listingId}`);
          throw new Error('No landlord email available');
        }


        const subject = `RentWise: Additional Information Required for Your Listing`;
        const message = `
Dear Landlord,

We need additional information for your property listing "${listing.title}" (Listing ID: ${listingId}).

Admin Message: ${adminMessage || 'Please provide additional details as requested.'}

Review Notes: ${reviewNotes}

Please log in to your account and update your listing with the requested information.

Best regards,
RentWise Admin Team
        `;

        await MailService.sendEmail(listing.landlord_email, subject, message);
        emailSent = true;
        console.log(`[SERVICE/LISTING-MANAGEMENT] Email sent to landlord ${listing.landlord_email} for listing ${listingId}`);
      } catch (emailErr) {
        console.error('[SERVICE/LISTING-MANAGEMENT] Failed to send email notification:', emailErr.message);
        emailSent = false;
        // Don't fail the request if email fails
      }

      return {
        success: true,
        message: 'More information requested from landlord',
        listingId: parseInt(listingId),
        status: result.status,
        reviewStatus: result.reviewStatus,
        emailSent
      };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error requesting more info:', error);
      throw error;
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStatistics() {
    console.log('[SERVICE/LISTING-MANAGEMENT] Getting review statistics');
    try {
      const ListingModel = require('../model/ListingModel');
      const stats = await ListingModel.getReviewStatistics();

      if (!stats.ok) {
        throw stats.error || new Error('Failed to fetch statistics from model');
      }

      return {
        success: true,
        stats: {
          overall: stats.overall || {},
          recentActivity: stats.recentActivity || []
        }
      };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error getting statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  /**
   * Count listings added today (SGT)
   */
  async countListingsToday() {
    console.log('[SERVICE/LISTING-MANAGEMENT] Counting listings created today');
    try {
      const count = await ListingModel.countTodayListings();
      return { success: true, count };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error counting today\'s listings:', error);
      throw new Error('Failed to count today\'s listings');
    }
  }

  /**
   * Count all listings
   */
  async countAllListings() {
    console.log('[SERVICE/LISTING-MANAGEMENT] Counting all listings');
    try {
      const count = await ListingModel.countAllListings();
      return { success: true, count };
    } catch (error) {
      console.error('[SERVICE/LISTING-MANAGEMENT] Error counting all listings:', error);
      throw new Error('Failed to count all listings');
    }
  }
}

module.exports = new ListingManagementService();