const listingService = require('../services/listingService');
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
      const result = await listingService.createListing(listingData);
      
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
      const listing = await listingService.getListingById(listingId);
      
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
   * Get all active listings
   */
  getAllListings: async function (req) {
    const { limit = 50, offset = 0 } = req.query;
    try {
      const listings = await listingService.getAllListings(
        parseInt(limit),
        parseInt(offset)
      );
      return { status: 200, body: listings };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] getAllListings error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Get listings by landlord
   */
  getLandlordListings: async function (req) {
    console.log('[CONTROLLER/LISTING] getLandlordListings called');
    const { landlordId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    
    console.log('[CONTROLLER/LISTING] getLandlordListings params:', { landlordId, status, limit, offset });

    if (!landlordId) {
      return { status: 400, body: { message: 'landlordId is required' } };
    }

    try {
      console.log('[CONTROLLER/LISTING] Calling listingService.getListingsByLandlord...');
      const listings = await listingService.getListingsByLandlord(
        landlordId, 
        status, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      console.log('[CONTROLLER/LISTING] getListingsByLandlord returned:', listings.length, 'listings');

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
      const listings = await listingService.searchListings(
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
      const listing = await listingService.getListingById(listingId);
      if (!listing) {
        return { status: 404, body: { message: 'Listing not found' } };
      }

      // Check ownership (unless user is admin)
      if (req.user.userRole !== 'ADMIN' && listing.landlord_id !== userId) {
        return { status: 403, body: { message: 'You can only update your own listings' } };
      }

      // Handle image merging if new images are provided
      if (updateData.newImages) {
        console.log('[CONTROLLER/LISTING] Handling image merging for listing:', listingId);
        
        // Get existing images
        let existingImages = listing.images || [];
        
        // Parse existing images if it's a JSON string
        if (typeof existingImages === 'string') {
          try {
            existingImages = JSON.parse(existingImages);
          } catch (e) {
            console.log('[CONTROLLER/LISTING] Failed to parse existing images JSON:', e);
            existingImages = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(existingImages)) {
          existingImages = [];
        }
        
        console.log('[CONTROLLER/LISTING] Existing images:', existingImages);
        console.log('[CONTROLLER/LISTING] New images:', updateData.newImages);
        
        // Merge new images with existing images
        const allImages = [...existingImages, ...updateData.newImages];
        
        // Remove duplicates
        const uniqueImages = [...new Set(allImages)];
        
        console.log('[CONTROLLER/LISTING] Merged images:', uniqueImages);
        
        // Check total image count
        if (uniqueImages.length > 5) {
          return { 
            status: 400, 
            body: { 
              message: "Failed to update listing. You cannot have more than 5 images." 
            } 
          };
        }
        
        // Replace newImages with the merged images
        updateData.images = uniqueImages;
        delete updateData.newImages; // Remove the temporary field
      } else if (updateData.images) {
        // If images are sent directly (not as newImages), check if we need to merge
        console.log('[CONTROLLER/LISTING] Images sent directly, checking if merging needed');
        
        // Get existing images
        let existingImages = listing.images || [];
        
        // Parse existing images if it's a JSON string
        if (typeof existingImages === 'string') {
          try {
            existingImages = JSON.parse(existingImages);
          } catch (e) {
            console.log('[CONTROLLER/LISTING] Failed to parse existing images JSON:', e);
            existingImages = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(existingImages)) {
          existingImages = [];
        }
        
        console.log('[CONTROLLER/LISTING] Existing images:', existingImages);
        console.log('[CONTROLLER/LISTING] Frontend sent images:', updateData.images);
        
        // Check if frontend sent images are a subset of existing images (replacement)
        // or if they're new images that need merging
        const frontendImages = Array.isArray(updateData.images) ? updateData.images : [updateData.images];
        
        // If frontend images are all new (not in existing), merge them
        const newImages = frontendImages.filter(img => !existingImages.includes(img));
        
        if (newImages.length > 0) {
          console.log('[CONTROLLER/LISTING] Found new images to merge:', newImages);
          
          // Merge new images with existing
          const allImages = [...existingImages, ...newImages];
          const uniqueImages = [...new Set(allImages)];
          
          console.log('[CONTROLLER/LISTING] Merged images:', uniqueImages);
          
          // Check total image count
          if (uniqueImages.length > 5) {
            return { 
              status: 400, 
              body: { 
                message: "Failed to update listing. You cannot have more than 5 images." 
              } 
            };
          }
          
          updateData.images = uniqueImages;
        } else {
          console.log('[CONTROLLER/LISTING] No new images found, using frontend images as-is');
        }
      }

      const result = await listingService.updateListing(listingId, updateData);

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
        const result = await listingService.deleteListingByLandlord(listingId, landlordId);
        
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
        const result = await listingService.deleteListing(listingId);
        
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
      const stats = await listingService.getListingStats(landlordId);
      return { status: 200, body: stats };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] getListingStats error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Delete specific image from listing
   */
  deleteListingImage: async function (req) {
    const { listingId, filename } = req.params;
    const userId = req.user?.user_id;
    const userRole = req.user?.userRole;

    if (!listingId || !filename) {
      return { status: 400, body: { message: 'Listing ID and filename are required' } };
    }

    try {
      const result = await listingService.deleteListingImage(listingId, filename, userId, userRole);
      
      if (result.ok) {
        return { 
          status: 200, 
          body: {
            message: result.message,
            remainingImages: result.remainingImages,
            images: result.images
          }
        };
      } else {
        return { 
          status: result.error.includes('not found') ? 404 : 
                 result.error.includes('only delete') ? 403 : 500, 
          body: { message: result.error }
        };
      }
    } catch (err) {
      console.error('[CONTROLLER/LISTING] deleteListingImage error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  }
};
