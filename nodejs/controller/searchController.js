// searchController.js
const searchService = require('../services/searchService');
const recommendationService = require('../services/recommendationService');
const { isLatLngString, geocodeAddress, buildStaticMapUrl } = require('../services/geocodingService');
const { getTownStats } = require('../model/GovHouseDataModel');

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


module.exports.recommendTown = async function (req) {
  const q = req.method === 'GET' ? req.query : (req.body || {});

  // Accept either lat,lng or free-text (address/postal). Geocode if not lat,lng.
  async function toPoint(input) {
    if (!input) return null;
    if (isLatLngString(input)) {
      const [lat, lng] = input.split(',').map(Number);
      return { lat, lng };
    }
    const geo = await geocodeAddress(String(input));
    return geo.location;
  }

  const p1 = await toPoint(q.loc1);
  const p2 = await toPoint(q.loc2);
  const p3 = await toPoint(q.loc3);

  const result = recommendationService.recommendTownBetween({
    loc1: p1,
    loc2: p2,
    loc3: p3,
  });

  // Optional combined ranking by distance and average price
  const alpha = Math.min(1, Math.max(0, q.weight != null ? Number(q.weight) : 0.7));
  let ranked = null;
  if (result && result.center) {
    const { getAllTownStats } = require('../model/GovHouseDataModel');
    const statsMap = await getAllTownStats();
    ranked = recommendationService.rankTownsByDistanceAndPrice({ center: result.center, townsStatsMap: statsMap, alpha });
  }

  // Decide final chosen town (combined ranking when available)
  let chosenTownName = result && result.town && result.town.name;
  if (ranked && ranked.length) {
    chosenTownName = ranked[0].name;
  }

  // Find centroid for the chosen town and recompute distance for consistency
  let townCentroid = null;
  let chosenDistance = null;
  try {
    const towns = require('../dataset/towns.json');
    const t = towns.find(x => String(x.name).toUpperCase() === String(chosenTownName || '').toUpperCase());
    if (t) {
      townCentroid = { lat: t.lat, lng: t.lng };
      if (result && result.center) {
        const { haversine } = require('../services/recommendationService');
        chosenDistance = Math.round(haversine(result.center, townCentroid));
      }
    }
  } catch (_) {}

  // Let Static Maps auto-fit by omitting center/zoom (Google will compute viewport)
  const staticMapUrl = buildStaticMapUrl({
    points: [p1, p2, p3],
    center: null,
    zoom: null,
    recommendedTown: townCentroid,
  });

  let stats = null;
  if (chosenTownName) {
    stats = await getTownStats(chosenTownName);
  }
  // Use this if you want full information
  // return {
  //   ...result,
  //   town: { name: chosenTownName, distanceMeters: chosenDistance },
  //   mapUrl: staticMapUrl,
  //   stats,
  //   ranked,
  //   alpha,
  // };
  // Am planning on using just the top 3 instead
  return {
    message: 'Top 3 recommended towns',
    town: ranked && ranked.length ? ranked.slice(0, 3) : (chosenTownName ? [{ name: chosenTownName }] : []),
  };
};
