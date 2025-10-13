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
};
