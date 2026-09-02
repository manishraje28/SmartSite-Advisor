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
      const candidates = results.slice(0, 5).map(r => ({
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
