const pool = require('../services/db');

module.exports = {
  /**
   * Ensure enquiries table exists with proper schema
   */
  ensureTable: async function () {
    const p = pool;
    await p.execute(`
      CREATE TABLE IF NOT EXISTS enquiries (
        enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        landlord_email VARCHAR(255) NOT NULL,
        property_postal_code VARCHAR(10),
        enquirer_name VARCHAR(255) NOT NULL,
        enquirer_email VARCHAR(255) NOT NULL,
        enquiry_message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('new', 'read', 'replied') DEFAULT 'new',
        FOREIGN KEY (property_id) REFERENCES listings(listing_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('[DB] Enquiries table ensured');
  },
  /**
   * Create a new enquiry
   */
  createEnquiry: async function (enquiryData) {
    const {
      property_id,
      landlord_email,
      property_postal_code,
      enquirer_name,
      enquirer_email,
      enquiry_message,
      timestamp
    } = enquiryData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO enquiries (property_id, landlord_email, property_postal_code, enquirer_name, enquirer_email, enquiry_message, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [property_id, landlord_email, property_postal_code, enquirer_name, enquirer_email, enquiry_message, timestamp || new Date()]
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
  getEnquiriesByListing: async function (propertyId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, l.title as listing_title, u.displayName as landlord_name, u.email as landlord_email
         FROM enquiries e
         LEFT JOIN listings l ON e.property_id = l.listing_id
         LEFT JOIN users u ON l.landlord_id = u.user_id
         WHERE e.property_id = ?
         ORDER BY e.timestamp DESC`,
        [propertyId]
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
         LEFT JOIN listings l ON e.property_id = l.listing_id
         WHERE l.landlord_id = ?
         ORDER BY e.timestamp DESC`,
        [landlordId]
      );

      return rows;
    } catch (err) {
      console.error('[DB] getEnquiriesByLandlord error:', err);
      return [];
    }
  }
};
