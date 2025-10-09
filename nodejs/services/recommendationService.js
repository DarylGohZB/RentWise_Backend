const towns = require('../dataset/towns.json');

function toPoint(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const parts = input.split(',');
    if (parts.length === 2) {
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null; // address geocoding not implemented here
  }
  if (typeof input === 'object' && input.lat != null && input.lng != null) {
    const lat = Number(input.lat);
    const lng = Number(input.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

function haversine(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function weightedCentroid(points) {
  const valid = points.filter(Boolean);
  if (!valid.length) return null;
  let sumLat = 0, sumLng = 0;
  for (const p of valid) { sumLat += p.lat; sumLng += p.lng; }
  return { lat: sumLat / valid.length, lng: sumLng / valid.length };
}

function nearestTown(point) {
  if (!point) return null;
  let best = null; let bestD = Infinity;
  for (const t of towns) {
    const d = haversine(point, { lat: t.lat, lng: t.lng });
    if (d < bestD) { bestD = d; best = { name: t.name, distanceMeters: Math.round(d) }; }
  }
  return best;
}

function randomTown() {
  const t = towns[Math.floor(Math.random() * towns.length)];
  return { name: t.name, distanceMeters: null };
}

module.exports = {
  recommendTownBetween: function ({ loc1, loc2, loc3 }) {
    const p1 = toPoint(loc1);
    const p2 = toPoint(loc2);
    const p3 = toPoint(loc3);
    const provided = [p1, p2, p3].filter(Boolean);

    if (provided.length === 0) {
      const err = new Error('At least one location is required');
      err.status = 400;
      throw err;
    }
    if (provided.length === 1) {
      const town = nearestTown(provided[0]);
      return { mode: 'single', town, center: provided[0] };
    }
    if (provided.length === 2) {
      const center = weightedCentroid(provided);
      const town = nearestTown(center);
      return { mode: 'pair', town, center };
    }
    const center = weightedCentroid(provided);
    const town = nearestTown(center);
    return { mode: 'triple', town, center };
  }
};

module.exports.rankTownsByDistanceAndPrice = function ({ center, townsStatsMap, alpha = 0.7 }) {
  // center is {lat,lng}, townsStatsMap is Map(townName -> { listings, avgMonthlyRent })
  if (!center) throw Object.assign(new Error('Center is required'), { status: 400 });
  const rows = [];
  for (const t of towns) {
    const d = haversine(center, { lat: t.lat, lng: t.lng });
    const stats = townsStatsMap ? townsStatsMap.get(t.name) : null;
    rows.push({ name: t.name, distanceMeters: d, avgMonthlyRent: stats && stats.avgMonthlyRent != null ? stats.avgMonthlyRent : null, listings: stats ? stats.listings : 0 });
  }
  // Filter rows with price available; if none, fallback to distance-only
  const withPrice = rows.filter(r => r.avgMonthlyRent != null);
  const candidates = withPrice.length ? withPrice : rows;
  // Normalize
  const minD = Math.min(...candidates.map(r => r.distanceMeters));
  const maxD = Math.max(...candidates.map(r => r.distanceMeters));
  const minP = Math.min(...candidates.map(r => r.avgMonthlyRent != null ? r.avgMonthlyRent : Infinity));
  const maxP = Math.max(...candidates.map(r => r.avgMonthlyRent != null ? r.avgMonthlyRent : -Infinity));
  const eps = 1e-9;
  candidates.forEach(r => {
    const nd = (r.distanceMeters - minD) / Math.max(eps, (maxD - minD));
    const np = r.avgMonthlyRent != null ? (r.avgMonthlyRent - minP) / Math.max(eps, (maxP - minP)) : 0.5; // neutral if missing
    r.score = alpha * nd + (1 - alpha) * np;
  });
  candidates.sort((a, b) => a.score - b.score);
  return candidates;
};


