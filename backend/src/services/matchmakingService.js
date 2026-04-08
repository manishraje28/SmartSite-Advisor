/**
 * matchmakingService.js
 * Calculates personalized match percentages for buyers.
 * 
 * The core algorithm: multiply buyer weights against property AI sub-scores,
 * normalize against price preference fit, and produce a 0-100 match percentage.
 */

const Property = require('../models/Property');
const BuyerPreferences = require('../models/BuyerPreferences');

/**
 * Calculate how well a property's price fits the buyer's budget.
 * Returns 0-100 score.
 */
const calculatePriceFit = (price, budget) => {
  if (!budget || (!budget.min && !budget.max)) return 70; // No budget set → neutral

  const min = budget.min || 0;
  const max = budget.max || Infinity;

  if (price >= min && price <= max) {
    // Perfect range — score based on how centered it is
    const mid = (min + max) / 2;
    const deviation = Math.abs(price - mid) / (max - min || 1);
    return Math.round(100 - deviation * 30); // 70-100 range
  }

  if (price < min) {
    const ratio = price / min;
    return Math.max(20, Math.round(ratio * 70));
  }

  // price > max
  const overBudgetRatio = max / price;
  return Math.max(10, Math.round(overBudgetRatio * 60));
};

/**
 * Calculate match percentage for a single property against buyer preferences.
 */
const calculateMatchForProperty = (property, preferences) => {
  const weights = preferences.weights || {
    price: 0.35,
    location: 0.30,
    amenities: 0.20,
    connectivity: 0.10,
    roiPotential: 0.05,
  };

  const aiScore = property.aiScore || {};
  
  // Sub-scores (0-100 each)
  const locationScore = aiScore.locationScore || 50;
  const connectivityScore = aiScore.connectivityScore || 50;
  const amenitiesScore = aiScore.amenitiesScore || 50;
  const roiScore = aiScore.roiPotential || 50;
  const priceFit = calculatePriceFit(property.price, preferences.budget);

  // Weighted sum
  const weightedScore =
    (priceFit * (weights.price || 0.35)) +
    (locationScore * (weights.location || 0.30)) +
    (amenitiesScore * (weights.amenities || 0.20)) +
    (connectivityScore * (weights.connectivity || 0.10)) +
    (roiScore * (weights.roiPotential || 0.05));

  // Bonus for matching preferred locations
  let locationBonus = 0;
  if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
    const city = property.location?.city?.toLowerCase() || '';
    const address = property.location?.address?.toLowerCase() || '';
    const matched = preferences.preferredLocations.some(loc =>
      city.includes(loc.toLowerCase()) || address.includes(loc.toLowerCase())
    );
    if (matched) locationBonus = 5;
  }

  // Bonus for matching property type
  let typeBonus = 0;
  if (preferences.preferredPropertyTypes && preferences.preferredPropertyTypes.length > 0) {
    if (preferences.preferredPropertyTypes.includes(property.propertyType)) {
      typeBonus = 3;
    }
  }

  // Penalty for missing required amenities
  let amenityPenalty = 0;
  if (preferences.requiredAmenities && preferences.requiredAmenities.length > 0) {
    const propAmenities = property.amenities || [];
    const missing = preferences.requiredAmenities.filter(a => !propAmenities.includes(a));
    amenityPenalty = missing.length * 5;
  }

  const finalScore = Math.min(99, Math.max(10,
    Math.round(weightedScore + locationBonus + typeBonus - amenityPenalty)
  ));

  return finalScore;
};

/**
 * Get matched properties for a buyer with personalized match percentages.
 */
const getMatchedProperties = async (buyerId, options = {}) => {
  const { page = 1, limit = 12, minScore = 0, sort = 'match' } = options;

  // Get buyer preferences
  const preferences = await BuyerPreferences.findOne({ user: buyerId });
  
  // Build query filter
  const filter = { status: 'available' };
  
  if (options.city) {
    filter['location.city'] = new RegExp(options.city, 'i');
  }
  if (options.propertyType) {
    filter.propertyType = options.propertyType;
  }
  if (options.minPrice || options.maxPrice) {
    filter.price = {};
    if (options.minPrice) filter.price.$gte = Number(options.minPrice);
    if (options.maxPrice) filter.price.$lte = Number(options.maxPrice);
  }
  if (options.bedrooms) {
    filter['specifications.bedrooms'] = Number(options.bedrooms);
  }

  // Fetch properties
  const properties = await Property.find(filter)
    .populate('seller', 'name email phone')
    .lean();

  // Calculate match percentages
  const matchedProperties = properties.map(property => {
    const matchPercentage = preferences
      ? calculateMatchForProperty(property, preferences)
      : (property.aiScore?.overall || 50);

    return {
      ...property,
      matchPercentage,
    };
  });

  // Filter by minimum score
  const filtered = matchedProperties.filter(p => p.matchPercentage >= minScore);

  // Sort
  if (sort === 'match') {
    filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);
  } else if (sort === 'price_asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === 'score') {
    filtered.sort((a, b) => (b.aiScore?.overall || 0) - (a.aiScore?.overall || 0));
  }

  // Paginate
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    properties: paginated,
    total: filtered.length,
    page: Number(page),
    pages: Math.ceil(filtered.length / limit),
  };
};

module.exports = {
  calculateMatchForProperty,
  getMatchedProperties,
  calculatePriceFit,
};
