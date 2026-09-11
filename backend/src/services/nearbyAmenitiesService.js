require('dotenv').config();
const axios = require('axios');
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const { getEnvironmentalInsights } = require('./openWeatherService');

const AMENITY_TYPES = {
  hospitals: 'hospital',
  schools: 'school',
  parks: 'park',
  transit: 'transit_station',
  supermarkets: 'supermarket',
  malls: 'shopping_mall',
};

// Google's Places categories are noisy in practice — a coaching class or a
// generic shop can come back tagged under `school`/`hospital`/etc. This is a
// best-effort name-based filter to keep out the most obvious mismatches
// (e.g. "XYZ Coaching Classes" showing up as the nearest "school"). It can't
// be perfect — a real school literally named "... Institute" would also get
// excluded — but it removes most of the noise.
const NAME_DENYLIST = {
  schools: [/coaching/i, /tuition/i, /tution/i, /\btrain(er|ing)?\b/i, /\bclasses\b/i, /\binstitute\b/i, /\bacademy\b/i, /driving school/i, /\bonline\b/i, /platform/i, /\byog(a)?\b/i, /\bland\b/i, /real estate/i],
  malls: [/supermarket/i, /grocery/i, /\bkirana\b/i, /general store/i, /housing society/i, /co-?op(erative)?/i, /\bapartment/i, /\bsaree\b/i, /\boutfit\b/i, /\bwear\b/i, /\bstore\b/i],
  supermarkets: [/\bmall\b/i],
  hospitals: [/pharmacy/i, /chemist/i, /medical store/i, /diagnostic/i, /pathology/i],
  transit: [],
  parks: [],
};

// A second, more reliable signal alongside the name denylist above: Google's
// own `types` array on a result sometimes reveals a mismatch the name alone
// doesn't (e.g. a residential building tagged `shopping_mall`, or a shop
// tagged `school`) — exclude results whose types include a category that's
// clearly unrelated to what we actually asked for.
const EXCLUDE_TYPES = {
  schools: ['clothing_store', 'shoe_store', 'store', 'book_store', 'real_estate_agency', 'lodging', 'premise', 'restaurant', 'cafe', 'beauty_salon', 'gym', 'spa', 'real_estate_agency'],
  malls: ['clothing_store', 'shoe_store', 'electronics_store', 'jewelry_store', 'book_store', 'furniture_store', 'home_goods_store', 'store', 'real_estate_agency', 'lodging', 'premise', 'general_contractor'],
  supermarkets: ['shopping_mall'],
  hospitals: ['pharmacy'],
  transit: [],
  parks: [],
};

const isDenylisted = (key, name) => {
  const patterns = NAME_DENYLIST[key];
  if (!patterns || !name) return false;
  return patterns.some((pattern) => pattern.test(name));
};

const hasExcludedType = (key, types) => {
  const exclude = EXCLUDE_TYPES[key];
  if (!exclude || !types) return false;
  return types.some((t) => exclude.includes(t));
};

/**
 * Finds the nearest amenities of each type to a specific point, sorted strictly
 * by real distance (not Google's default "prominence" ranking, which can surface
 * a bigger/more-reviewed place over one that's actually closer).
 *
 * Uses Places Nearby Search with `rankby=distance` (returns up to 20 results already
 * ordered nearest-first, per Google's own ranking) as a candidate pool, then confirms
 * real distance/duration via the Distance Matrix API and re-sorts on that — so the
 * final "top 3" are genuinely the 3 closest, with accurate distance/time to show.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radius=2000] - soft cutoff in meters; if nothing qualifies within
 *   it, falls back to the nearest available results anyway rather than returning empty.
 */
