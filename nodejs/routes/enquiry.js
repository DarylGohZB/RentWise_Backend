const express = require('express');
const router = express.Router();
const enquiryController = require('../controller/enquiryController');
const EnquiryModel = require('../model/EnquiryModel');
const pool = require('../services/db');

// Create a new enquiry
router.post('/', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] POST / called');
  try {
    const result = await enquiryController.createEnquiry(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] POST / error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get enquiries for a landlord
router.get('/landlord/:landlordId', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] GET /landlord/:landlordId called');
  try {
    const result = await enquiryController.getLandlordEnquiries(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] GET /landlord/:landlordId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get enquiries for a specific property
router.get('/property/:propertyId', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] GET /property/:propertyId called');
  try {
    const { propertyId } = req.params;
    const enquiries = await EnquiryModel.getEnquiriesByListing(propertyId);
    res.status(200).json(enquiries);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] GET /property/:propertyId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single enquiry by ID
router.get('/:enquiryId', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] GET /:enquiryId called');
  try {
    const { enquiryId } = req.params;
    
    // Validate enquiry ID
    if (!enquiryId || isNaN(enquiryId)) {
      return res.status(400).json({ message: 'Invalid enquiry ID provided' });
    }
    
    // Get enquiry details with property and landlord information
    const [rows] = await pool.execute(`
      SELECT 
        e.enquiry_id,
        e.property_id,
        e.landlord_email,
        e.property_postal_code,
        e.enquirer_name,
        e.enquirer_email,
        e.enquiry_message,
        e.timestamp,
        e.status,
        l.title as listing_title,
        l.address as listing_address,
        l.price as monthly_rent,
        l.property_type,
        l.rooms,
        l.images,
        u.displayName as landlord_name
      FROM enquiries e
      LEFT JOIN listings l ON e.property_id = l.listing_id
      LEFT JOIN users u ON l.landlord_id = u.user_id
      WHERE e.enquiry_id = ?
    `, [enquiryId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    
    const enquiry = rows[0];
    
    // Format the response for frontend
    const enquiryDetails = {
      enquiry_id: enquiry.enquiry_id,
      property_id: enquiry.property_id,
      landlord_email: enquiry.landlord_email,
      property_postal_code: enquiry.property_postal_code,
      enquirer_name: enquiry.enquirer_name,
      enquirer_email: enquiry.enquirer_email,
      enquiry_message: enquiry.enquiry_message,
      timestamp: enquiry.timestamp,
      status: enquiry.status,
      listing_title: enquiry.listing_title,
      listing_address: enquiry.listing_address,
      monthly_rent: enquiry.monthly_rent,
      property_type: enquiry.property_type,
      rooms: enquiry.rooms,
      images: enquiry.images || [],
      landlord_name: enquiry.landlord_name
    };
    
    res.status(200).json(enquiryDetails);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] GET /:enquiryId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get property details for enquiry form
router.get('/property-details/:propertyId', async (req, res) => {
  console.log('[ROUTES/ENQUIRY] GET /property-details/:propertyId called');
  try {
    const { propertyId } = req.params;
    
    // Validate property ID
    if (!propertyId || isNaN(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID provided' });
    }
    
    // Get property details with landlord information
    const [rows] = await pool.execute(`
      SELECT 
        l.listing_id as property_id,
        l.title,
        l.description,
        l.address,
        l.postal_code,
        l.price as monthly_rent,
        l.property_type,
        l.rooms,
        l.images,
        l.availability_date,
        u.email as landlord_email,
        u.displayName as landlord_name
      FROM listings l
      LEFT JOIN users u ON l.landlord_id = u.user_id
      WHERE l.listing_id = ? AND l.status = 'active'
    `, [propertyId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Property not found or not available' });
    }
    
    const property = rows[0];
    
    // Format the response for frontend
    const propertyDetails = {
      property_id: property.property_id,
      title: property.title,
      description: property.description,
      address: property.address,
      postal_code: property.postal_code,
      monthly_rent: property.monthly_rent,
      property_type: property.property_type,
      rooms: property.rooms,
      images: property.images || [],
      availability_date: property.availability_date,
      landlord_email: property.landlord_email,
      landlord_name: property.landlord_name
    };
    
    res.status(200).json(propertyDetails);
  } catch (err) {
    console.error('[ROUTES/ENQUIRY] GET /property-details/:propertyId error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
