const EnquiryModel = require('../model/EnquiryModel');
const ListingModel = require('../model/ListingModel');
const MailService = require('./MailService');

module.exports = {
  // Create a new enquiry (business logic)
  createEnquiry: async function (enquiryData) {
    const {
      property_id,
      landlord_email,
      property_postal_code,
      enquirer_name,
      enquirer_email,
      enquiry_message,
      timestamp
    } = enquiryData || {};

    // Basic validation
    if (!property_id || !landlord_email || !enquirer_name || !enquirer_email || !enquiry_message) {
      return { ok: false, status: 400, error: 'Missing required fields' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(enquirer_email) || !emailRegex.test(landlord_email)) {
      return { ok: false, status: 400, error: 'Invalid email format' };
    }

    try {
      const listing = await ListingModel.getListingById(property_id);
      if (!listing) {
        return { ok: false, status: 404, error: 'Property not found' };
      }

      const payload = {
        property_id,
        landlord_email,
        property_postal_code,
        enquirer_name,
        enquirer_email,
        enquiry_message,
        timestamp: timestamp || new Date()
      };

      const result = await EnquiryModel.createEnquiry(payload);
      if (!result.ok) {
        return { ok: false, status: 500, error: result.error };
      }

      // Send notification email (best-effort)
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
        console.error('[SERVICE/ENQUIRY] Failed to send notification email:', emailErr);
        // don't fail the operation
      }

      return { ok: true, status: 201, enquiryId: result.enquiryId };
    } catch (err) {
      console.error('[SERVICE/ENQUIRY] createEnquiry error:', err);
      return { ok: false, status: 500, error: err };
    }
  },

  // Fetch enquiries for landlord
  getEnquiriesByLandlord: async function (landlordId) {
    try {
      const rows = await EnquiryModel.getEnquiriesByLandlord(landlordId);
      return { ok: true, status: 200, enquiries: rows };
    } catch (err) {
      console.error('[SERVICE/ENQUIRY] getEnquiriesByLandlord error:', err);
      return { ok: false, status: 500, error: err };
    }
  },

  // Get a single enquiry with details
  getEnquiryById: async function (enquiryId) {
    try {
      const row = await EnquiryModel.getEnquiryById(enquiryId);
      if (!row) return { ok: false, status: 404, error: 'Enquiry not found' };
      return { ok: true, status: 200, enquiry: row };
    } catch (err) {
      console.error('[SERVICE/ENQUIRY] getEnquiryById error:', err);
      return { ok: false, status: 500, error: err };
    }
  },

  // Get property details used for enquiry form
  getPropertyDetailsById: async function (propertyId) {
    try {
      const row = await EnquiryModel.getPropertyDetailsById(propertyId);
      if (!row) return { ok: false, status: 404, error: 'Property not found' };
      return { ok: true, status: 200, property: row };
    } catch (err) {
      console.error('[SERVICE/ENQUIRY] getPropertyDetailsById error:', err);
      return { ok: false, status: 500, error: err };
    }
  }
};
