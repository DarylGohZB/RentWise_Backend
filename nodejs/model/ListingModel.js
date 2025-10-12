const pool = require('../services/db');

module.exports = {
  /**
   * Create a new listing
   */
  createListing: async function (listingData) {
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
    } = listingData;

    try {
      // Convert images string to JSON array if provided
      let imagesJson = null;
      if (images) {
        if (typeof images === 'string') {
          // Split comma-separated string into array
          const imageArray = images.split(',').map(url => url.trim()).filter(url => url.length > 0);
          imagesJson = JSON.stringify(imageArray);
        } else if (Array.isArray(images)) {
          imagesJson = JSON.stringify(images);
        }
      }

      const [result] = await pool.execute(
        `INSERT INTO listings (landlord_id, title, description, address, price, property_type, 
         bedrooms, bathrooms, area_sqm, amenities, images, availability_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [landlord_id, title, description, address, price, property_type, 
         bedrooms, bathrooms, area_sqm, amenities, imagesJson, availability_date]
      );

      return { ok: true, listingId: result.insertId };
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
   * Get listings by landlord
   */
  getListingsByLandlord: async function (landlordId, status = 'active', limit = 50, offset = 0) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM listings 
         WHERE landlord_id = ? AND status = ?
         ORDER BY created_date DESC
         LIMIT ? OFFSET ?`,
        [landlordId, status, limit, offset]
      );

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
        WHERE l.status = 'active'
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

      if (filters.min_bedrooms) {
        query += ' AND l.bedrooms >= ?';
        params.push(filters.min_bedrooms);
      }

      if (filters.max_bedrooms) {
        query += ' AND l.bedrooms <= ?';
        params.push(filters.max_bedrooms);
      }

      if (filters.location) {
        query += ' AND l.address LIKE ?';
        params.push(`%${filters.location}%`);
      }

      if (filters.availability_date) {
        query += ' AND l.availability_date <= ?';
        params.push(filters.availability_date);
      }

      query += ' ORDER BY l.created_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (err) {
      console.error('[DB] searchListings error:', err);
      return [];
    }
  },

  /**
   * Update listing
   */
  updateListing: async function (listingId, updateData) {
    try {
      const allowedFields = [
        'title', 'description', 'address', 'price', 'property_type',
        'bedrooms', 'bathrooms', 'area_sqm', 'amenities', 'images',
        'availability_date', 'status'
      ];

      const updates = [];
      const params = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
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

      return { ok: true, affectedRows: result.affectedRows };
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
        rented: 0
      };

      rows.forEach(row => {
        stats[row.status] = row.count;
        stats.total += row.count;
      });

      return stats;
    } catch (err) {
      console.error('[DB] getListingStats error:', err);
      return { total: 0, active: 0, inactive: 0, rented: 0 };
    }
  }
};
