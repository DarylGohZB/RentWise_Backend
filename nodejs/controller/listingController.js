const ListingModel = require('../model/ListingModel');

module.exports = {
  // Test endpoint
  handleTest: async function (req) {
    return true;
  },

  /**
   * Create a new listing
   */
  createListing: async function (req) {
    const {
      landlord_id,
      title,
      description,
      address,
      price,
      property_type,
      bedrooms,
      bathrooms,
      area_sqm,
      amenities,
      images,
      availability_date
    } = req.body || {};

    console.log('[CONTROLLER/LISTING] createListing attempt by landlord:', landlord_id);

    // Validation
    if (!landlord_id || !title || !address || !price || !property_type) {
      console.warn('[CONTROLLER/LISTING] createListing failed: missing required fields');
      return { status: 400, body: { message: 'landlord_id, title, address, price, and property_type are required' } };
    }

    // Price validation
    if (isNaN(price) || price <= 0) {
      console.warn('[CONTROLLER/LISTING] createListing failed: invalid price');
      return { status: 400, body: { message: 'Price must be a positive number' } };
    }

    // Property type validation
    const validPropertyTypes = ['HDB'];
    if (!validPropertyTypes.includes(property_type)) {
      console.warn('[CONTROLLER/LISTING] createListing failed: invalid property type');
      return { status: 400, body: { message: 'Invalid property type. Must be: HDB' } };
    }

    try {
      const listingData = {
        landlord_id,
        title,
        description,
        address,
        price,
        property_type,
        bedrooms,
        bathrooms,
        area_sqm,
        amenities,
        images,
        availability_date
      };

      const result = await ListingModel.createListing(listingData);

      if (result.ok) {
        console.log('[CONTROLLER/LISTING] createListing successful:', result.listingId);
        return {
          status: 201,
          body: {
            message: 'Listing created successfully',
            listingId: result.listingId
          }
        };
      }

      console.error('[CONTROLLER/LISTING] createListing failed:', result.error);
      return { status: 500, body: { message: 'Failed to create listing', error: result.error } };
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
   * Update listing
   */
  updateListing: async function (req) {
    const { listingId } = req.params;
    const updateData = req.body || {};

    if (!listingId) {
      return { status: 400, body: { message: 'listingId is required' } };
    }

    if (Object.keys(updateData).length === 0) {
      return { status: 400, body: { message: 'No fields to update' } };
    }

    // Validate property type if provided
    if (updateData.property_type) {
      const validPropertyTypes = ['HDB'];
      if (!validPropertyTypes.includes(updateData.property_type)) {
        return { status: 400, body: { message: 'Invalid property type. Must be: HDB' } };
      }
    }

    // Validate price if provided
    if (updateData.price && (isNaN(updateData.price) || updateData.price <= 0)) {
      return { status: 400, body: { message: 'Price must be a positive number' } };
    }

    try {
      const result = await ListingModel.updateListing(listingId, updateData);

      if (result.ok) {
        console.log('[CONTROLLER/LISTING] updateListing successful:', listingId);
        return { status: 200, body: { message: 'Listing updated successfully' } };
      }

      if (result.error === 'Listing not found') {
        return { status: 404, body: { message: 'Listing not found' } };
      }

      console.error('[CONTROLLER/LISTING] updateListing failed:', result.error);
      return { status: 500, body: { message: 'Failed to update listing', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/LISTING] updateListing error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Delete listing
   */
  deleteListing: async function (req) {
    const { listingId } = req.params;

    if (!listingId) {
      return { status: 400, body: { message: 'listingId is required' } };
    }

    try {
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
