const GovHouseDataModel = require('../model/GovHouseDataModel');

module.exports = {
  searchGovListings: async function (filters) {
    console.log('[SERVICES/GOVLISTINGSERVICE] searchGovListings called with filters:', filters);

    try {
      // Search using the model
      const results = await GovHouseDataModel.searchByFilter(filters);

      console.log('[SERVICES/GOVLISTINGSERVICE] Found', results.length, 'listings');
      return { ok: true, data: results };
    } catch (err) {
      console.error('[SERVICES/GOVLISTINGSERVICE] searchGovListings error:', err);
      return { ok: false, error: err };
    }
  },

  // New helper to retrieve town-level statistics via the GovHouse data model.
  // Returns the raw stats object: { listings: number, avgMonthlyRent: number|null }
  getTownStats: async function (townName) {
    try {
      const stats = await GovHouseDataModel.getTownStats(townName);
      return stats || { listings: 0, avgMonthlyRent: null };
    } catch (err) {
      console.error('[SERVICES/GOVLISTINGSERVICE] getTownStats error:', err);
      return { listings: 0, avgMonthlyRent: null };
    }
  },
};
