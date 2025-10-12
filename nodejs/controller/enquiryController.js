const EnquiryModel = require('../model/EnquiryModel');
const ListingModel = require('../model/ListingModel');
const MailService = require('../services/MailService');

module.exports = {
  // Test endpoint
  handleTest: async function (req) {
    return true;
  },

  /**
   * Create a new enquiry
   */
  createEnquiry: async function (req) {
    const {
      listing_id,
      tenant_name,
      tenant_email,
      message
    } = req.body || {};

    console.log('[CONTROLLER/ENQUIRY] createEnquiry attempt for listing:', listing_id);

    // Validation
    if (!listing_id || !tenant_name || !tenant_email || !message) {
      console.warn('[CONTROLLER/ENQUIRY] createEnquiry failed: missing required fields');
      return { status: 400, body: { message: 'listing_id, tenant_name, tenant_email, and message are required' } };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tenant_email)) {
      console.warn('[CONTROLLER/ENQUIRY] createEnquiry failed: invalid email format');
      return { status: 400, body: { message: 'Invalid email format' } };
    }

    try {
      // Get listing details to find landlord
      const listing = await ListingModel.getListingById(listing_id);
      if (!listing) {
        console.warn('[CONTROLLER/ENQUIRY] createEnquiry failed: listing not found');
        return { status: 404, body: { message: 'Listing not found' } };
      }

      // Create enquiry
      const enquiryData = {
        listing_id,
        tenant_name,
        tenant_email,
        message
      };

      const result = await EnquiryModel.createEnquiry(enquiryData);

      if (result.ok) {
        console.log('[CONTROLLER/ENQUIRY] createEnquiry successful:', result.enquiryId);

        // Send notification email to landlord
        try {
          await MailService.sendEnquiryNotification({
            landlordEmail: listing.landlord_email,
            landlordName: listing.landlord_name,
            tenantName: tenant_name,
            tenantEmail: tenant_email,
            propertyTitle: listing.title,
            message: message,
            enquiryId: result.enquiryId
          });
        } catch (emailErr) {
          console.error('[CONTROLLER/ENQUIRY] Failed to send notification email:', emailErr);
          // Don't fail the enquiry creation if email fails
        }

        return {
          status: 201,
          body: {
            message: 'Enquiry submitted successfully',
            enquiryId: result.enquiryId
          }
        };
      }

      console.error('[CONTROLLER/ENQUIRY] createEnquiry failed:', result.error);
      return { status: 500, body: { message: 'Failed to create enquiry', error: result.error } };
    } catch (err) {
      console.error('[CONTROLLER/ENQUIRY] createEnquiry error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  },

  /**
   * Get enquiries for a landlord
   */
  getLandlordEnquiries: async function (req) {
    const { landlordId } = req.params;

    if (!landlordId) {
      return { status: 400, body: { message: 'landlordId is required' } };
    }

    try {
      const enquiries = await EnquiryModel.getEnquiriesByLandlord(landlordId);
      return { status: 200, body: enquiries };
    } catch (err) {
      console.error('[CONTROLLER/ENQUIRY] getLandlordEnquiries error:', err);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  }
};
