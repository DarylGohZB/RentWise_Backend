const ListingModel = require('../model/ListingModel');
const ListingValidationService = require('../services/ListingValidationService');

module.exports = {
  // Test endpoint
  handleTest: async function (req) {
    return true;
  },

  /**
   * Create a new listing with validation and review status
   */
  createListing: async function (req) {
    const listingData = req.body || {};
    
    // Use authenticated user's ID as landlord_id
    const landlordId = req.user.user_id;
    listingData.landlord_id = landlordId;
    
    console.log('[CONTROLLER/LISTING] createListing attempt by authenticated user:', landlordId);

    try {
      const result = await ListingModel.createListing(listingData);
      
      if (!result.ok) {
        console.warn('[CONTROLLER/LISTING] createListing failed:', result.error);
        return { 
          status: 400, 
          body: { 
            message: result.error,
            details: result.details || []
          } 
        };
      }

      console.log('[CONTROLLER/LISTING] createListing success:', result.listingId);
      return {
        status: 201,
        body: {
          message: 'Listing created successfully',
          listingId: result.listingId,
          status: result.status,
          reviewStatus: result.reviewStatus,
          reviewMessage: result.message
        }
      };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] createListing error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Get listing by ID
   */
  getListing: async function (req) {
    const { listingId } = req.params;

    if (!listingId) {
      return { status: 400, body: { message: 'listingId is required' } };
    }

    try {
      const listing = await ListingModel.getListingById(listingId);
      
      if (!listing) {
        return { status: 404, body: { message: 'Listing not found' } };
      }

      return { status: 200, body: listing };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] getListing error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Get listings by landlord
   */
  getLandlordListings: async function (req) {
    const { landlordId } = req.params;
    const { status = 'active', limit = 50, offset = 0 } = req.query;

    if (!landlordId) {
      return { status: 400, body: { message: 'landlordId is required' } };
    }

    try {
      const listings = await ListingModel.getListingsByLandlord(
        landlordId, 
        status, 
        parseInt(limit), 
        parseInt(offset)
      );

      return { status: 200, body: listings };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] getLandlordListings error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Search listings with filters
   */
  searchListings: async function (req) {
    const { limit = 50, offset = 0 } = req.query;
    const filters = req.body || {};

    try {
      const listings = await ListingModel.searchListings(
        filters, 
        parseInt(limit), 
        parseInt(offset)
      );

      return { status: 200, body: listings };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] searchListings error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Update listing with validation and review status
   */
  updateListing: async function (req) {
    const { listingId } = req.params;
    const updateData = req.body || {};
    const userId = req.user?.user_id; // Get from authenticated user

    if (!listingId) {
      return { status: 400, body: { message: 'listingId is required' } };
    }

    if (Object.keys(updateData).length === 0) {
      return { status: 400, body: { message: 'No fields to update' } };
    }

    try {
      // Check if listing exists and verify ownership (unless user is admin)
      const listing = await ListingModel.getListingById(listingId);
      if (!listing) {
        return { status: 404, body: { message: 'Listing not found' } };
      }

      // Check ownership (unless user is admin)
      if (req.user.userRole !== 'ADMIN' && listing.landlord_id !== userId) {
        return { status: 403, body: { message: 'You can only update your own listings' } };
      }

      const result = await ListingModel.updateListing(listingId, updateData);

      if (!result.ok) {
        console.error('[CONTROLLER/LISTING] updateListing failed:', result.error);
        return { 
          status: 400, 
          body: { 
            message: result.error,
            details: result.details || []
          } 
        };
      }

      console.log('[CONTROLLER/LISTING] updateListing successful:', listingId);
      return { 
        status: 200, 
        body: { 
          message: 'Listing updated successfully',
          status: result.status,
          reviewStatus: result.reviewStatus,
          reviewMessage: result.message
        } 
      };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] updateListing error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Delete listing (with ownership verification)
   */
  deleteListing: async function (req) {
    const { listingId } = req.params;
    const landlordId = req.user?.user_id; // Get from authenticated user

    if (!listingId) {
      return { status: 400, body: { message: 'listingId is required' } };
    }

    try {
      // If user is authenticated, verify ownership
      if (landlordId) {
        const result = await ListingModel.deleteListingByLandlord(listingId, landlordId);
        
        if (result.ok) {
          console.log('[CONTROLLER/LISTING] deleteListing successful:', listingId);
          return { status: 200, body: { message: 'Listing deleted successfully' } };
        }
        
        if (result.error === 'Listing not found or not owned by landlord') {
          return { status: 403, body: { message: 'You can only delete your own listings' } };
        }
        
        console.error('[CONTROLLER/LISTING] deleteListing failed:', result.error);
        return { status: 500, body: { message: 'Failed to delete listing', error: result.error } };
      } else {
        // Fallback to admin delete (no ownership check)
        const result = await ListingModel.deleteListing(listingId);
        
        if (result.ok) {
          console.log('[CONTROLLER/LISTING] deleteListing successful:', listingId);
          return { status: 200, body: { message: 'Listing deleted successfully' } };
        }
        
        if (result.error === 'Listing not found') {
          return { status: 404, body: { message: 'Listing not found' } };
        }
        
        console.error('[CONTROLLER/LISTING] deleteListing failed:', result.error);
        return { status: 500, body: { message: 'Failed to delete listing', error: result.error } };
      }
    } catch (err) {
      console.error('[CONTROLLER/LISTING] deleteListing error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Get listing statistics for a landlord
   */
  getListingStats: async function (req) {
    const { landlordId } = req.params;

    if (!landlordId) {
      return { status: 400, body: { message: 'landlordId is required' } };
    }

    try {
      const stats = await ListingModel.getListingStats(landlordId);
      return { status: 200, body: stats };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] getListingStats error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  }
};
