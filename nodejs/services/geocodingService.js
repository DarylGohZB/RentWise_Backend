const https = require('https');

function isLatLngString(val) {
  if (typeof val !== 'string') return false;
  const parts = val.split(',');
  if (parts.length !== 2) return false;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'RentWise-Backend/1.0',
        ...headers,
      },
    };
    
    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Geocode an address using OpenStreetMap Nominatim API (free, no API key required)
 * @param {string} address - The address to geocode
 * @returns {Promise<{formattedAddress: string, location: {lat: number, lng: number}}>}
 */
async function geocodeAddress(address) {
  console.log('[GEOCODING] Geocoding address using Nominatim:', address);
  
  // Build Nominatim query URL
  // Nominatim API: https://nominatim.org/release-docs/latest/api/Search/
  const url = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(address)}&` +
    `countrycodes=sg&` +  // Restrict to Singapore
    `format=json&` +
    `limit=1&` +
    `addressdetails=1`;
  
  try {
    const results = await fetchJson(url);
    
    if (!results || results.length === 0) {
      console.warn('[GEOCODING] No results found for:', address);
      const err = new Error(`Failed to geocode: ${address}`);
      err.status = 400;
      throw err;
    }
    
    const result = results[0];
    
    console.log('[GEOCODING] Geocoding successful:', result.display_name);
    
    return {
      formattedAddress: result.display_name,
      location: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
    };
  } catch (err) {
    console.error('[GEOCODING] Geocoding error:', err.message);
    throw err;
  }
}

/**
 * Build a static map URL using OpenStreetMap tiles via staticmap service
 * @param {Object} options - Map configuration
 * @returns {string|null} Static map URL
 */
function buildStaticMapUrl({ points = [], center = null, recommendedTown = null, zoom = 12, size = '640x360' }) {
  console.log('[STATIC_MAP] Building OpenStreetMap static map URL');
  
  // Use staticmap.openstreetmap.de service (free, community-run)
  const base = 'https://staticmap.openstreetmap.de/staticmap.php';
  const params = [];
  
  // Parse size
  const [width, height] = size.split('x').map(Number);
  params.push(`size=${width}x${height}`);
  
  // Set zoom level
  params.push(`zoom=${zoom}`);
  
  // Determine center point
  let mapCenter = center;
  if (!mapCenter && points.length > 0) {
    // Calculate center from points
    const validPoints = points.filter(p => p);
    if (validPoints.length > 0) {
      const avgLat = validPoints.reduce((sum, p) => sum + p.lat, 0) / validPoints.length;
      const avgLng = validPoints.reduce((sum, p) => sum + p.lng, 0) / validPoints.length;
      mapCenter = { lat: avgLat, lng: avgLng };
    }
  }
  
  if (mapCenter) {
    params.push(`center=${mapCenter.lat},${mapCenter.lng}`);
  }
  
  // Add markers for points (red, blue, green)
  const markerColors = ['red', 'blue', 'green'];
  points.forEach((p, idx) => {
    if (!p) return;
    const color = markerColors[idx] || 'gray';
    params.push(`markers=${p.lat},${p.lng},${color}`);
  });
  
  // Add center marker (yellow)
  if (center) {
    params.push(`markers=${center.lat},${center.lng},yellow`);
  }
  
  // Add recommended town marker (purple/lightblue)
  if (recommendedTown) {
    params.push(`markers=${recommendedTown.lat},${recommendedTown.lng},lightblue`);
  }
  
  const url = `${base}?${params.join('&')}`;
  console.log('[STATIC_MAP] Generated URL:', url);
  
  return url;
}

module.exports = {
  isLatLngString,
  geocodeAddress,
  buildStaticMapUrl,
};


