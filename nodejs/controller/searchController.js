// searchController.js
const searchService = require('../services/searchService');

module.exports.handleTest = async function (req) {
  console.log('[CONTROLLER/SEARCHCONTROLLER] handleTest called');
  return true;
};

// -------------------------
// Government Data Endpoints
// -------------------------

module.exports.getGovCount = async function (req) {
  console.log('[CONTROLLER/SEARCHCONTROLLER] getGovCount called');
  try {
    const data = await searchService.getGovCount();
    console.log('[CONTROLLER/SEARCHCONTROLLER] getGovCount result:', data);
    return data;
  } catch (err) {
    console.error('[CONTROLLER/SEARCHCONTROLLER] getGovCount failed:', err);
    throw err;
  }
};

module.exports.getGovSample = async function (req) {
  const limit = req?.query?.limit ? Number(req.query.limit) : 5;
  console.log(`[CONTROLLER/SEARCHCONTROLLER] getGovSample called (limit=${limit})`);
  try {
    const data = await searchService.getGovSample(limit);
    console.log('[CONTROLLER/SEARCHCONTROLLER] getGovSample result:', data);
    return data;
  } catch (err) {
    console.error('[CONTROLLER/SEARCHCONTROLLER] getGovSample failed:', err);
    throw err;
  }
};

module.exports.searchGovByTown = async function (req) {
  console.log('[CONTROLLER/SEARCHCONTROLLER] searchGovByTown called with query:', req.query);
  try {
    const filters = {
      town: req?.query?.town,
      flatType: req?.query?.flatType,
      minPrice: req?.query?.minPrice,
      maxPrice: req?.query?.maxPrice,
      minAreaSqm: req?.query?.minAreaSqm,
      maxAreaSqm: req?.query?.maxAreaSqm,
      limit: req?.query?.limit,
      offset: req?.query?.offset,
    };
    const data = await searchService.searchGovByTown(filters);
    console.log('[CONTROLLER/SEARCHCONTROLLER] searchGovByTown result:', data);
    return data;
  } catch (err) {
    console.error('[CONTROLLER/SEARCHCONTROLLER] searchGovByTown failed:', err);
    throw err;
  }
};

module.exports.rankTowns = async function (req) {
  console.log('[CONTROLLER/SEARCHCONTROLLER] rankTowns called with query:', req.query);
  try {
    const filters = {
      flatType: req?.query?.flatType,
      minPrice: req?.query?.minPrice,
      maxPrice: req?.query?.maxPrice,
      minAreaSqm: req?.query?.minAreaSqm,
      maxAreaSqm: req?.query?.maxAreaSqm,
      limit: req?.query?.limit,
    };
    const data = await searchService.rankTowns(filters);
    console.log('[CONTROLLER/SEARCHCONTROLLER] rankTowns result:', data);
    return data;
  } catch (err) {
    console.error('[CONTROLLER/SEARCHCONTROLLER] rankTowns failed:', err);
    throw err;
  }
};
