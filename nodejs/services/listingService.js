const ListingModel = require('../model/ListingModel');
const ListingValidationService = require('./ListingValidationService');

class ListingService {
  /**
   * Create a new listing with validation and review status
   */
  async createListing(listingData) {
    console.log('[SERVICE/LISTING] createListing called');
    try {
      const result = await ListingModel.createListing(listingData);
      return result;
    } catch (error) {
      console.error('[SERVICE/LISTING] createListing error:', error);
      throw error;
    }
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId) {
    console.log('[SERVICE/LISTING] getListingById called:', listingId);
    try {
      const listing = await ListingModel.getListingById(listingId);
      return listing;
    } catch (error) {
      console.error('[SERVICE/LISTING] getListingById error:', error);
      throw error;
    }
  }

  /**
   * Get all active listings
   */
  async getAllListings(limit = 50, offset = 0) {
    console.log('[SERVICE/LISTING] getAllListings called');
    try {
      const listings = await ListingModel.getAllListings(limit, offset);
      return listings;
    } catch (error) {
      console.error('[SERVICE/LISTING] getAllListings error:', error);
      throw error;
    }
  }

  /**
   * Get listings by landlord
   */
  async getListingsByLandlord(landlordId, status = null, limit = 50, offset = 0) {
    console.log('[SERVICE/LISTING] getListingsByLandlord called:', landlordId, status, limit, offset);
    try {
      const listings = await ListingModel.getListingsByLandlord(landlordId, status, limit, offset);
      return listings;
    } catch (error) {
      console.error('[SERVICE/LISTING] getListingsByLandlord error:', error);
      throw error;
    }
  }

  /**
   * Search listings with filters
   */
  async searchListings(filters) {
    console.log('[SERVICE/LISTING] searchListings called with filters:', filters);
    try {
      const listings = await ListingModel.searchListings(filters);
      return listings;
    } catch (error) {
      console.error('[SERVICE/LISTING] searchListings error:', error);
      throw error;
    }
  }

  /**
   * Update listing with validation and review status
   */
  async updateListing(listingId, updateData) {
    console.log('[SERVICE/LISTING] updateListing called:', listingId);
    try {
      const result = await ListingModel.updateListing(listingId, updateData);
      return result;
    } catch (error) {
      console.error('[SERVICE/LISTING] updateListing error:', error);
      throw error;
    }
  }

  /**
   * Delete listing by landlord
   */
  async deleteListingByLandlord(listingId, landlordId) {
    console.log('[SERVICE/LISTING] deleteListingByLandlord called:', listingId, landlordId);
    try {
      const result = await ListingModel.deleteListingByLandlord(listingId, landlordId);
      return result;
    } catch (error) {
      console.error('[SERVICE/LISTING] deleteListingByLandlord error:', error);
      throw error;
    }
  }

  /**
   * Delete listing (admin only)
   */
  async deleteListing(listingId) {
    console.log('[SERVICE/LISTING] deleteListing called:', listingId);
    try {
      const result = await ListingModel.deleteListing(listingId);
      return result;
    } catch (error) {
      console.error('[SERVICE/LISTING] deleteListing error:', error);
      throw error;
    }
  }

  /**
   * Get listing statistics for landlord
   */
  async getListingStats(landlordId) {
    console.log('[SERVICE/LISTING] getListingStats called:', landlordId);
    try {
      const stats = await ListingModel.getListingStats(landlordId);
      return stats;
    } catch (error) {
      console.error('[SERVICE/LISTING] getListingStats error:', error);
      throw error;
    }
  }

  /**
   * Delete specific image from listing
   */
  async deleteListingImage(listingId, filename, userId, userRole) {
    console.log('[SERVICE/LISTING] deleteListingImage called:', listingId, filename);
    try {
      // Get the current listing
      const existingListing = await ListingModel.getListingById(listingId);
      if (!existingListing) {
        return { ok: false, error: 'Listing not found' };
      }

      // Check ownership (only owner or admin can delete images)
      if (userRole !== 'ADMIN' && existingListing.landlord_id !== userId) {
        return { ok: false, error: 'You can only delete images from your own listings' };
      }

      // Parse existing images
      let existingImages = existingListing.images || [];
      if (typeof existingImages === 'string') {
        try {
          existingImages = JSON.parse(existingImages);
        } catch (e) {
          console.log('[SERVICE/LISTING] Failed to parse images JSON:', e);
          existingImages = [];
        }
      }

      // Ensure it's an array
      if (!Array.isArray(existingImages)) {
        existingImages = [];
      }

      console.log('[SERVICE/LISTING] Current images:', existingImages);

      // Check if the image exists in the listing
      const imageToRemove = `/uploads/${filename}`;
      const imageIndex = existingImages.indexOf(imageToRemove);

      if (imageIndex === -1) {
        return { ok: false, error: 'Image not found in this listing' };
      }

      // Remove the image from the array
      const updatedImages = existingImages.filter(img => img !== imageToRemove);

      console.log('[SERVICE/LISTING] Updated images after removal:', updatedImages);

      // Update the listing with the new images array
      const updateData = {
        images: updatedImages
      };

      const result = await ListingModel.updateListing(listingId, updateData);

      if (result.ok) {
        console.log('[SERVICE/LISTING] Image deleted successfully');
        return {
          ok: true,
          message: 'Image deleted successfully',
          remainingImages: updatedImages.length,
          images: updatedImages
        };
      } else {
        console.error('[SERVICE/LISTING] Failed to update listing after image deletion:', result.error);
        return { ok: false, error: 'Failed to delete image. Please try again.' };
      }
    } catch (error) {
      console.error('[SERVICE/LISTING] deleteListingImage error:', error);
      throw error;
    }
  }

  /**
   * Filter listings based on room type, town, min/max price
   */
  async filterListings(filters) {
    console.log('[SERVICE/LISTING] filterListings called with filters:', filters);
    
    try {
      const listings = await ListingModel.filterListings(filters);
      return listings;
    } catch (error) {
      console.error('[SERVICE/LISTING] filterListings error:', error);
      throw error;
    }
  }
}

module.exports = new ListingService();
