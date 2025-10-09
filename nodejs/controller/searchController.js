// searchController.js
const searchService = require('../services/searchService');

module.exports.handleTest = async function (req) {
  console.log('[CONTROLLER/SEARCHCONTROLLER] handleTest called');
  return true;
};

module.exports.getGovCount = async function (req) {
  try {
    return await searchService.getGovCount();
  } catch (err) {
    console.error('getGovCount failed:', err);
    throw err;
  }
};

module.exports.getGovSample = async function (req) {
  const limit = req && req.query && req.query.limit ? Number(req.query.limit) : 5;
  return await searchService.getGovSample(limit);
};

module.exports.searchGovByTown = async function (req) {
  try {
    const filters = {
      town: req && req.query ? req.query.town : undefined,
      flatType: req && req.query ? req.query.flatType : undefined,
      minPrice: req && req.query ? req.query.minPrice : undefined,
      maxPrice: req && req.query ? req.query.maxPrice : undefined,
      minAreaSqm: req && req.query ? req.query.minAreaSqm : undefined,
      maxAreaSqm: req && req.query ? req.query.maxAreaSqm : undefined,
      limit: req && req.query ? req.query.limit : undefined,
      offset: req && req.query ? req.query.offset : undefined,
    };
    return await searchService.searchGovByTown(filters);
  } catch (err) {
    console.error('searchGovByTown failed with query:', req && req.query, 'error:', err);
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
