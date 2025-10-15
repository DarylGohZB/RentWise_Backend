const enquiryService = require('../services/enquiryService');

module.exports = {
  // Test endpoint
  handleTest: async function (req) {
    console.log('[CONTROLLER/ENQUIRYCONTROLLER] handleTest called');
    return true;
  },

  createEnquiry: async function (req) {
    const result = await enquiryService.createEnquiry(req.body || {});
    if (result.ok) {
      return { status: result.status || 201, body: { message: 'Enquiry sent successfully', enquiryId: result.enquiryId } };
    }
    return { status: result.status || 500, body: { message: result.error || 'Failed to send enquiry' } };
  },

  getLandlordEnquiries: async function (req) {
    const { landlordId } = req.params;
    if (!landlordId) return { status: 400, body: { message: 'landlordId is required' } };

    const result = await enquiryService.getEnquiriesByLandlord(landlordId);
    if (result.ok) return { status: result.status, body: result.enquiries };
    return { status: result.status || 500, body: { message: result.error || 'Failed to fetch enquiries' } };
  },

  getEnquiryById: async function (req) {
    const { enquiryId } = req.params;
    if (!enquiryId || isNaN(enquiryId)) return { status: 400, body: { message: 'Invalid enquiry ID provided' } };

    const result = await enquiryService.getEnquiryById(enquiryId);
    if (result.ok) return { status: result.status, body: result.enquiry };
    return { status: result.status || 500, body: { message: result.error || 'Failed to fetch enquiry' } };
  },

  getPropertyDetailsById: async function (req) {
    const { propertyId } = req.params;
    if (!propertyId || isNaN(propertyId)) return { status: 400, body: { message: 'Invalid property ID provided' } };

    const result = await enquiryService.getPropertyDetailsById(propertyId);
    if (result.ok) return { status: result.status, body: result.property };
    return { status: result.status || 500, body: { message: result.error || 'Failed to fetch property' } };
  }
};
