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

async function getNearbyAmenities(lat, lng, radius = 2000) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key not configured.");
    return null;
  }
  
  const amenitiesData = {};
  
  // To avoid hitting quota limits or throttling, run these sequentially or with small delay if necessary.
  // Running in parallel here since we typically compare 2 properties.
  const promises = Object.entries(AMENITY_TYPES).map(async ([key, type]) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            radius,
            type,
            key: GOOGLE_MAPS_API_KEY
          }
        }
      );
      
      const results = response.data.results || [];
      const topResults = results.slice(0, 3).map(r => ({
        name: r.name,
        location: r.geometry.location,
        rating: r.rating,
        vicinity: r.vicinity,
        type: key
      }));
      
      amenitiesData[key] = {
        count: results.length,
        top: topResults
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

  // Gather the top 1 amenity from each category to calculate distances
  const topAmenities = [];
  Object.values(amenities).forEach(cat => {
    if (cat.top.length > 0) topAmenities.push(cat.top[0]);
  });
  
  const amenitiesWithDistance = await getDistancesToAmenities(lat, lng, topAmenities);
  
  // Add distances back to the main categories for the frontend
  amenitiesWithDistance.forEach(awd => {
    const categoryTop = amenities[awd.type].top;
    const match = categoryTop.find(a => a.name === awd.name);
    if (match) {
      match.distanceText = awd.distanceText;
      match.durationText = awd.durationText;
      match.distanceValue = awd.distanceValue;
    }
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
