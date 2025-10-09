const https = require('https');

function isLatLngString(val) {
  if (typeof val !== 'string') return false;
  const parts = val.split(',');
  if (parts.length !== 2) return false;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
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

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GMAPS_API_KEY;
  if (!apiKey) {
    const err = new Error('Google Maps API key not configured');
    err.status = 500;
    throw err;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=${encodeURIComponent('country:SG')}&key=${encodeURIComponent(apiKey)}`;
  const json = await fetchJson(url);
  if (json.status !== 'OK' || !json.results || !json.results.length) {
    const err = new Error(`Failed to geocode: ${address}`);
    err.status = 400;
    throw err;
  }
  const r = json.results[0];
  return {
    formattedAddress: r.formatted_address,
    location: {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
    },
  };
}

function buildStaticMapUrl({ points = [], center = null, recommendedTown = null, zoom = null, size = '640x360' }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GMAPS_API_KEY;
  if (!apiKey) return null;
  const base = 'https://maps.googleapis.com/maps/api/staticmap';
  const params = [];
  params.push(`size=${encodeURIComponent(size)}`);
  if (zoom != null) {
    params.push(`zoom=${encodeURIComponent(String(zoom))}`);
  }
  if (center && zoom != null) {
    params.push(`center=${encodeURIComponent(`${center.lat},${center.lng}`)}`);
  }
  const colors = ['red', 'blue', 'green'];
  points.forEach((p, idx) => {
    if (!p) return;
    const color = colors[idx] || 'gray';
    params.push(`markers=color:${color}|label:${idx + 1}|${encodeURIComponent(`${p.lat},${p.lng}`)}`);
  });
  if (center) {
    params.push(`markers=color:yellow|label:C|${encodeURIComponent(`${center.lat},${center.lng}`)}`);
  }
  if (recommendedTown) {
    params.push(`markers=color:purple|label:T|${encodeURIComponent(`${recommendedTown.lat},${recommendedTown.lng}`)}`);
  }
  params.push(`key=${encodeURIComponent(apiKey)}`);
  return `${base}?${params.join('&')}`;
}

module.exports = {
  isLatLngString,
  geocodeAddress,
  buildStaticMapUrl,
};


