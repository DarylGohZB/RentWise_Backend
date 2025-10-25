const towns = require('../dataset/towns.json');
const flatTypesData = require('../dataset/flatTypes.json');
const { getAllTownStatsByFlatType } = require('../model/GovHouseDataModel');
const geocodingService = require('./geocodingService');

/**
 * Generate a random color in hex format
 * @returns {string} Hex color like "#EC4899"
 */
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Generate unique random colors for all towns
 * @param {number} count - Number of unique colors needed
 * @returns {string[]} Array of unique hex colors
 */
function generateUniqueColors(count) {
  // Generate visually distinct, map-friendly colors using HSL
  // We use golden-angle spacing on hue to maximize perceptual difference.
  // Keep saturation and lightness in moderate ranges so colors show well on map tiles.
  function hslToHex(h, s, l) {
    // h: 0-360, s,l: 0-100
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const val = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * val).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  }

  const GOLDEN_ANGLE = 137.50776405003785; // degrees
  const colors = [];

  // Choose base saturation/lightness values good for maps.
  // Slightly lower saturation and mid lightness to avoid neon or washed-out colors.
  const baseS = 62; // percent
  const baseL = 52; // percent

  for (let i = 0; i < count; i++) {
    const hue = (i * GOLDEN_ANGLE) % 360;
    // small jitter on lightness to avoid adjacent similar tones
    const l = baseL + ( (i % 3) - 1 ) * 4; // -4,0,+4 cycle
    colors.push(hslToHex(hue, baseS, l));
  }

  return colors;
}

/**
 * Format price as currency string
 * @param {number|null} price - Price in dollars
 * @returns {string} Formatted price like "$2,400" or "N/A"
 */
function formatPrice(price) {
  if (price == null || isNaN(price)) {
    return 'N/A';
  }
  
  // Format with comma separator and dollar sign
  return `$${price.toLocaleString('en-US')}`;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check which town a postal code belongs to by finding the closest town
 * @param {string} postalCode - 6-digit Singapore postal code
 * @returns {Promise<string|null>} Town name or null if not found
 */
async function checkTownByPostalCode(postalCode) {
  console.log('[SERVICES/MAPSERVICE] checkTownByPostalCode called for postal code:', postalCode);
  
  try {
    // Validate postal code format
    if (!postalCode || typeof postalCode !== 'string' || !/^\d{6}$/.test(postalCode)) {
      console.warn('[SERVICES/MAPSERVICE] Invalid postal code format:', postalCode);
      return null;
    }

    // Geocode the postal code to get lat/lng
    const geocodeResult = await geocodingService.geocodeAddress(postalCode);
    if (!geocodeResult || !geocodeResult.location) {
      console.warn('[SERVICES/MAPSERVICE] Failed to geocode postal code:', postalCode);
      return null;
    }

    const { lat: postalLat, lng: postalLng } = geocodeResult.location;
    console.log('[SERVICES/MAPSERVICE] Postal code coordinates:', postalLat, postalLng);

    // Find the closest town using spatial indexing approach
    let closestTown = null;
    let minDistance = Infinity;

    // Use spatial indexing: first check towns within a reasonable bounding box
    // Singapore is roughly bounded by lat: 1.2-1.5, lng: 103.6-104.0
    const BOUNDING_BOX_MARGIN = 0.1; // ~11km margin
    const relevantTowns = towns.filter(town => 
      town.lat >= postalLat - BOUNDING_BOX_MARGIN &&
      town.lat <= postalLat + BOUNDING_BOX_MARGIN &&
      town.lng >= postalLng - BOUNDING_BOX_MARGIN &&
      town.lng <= postalLng + BOUNDING_BOX_MARGIN
    );

    console.log('[SERVICES/MAPSERVICE] Found', relevantTowns.length, 'towns in bounding box');

    // If no towns in bounding box, check all towns (fallback)
    const townsToCheck = relevantTowns.length > 0 ? relevantTowns : towns;

    // Calculate distances to find closest town
    for (const town of townsToCheck) {
      const distance = calculateDistance(postalLat, postalLng, town.lat, town.lng);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestTown = town.name;
      }
    }

    // Set a reasonable threshold - if closest town is > 20km away, consider it invalid
    const MAX_DISTANCE_THRESHOLD = 20; // kilometers
    if (minDistance > MAX_DISTANCE_THRESHOLD) {
      console.warn('[SERVICES/MAPSERVICE] Closest town is too far:', minDistance, 'km from', closestTown);
      return null;
    }

    console.log('[SERVICES/MAPSERVICE] Found closest town:', closestTown, 'at distance:', minDistance.toFixed(2), 'km');
    return closestTown;

  } catch (err) {
    console.error('[SERVICES/MAPSERVICE] checkTownByPostalCode error:', err);
    return null;
  }
}

module.exports = {
  checkTownByPostalCode,
  /**
   * Get town data with coordinates, average prices by room type, and unique colors
   * @returns {Promise<Array>} Array of town objects with name, lat, lng, avgPrice (by room type), color
   */
  getTownData: async function () {
    console.log('[SERVICES/MAPSERVICE] getTownData called');
    
    try {
      // Fetch average prices for all towns grouped by room type
      const townStatsMap = await getAllTownStatsByFlatType();
      console.log('[SERVICES/MAPSERVICE] Retrieved stats for', townStatsMap.size, 'towns');
      
      // Generate unique colors for all towns
      const uniqueColors = generateUniqueColors(towns.length);
      
      // Get flat types from dataset
      const flatTypes = flatTypesData.flatType || [];
      
      // Map towns with their data
      const townData = towns.map((town, index) => {
        const townStats = townStatsMap.get(town.name.toUpperCase()) || {};
        
        // Debug: Log town stats to see what's available
        if (index === 0) {
          console.log('[SERVICES/MAPSERVICE] Sample townStats for', town.name, ':', townStats);
          console.log('[SERVICES/MAPSERVICE] Available flatTypes in stats:', Object.keys(townStats));
        }
        
        // Build avgPrice object with [flatType, price] pairs
        const avgPrice = {};
        flatTypes.forEach(flatType => {
          // Database already stores in "1-ROOM" format, so use directly
          const price = townStats[flatType];
          
          // Debug first town
          if (index === 0) {
            console.log('[SERVICES/MAPSERVICE] Mapping', flatType, '= $', price);
          }
          
          avgPrice[flatType] = formatPrice(price);
        });
        
        return {
          name: town.name,
          lat: town.lat,
          lng: town.lng,
          coords:town.coords,
          avgPrice: avgPrice, // Calculated from backend, grouped by town and averaged
          color: uniqueColors[index],
        };
      });
      
      console.log('[SERVICES/MAPSERVICE] Processed', townData.length, 'towns');
      return { ok: true, data: townData };
      
    } catch (err) {
      console.error('[SERVICES/MAPSERVICE] getTownData error:', err);
      return { ok: false, error: err };
    }
  },
};
