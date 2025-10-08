const { getCount, getSample, searchByTown, listTownsByScore } = require('../model/GovHouseDataModel');

module.exports = {
  getGovCount: async function () {
    console.log('[SERVICES/SEARCHSERVICE] getGovCount called');
    const count = await getCount();
    console.log('[SERVICES/SEARCHSERVICE] getGovCount result:', count);
    return { count };
  },

  getGovSample: async function (limit) {
    console.log(`[SERVICES/SEARCHSERVICE] getGovSample called (limit=${limit})`);
    const rows = await getSample(limit);
    console.log(`[SERVICES/SEARCHSERVICE] getGovSample returned ${rows.length} rows`);
    return { rows };
  },

  searchGovByTown: async function (filters) {
    console.log('[SERVICES/SEARCHSERVICE] searchGovByTown called with filters:', filters);
    const rows = await searchByTown(filters);
    console.log(`[SERVICES/SEARCHSERVICE] searchGovByTown returned ${rows.length} rows`);
    return { rows };
  },

  rankTowns: async function (filters) {
    console.log('[SERVICES/SEARCHSERVICE] rankTowns called with filters:', filters);
    const towns = await listTownsByScore(filters);
    console.log(`[SERVICES/SEARCHSERVICE] rankTowns returned ${towns.length} towns`);
    return { towns };
  },
};
