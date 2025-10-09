// mapController.js
const recommendationService = require('../services/recommendationService');
const { isLatLngString, geocodeAddress, buildStaticMapUrl } = require('../services/geocodingService');
const { getTownStats } = require('../model/GovHouseDataModel');

module.exports.handleTest = async function (req) {
  return true;
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

  return {
    ...result,
    town: { name: chosenTownName, distanceMeters: chosenDistance },
    mapUrl: staticMapUrl,
    stats,
    ranked,
    alpha,
  };
};