async function getNearbyAmenities(lat, lng, radius = 2000) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key not configured.");
    return null;
  }

  const amenitiesData = {};

  const promises = Object.entries(AMENITY_TYPES).map(async ([key, type]) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            rankby: 'distance', // strictly nearest-first; cannot be combined with `radius`
            type,
            key: GOOGLE_MAPS_API_KEY
          }
        }
      );

      const results = response.data.results || [];
      const candidates = results
        .filter((r) => !isDenylisted(key, r.name) && !hasExcludedType(key, r.types))
        .slice(0, 5)
        .map(r => ({
          name: r.name,
          location: r.geometry.location,
          rating: r.rating,
          vicinity: r.vicinity,
          type: key
        }));

      const withDistance = await getDistancesToAmenities(lat, lng, candidates);
      const withinRadius = withDistance.filter((a) => a.distanceValue <= radius);
      const nearest = (withinRadius.length > 0 ? withinRadius : withDistance)
        .sort((a, b) => a.distanceValue - b.distanceValue)
        .slice(0, 3);

      amenitiesData[key] = {
        count: results.length,
        top: nearest
      };
    } catch (error) {
      console.error(`Error fetching ${key}:`, error.message);
      amenitiesData[key] = { count: 0, top: [] };
    }
  });

  await Promise.all(promises);
  return amenitiesData;
}

// Distance Matrix
async function getDistancesToAmenities(propertyLat, propertyLng, amenitiesList) {
  if (!GOOGLE_MAPS_API_KEY || !amenitiesList || amenitiesList.length === 0) return [];
  
  // Format: "lat,lng|lat,lng|..."
  const destinations = amenitiesList.map(a => `${a.location.lat},${a.location.lng}`).join('|');
  
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: `${propertyLat},${propertyLng}`,
          destinations,
          mode: 'driving',
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    const distances = response.data.rows[0].elements;
    return amenitiesList.map((amenity, index) => {
      const distData = distances[index];
      return {
        ...amenity,
        distanceText: distData?.status === 'OK' ? distData.distance.text : 'N/A',
        distanceValue: distData?.status === 'OK' ? distData.distance.value : 999999,
        durationText: distData?.status === 'OK' ? distData.duration.text : 'N/A'
      };
    });
  } catch (error) {
    console.error('Error fetching distances:', error.message);
    return amenitiesList;
  }
}

async function enhancePropertyWithLivability(property) {
  if (!property.location || !property.location.coordinates) return property;
  
  // GeoJSON coordinates are [longitude, latitude]
  const [lng, lat] = property.location.coordinates;
  const [amenities, environmentScore] = await Promise.all([
    getNearbyAmenities(lat, lng),
    getEnvironmentalInsights(property),
  ]);

  if (!amenities && !environmentScore) return property;

  const enhancedProperty = { ...property };

  if (environmentScore) {
    enhancedProperty.environmentScore = environmentScore;
  }

  if (!amenities) {
    return enhancedProperty;
  }

  // getNearbyAmenities already sorts nearest-first and annotates each entry with
  // real distance/duration, so the top-1-per-category is already what we need here
  // without a second, redundant Distance Matrix call.
  const amenitiesWithDistance = [];
  Object.values(amenities).forEach((cat) => {
    if (cat.top.length > 0) amenitiesWithDistance.push(cat.top[0]);
  });

  // Calculate Livability & Connectivity Scores out of 100
  let livabilityScore = 40; 
  let connectivityScore = 40;

  if (amenities.hospitals.count > 0) livabilityScore += 15;
  if (amenities.schools.count > 0) livabilityScore += 15;
  if (amenities.parks.count > 0) livabilityScore += 15;
  if (amenities.supermarkets.count > 0) livabilityScore += 15;

  if (amenities.transit.count > 0) connectivityScore += 40;
  
  let avgDistance = 0;
  let validDists = 0;
  amenitiesWithDistance.forEach(a => {
    if (a.distanceValue < 999999) {
      avgDistance += a.distanceValue;
      validDists++;
    }
  });

  if (validDists > 0) {
    avgDistance = avgDistance / validDists;
    if (avgDistance < 1000) { livabilityScore += 10; connectivityScore += 20; }
    else if (avgDistance > 3000) { livabilityScore -= 10; connectivityScore -= 10; }
  }
  
  livabilityScore = Math.min(100, Math.max(0, Math.round(livabilityScore)));
  connectivityScore = Math.min(100, Math.max(0, Math.round(connectivityScore)));
  
  return {
    ...enhancedProperty,
    realAmenities: amenities,
    topAmenitiesMap: amenitiesWithDistance,
    livabilityScore,
    connectivityScore
  };
}

module.exports = {
  getNearbyAmenities,
  getDistancesToAmenities,
  enhancePropertyWithLivability
};
