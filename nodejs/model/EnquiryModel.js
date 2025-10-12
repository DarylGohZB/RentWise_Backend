const pool = require('../services/db');

module.exports = {
  /**
   * Create a new enquiry
   */
  createEnquiry: async function (enquiryData) {
    const {
      listing_id,
      tenant_name,
      tenant_email,
      message
    } = enquiryData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO enquiries (listing_id, tenant_name, tenant_email, message) 
         VALUES (?, ?, ?, ?)`,
        [listing_id, tenant_name, tenant_email, message]
      );

      return { ok: true, enquiryId: result.insertId };
    } catch (err) {
      console.error('[DB] createEnquiry error:', err);
      return { ok: false, error: err };
    }
  },

  /**
   * Get enquiries for a specific listing
   */
  getEnquiriesByListing: async function (listingId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, l.title as listing_title, u.displayName as landlord_name, u.email as landlord_email
         FROM enquiries e
         LEFT JOIN listings l ON e.listing_id = l.listing_id
         LEFT JOIN users u ON l.landlord_id = u.user_id
         WHERE e.listing_id = ?
         ORDER BY e.enquiry_date DESC`,
        [listingId]
      );

      return rows;
    } catch (err) {
      console.error('[DB] getEnquiriesByListing error:', err);
      return [];
    }
  },

  /**
   * Get enquiries for a specific landlord (from their listings)
   */
  getEnquiriesByLandlord: async function (landlordId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, l.title as listing_title, l.address as listing_address
         FROM enquiries e
         LEFT JOIN listings l ON e.listing_id = l.listing_id
         WHERE l.landlord_id = ?
         ORDER BY e.enquiry_date DESC`,
        [landlordId]
      );

      return rows;
    } catch (err) {
      console.error('[DB] getEnquiriesByLandlord error:', err);
      return [];
    }
  }
};
