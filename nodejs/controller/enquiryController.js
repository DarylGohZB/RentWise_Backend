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
      property_id,
      landlord_email,
      property_postal_code,
      enquirer_name,
      enquirer_email,
      enquiry_message,
      timestamp
    } = req.body || {};

    console.log('[CONTROLLER/ENQUIRY] createEnquiry attempt for property:', property_id);

    // Validation
    if (!property_id || !landlord_email || !enquirer_name || !enquirer_email || !enquiry_message) {
      console.warn('[CONTROLLER/ENQUIRY] createEnquiry failed: missing required fields');
      return { status: 400, body: { message: 'property_id, landlord_email, enquirer_name, enquirer_email, and enquiry_message are required' } };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(enquirer_email) || !emailRegex.test(landlord_email)) {
      console.warn('[CONTROLLER/ENQUIRY] createEnquiry failed: invalid email format');
      return { status: 400, body: { message: 'Invalid email format' } };
    }

    try {
      // Get listing details to verify property exists
      const listing = await ListingModel.getListingById(property_id);
      if (!listing) {
        console.warn('[CONTROLLER/ENQUIRY] createEnquiry failed: property not found');
        return { status: 404, body: { message: 'Property not found' } };
      }

      // Create enquiry
      const enquiryData = {
        property_id,
        landlord_email,
        property_postal_code,
        enquirer_name,
        enquirer_email,
        enquiry_message,
        timestamp: timestamp || new Date()
      };

      const result = await EnquiryModel.createEnquiry(enquiryData);

      if (result.ok) {
        console.log('[CONTROLLER/ENQUIRY] createEnquiry successful:', result.enquiryId);

        // Send notification email to landlord
        try {
          await MailService.sendEnquiryNotification({
            landlordEmail: landlord_email,
            landlordName: listing.landlord_name || 'Landlord',
            enquirerName: enquirer_name,
            enquirerEmail: enquirer_email,
            propertyTitle: listing.title,
            propertyAddress: listing.address,
            propertyPostalCode: property_postal_code,
            enquiryMessage: enquiry_message,
            enquiryId: result.enquiryId
          });
        } catch (emailErr) {
          console.error('[CONTROLLER/ENQUIRY] Failed to send notification email:', emailErr);
          // Don't fail the enquiry creation if email fails
        }

        return {
          status: 201,
          body: {
            message: 'Enquiry sent successfully',
            enquiryId: result.enquiryId
          }
        };
      }

      console.error('[CONTROLLER/ENQUIRY] createEnquiry failed:', result.error);
      return { status: 500, body: { message: 'Failed to send enquiry', error: result.error } };
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
