const pool = require('../services/db');
const ListingValidationService = require('../services/ListingValidationService');

module.exports = {
  /**
   * Ensure listings table exists with proper schema
   */
  ensureTable: async function () {
    const p = pool;
    await p.execute(`
      CREATE TABLE IF NOT EXISTS listings (
        listing_id INT AUTO_INCREMENT PRIMARY KEY,
        landlord_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        postal_code VARCHAR(10),
        price DECIMAL(10,2) NOT NULL,
        property_type ENUM('HDB') NOT NULL,
        rooms INT,
        images JSON,
        availability_date DATE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive', 'rented', 'pending_review', 'rejected') DEFAULT 'active',
                review_status ENUM('pending', 'approved', 'rejected', 'needs_info') DEFAULT 'pending',
                review_notes TEXT,
                FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('[DB] Listings table ensured');
  },
  /**
   * Create a new listing with validation and review status
   */
  createListing: async function (listingData) {
    try {
      // Validate the listing data
      const validation = ListingValidationService.validateListingData(listingData);
      if (!validation.isValid) {
        return { 
          ok: false, 
          error: 'Validation failed', 
          details: validation.errors 
        };
      }

      const validatedData = validation.validatedData;
      const {
        landlord_id,
        title,
        description,
        address,
        postal_code,
        price,
        property_type,
        rooms,
        images,
        availability_date,
        status,
        review_status
      } = { ...listingData, ...validatedData };

      // Convert images to JSON
      let imagesJson = null;
      if (images && images.length > 0) {
        imagesJson = JSON.stringify(images);
      }

      const [result] = await pool.execute(
        `INSERT INTO listings (landlord_id, title, description, address, postal_code, price, 
         property_type, rooms, images, availability_date, 
         status, review_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [landlord_id, title, description, address, postal_code, price, property_type, 
         rooms, imagesJson, availability_date, 
         status, review_status]
      );

      return { 
        ok: true, 
        listingId: result.insertId,
        status: status,
        reviewStatus: review_status,
        message: validatedData.review_message
      };
    } catch (err) {
      console.error('[DB] createListing error:', err);
      return { ok: false, error: err };
    }
  },

  /**
   * Get listing by ID
   */
  getListingById: async function (listingId) {
    try {
      const [rows] = await pool.execute(
        `SELECT l.*, u.displayName as landlord_name, u.email as landlord_email
         FROM listings l
         LEFT JOIN users u ON l.landlord_id = u.user_id
         WHERE l.listing_id = ?`,
        [listingId]
      );

      return rows.length ? rows[0] : null;
    } catch (err) {
      console.error('[DB] getListingById error:', err);
      return null;
    }
  },

  /**
   * Get all active listings
   */
  getAllListings: async function (limit = 50, offset = 0) {
    try {
      // Ensure limit and offset are numbers
      const numLimit = parseInt(limit) || 50;
      const numOffset = parseInt(offset) || 0;
      
      const [rows] = await pool.execute(
        `SELECT l.*, u.displayName as landlord_name
         FROM listings l
         LEFT JOIN users u ON l.landlord_id = u.user_id
         WHERE l.status = 'active' AND l.review_status = 'approved'
         ORDER BY l.created_date DESC
         LIMIT ${numLimit} OFFSET ${numOffset}`
      );
      return rows;
    } catch (err) {
      console.error('[DB] getAllListings error:', err);
      return [];
    }
  },

  /**
   * Get listings by landlord
   */
  getListingsByLandlord: async function (landlordId, status = null, limit = 50, offset = 0) {
    try {
      console.log('[DB] getListingsByLandlord called with:', { landlordId, status, limit, offset });
      
      // Ensure limit and offset are numbers
      const numLimit = parseInt(limit) || 50;
      const numOffset = parseInt(offset) || 0;
      
      let query = `SELECT * FROM listings WHERE landlord_id = ?`;
      let params = [landlordId];
      
      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }
      
      // Use string interpolation for LIMIT and OFFSET to avoid MySQL prepared statement issues
      query += ` ORDER BY created_date DESC LIMIT ${numLimit} OFFSET ${numOffset}`;
      
      console.log('[DB] Executing query:', query);
      console.log('[DB] With params:', params);
      
      const [rows] = await pool.execute(query, params);
      console.log('[DB] Query returned', rows.length, 'rows:', rows);
      return rows;
    } catch (err) {
      console.error('[DB] getListingsByLandlord error:', err);
      return [];
    }
  },

  /**
   * Search listings with filters
   */
  searchListings: async function (filters = {}, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT l.*, u.displayName as landlord_name
        FROM listings l
        LEFT JOIN users u ON l.landlord_id = u.user_id
        WHERE l.status = 'active' AND l.review_status = 'approved'
      `;
      const params = [];

      // Apply filters
      if (filters.property_type) {
        query += ' AND l.property_type = ?';
        params.push(filters.property_type);
      }

      if (filters.min_price) {
        query += ' AND l.price >= ?';
        params.push(filters.min_price);
      }

      if (filters.max_price) {
        query += ' AND l.price <= ?';
        params.push(filters.max_price);
      }

      if (filters.min_rooms) {
        query += ' AND l.rooms >= ?';
        params.push(filters.min_rooms);
      }

      if (filters.max_rooms) {
        query += ' AND l.rooms <= ?';
        params.push(filters.max_rooms);
      }

      if (filters.location) {
        query += ' AND l.address LIKE ?';
        params.push(`%${filters.location}%`);
      }

      if (filters.availability_date) {
        query += ' AND l.availability_date <= ?';
        params.push(filters.availability_date);
      }

      // Ensure limit and offset are numbers
      const numLimit = parseInt(limit) || 50;
      const numOffset = parseInt(offset) || 0;
      
      query += ` ORDER BY l.created_date DESC LIMIT ${numLimit} OFFSET ${numOffset}`;

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (err) {
      console.error('[DB] searchListings error:', err);
      return [];
    }
  },

  /**
   * Update listing with validation and review status
   */
  updateListing: async function (listingId, updateData) {
    try {
      // Validate the update data (only validate provided fields)
      const validation = ListingValidationService.validateListingUpdate(updateData);
      if (!validation.isValid) {
        return { 
          ok: false, 
          error: 'Validation failed', 
          details: validation.errors 
        };
      }

      const validatedData = validation.validatedData;
      const allowedFields = [
        'title', 'description', 'address', 'postal_code', 'price', 'property_type',
        'rooms', 'images', 'availability_date', 'status', 'review_status'
      ];

      const updates = [];
      const params = [];

      // Add validated fields to updates
      Object.keys(validatedData).forEach(key => {
        if (allowedFields.includes(key) && validatedData[key] !== undefined) {
          updates.push(`${key} = ?`);
          params.push(validatedData[key]);
        }
      });

      // Add other allowed fields that don't need validation
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && !validatedData[key] && updateData[key] !== undefined) {
          updates.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      });

      if (updates.length === 0) {
        return { ok: false, error: 'No valid fields to update' };
      }

      const query = `UPDATE listings SET ${updates.join(', ')}, updated_date = CURRENT_TIMESTAMP WHERE listing_id = ?`;
      params.push(listingId);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        return { ok: false, error: 'Listing not found' };
      }

      return { 
        ok: true, 
        affectedRows: result.affectedRows,
        status: validatedData.status,
        reviewStatus: validatedData.review_status,
        message: validatedData.review_message
      };
    } catch (err) {
      console.error('[DB] updateListing error:', err);
      return { ok: false, error: err };
    }
  },

  /**
   * Delete listing
   */
  deleteListing: async function (listingId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM listings WHERE listing_id = ?',
        [listingId]
      );

      if (result.affectedRows === 0) {
        return { ok: false, error: 'Listing not found' };
      }

      return { ok: true, affectedRows: result.affectedRows };
    } catch (err) {
      console.error('[DB] deleteListing error:', err);
      return { ok: false, error: err };
    }
  },

  /**
   * Get listing statistics for a landlord
   */
  getListingStats: async function (landlordId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
           status,
           COUNT(*) as count
         FROM listings 
         WHERE landlord_id = ?
         GROUP BY status`,
        [landlordId]
      );

      const stats = {
        total: 0,
        active: 0,
        inactive: 0,
        rented: 0,
        pending_review: 0,
        rejected: 0
      };

      rows.forEach(row => {
        stats[row.status] = row.count;
        stats.total += row.count;
      });

      return stats;
    } catch (err) {
      console.error('[DB] getListingStats error:', err);
      return { total: 0, active: 0, inactive: 0, rented: 0, pending_review: 0, rejected: 0 };
    }
  },

  /**
   * Get listings pending review (for admin)
   */
  getPendingReviewListings: async function (limit = 50, offset = 0) {
    try {
      // Ensure parameters are proper integers
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);
      
      // Use string interpolation for LIMIT and OFFSET to avoid prepared statement issues
      const query = `SELECT l.*, u.displayName as landlord_name, u.email as landlord_email
         FROM listings l
         LEFT JOIN users u ON l.landlord_id = u.user_id
         WHERE l.review_status = 'pending'
         ORDER BY l.created_date ASC
         LIMIT ${limitInt} OFFSET ${offsetInt}`;
      
      const [rows] = await pool.execute(query);
      return rows;
    } catch (err) {
      console.error('[DB] getPendingReviewListings error:', err);
      return [];
    }
  },

  /**
   * Update listing review status (admin only)
   */
  updateListingReview: async function (listingId, reviewData) {
    try {
      const { review_status, review_notes } = reviewData;
      
      if (!['approved', 'rejected', 'needs_info'].includes(review_status)) {
        return { ok: false, error: 'Invalid review status' };
      }

      // Determine the listing status based on review
      let status = 'active';
      if (review_status === 'rejected') {
        status = 'rejected';
      } else if (review_status === 'needs_info') {
        status = 'pending_review';
      }

      const [result] = await pool.execute(
        `UPDATE listings 
         SET review_status = ?, review_notes = ?, status = ?
         WHERE listing_id = ?`,
        [review_status, review_notes, status, listingId]
      );

      if (result.affectedRows === 0) {
        return { ok: false, error: 'Listing not found' };
      }

      return {
        ok: true,
        affectedRows: result.affectedRows,
        status: status,
        reviewStatus: review_status
      };
    } catch (err) {
      console.error('[DB] updateListingReview error:', err);
      return { ok: false, error: err };
    }
  },

  /**
   * Get listing by landlord with ownership verification
   */
  getListingByLandlord: async function (listingId, landlordId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM listings 
         WHERE listing_id = ? AND landlord_id = ?`,
        [listingId, landlordId]
      );

      return rows.length ? rows[0] : null;
    } catch (err) {
      console.error('[DB] getListingByLandlord error:', err);
      return null;
    }
  },

  /**
   * Delete listing with ownership verification
   */
  deleteListingByLandlord: async function (listingId, landlordId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM listings WHERE listing_id = ? AND landlord_id = ?',
        [listingId, landlordId]
      );

      if (result.affectedRows === 0) {
        return { ok: false, error: 'Listing not found or not owned by landlord' };
      }

      return { ok: true, affectedRows: result.affectedRows };
    } catch (err) {
      console.error('[DB] deleteListingByLandlord error:', err);
      return { ok: false, error: err };
    }
  }
};
