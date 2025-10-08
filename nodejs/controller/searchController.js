// searchController.js
const searchService = require('../services/searchService');

module.exports.handleTest = async function (req) {
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
  const filters = {
    flatType: req && req.query ? req.query.flatType : undefined,
    minPrice: req && req.query ? req.query.minPrice : undefined,
    maxPrice: req && req.query ? req.query.maxPrice : undefined,
    minAreaSqm: req && req.query ? req.query.minAreaSqm : undefined,
    maxAreaSqm: req && req.query ? req.query.maxAreaSqm : undefined,
    limit: req && req.query ? req.query.limit : undefined,
  };
  return await searchService.rankTowns(filters);
};
