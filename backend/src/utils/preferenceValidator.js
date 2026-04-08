/**
 * preferenceValidator.js
 * Validation helpers for buyer preferences.
 *
 * Ensures incoming preference data conforms to business rules:
 * - Budget ranges are valid
 * - Weights sum to 1.0
 * - Geospatial coordinates are valid
 * - Enum values are allowed
 */

/**
 * Validate the entire preference data object.
 * Throws an error with statusCode if validation fails.
 *
 * @param {Object} data - The preference data to validate
 * @throws {Error} with statusCode property if validation fails
 */
const validatePreferenceData = (data) => {
  // Validate budget if provided
  if (data.budget) {
    validateBudget(data.budget);
  }

  // Validate weights if provided
  if (data.weights) {
    validateWeights(data.weights);
  }

  // Validate reference point if provided
  if (data.referencePoint) {
    validateReferencePoint(data.referencePoint);
  }

  // Validate maxDistanceKm if provided
  if (data.maxDistanceKm !== undefined && data.maxDistanceKm !== null) {
    if (typeof data.maxDistanceKm !== 'number' || data.maxDistanceKm < 0) {
      const error = new Error('maxDistanceKm must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate minBedrooms if provided
  if (data.minBedrooms !== undefined && data.minBedrooms !== null) {
    if (typeof data.minBedrooms !== 'number' || data.minBedrooms < 0) {
      const error = new Error('minBedrooms must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate minCarpetAreaSqFt if provided
  if (data.minCarpetAreaSqFt !== undefined && data.minCarpetAreaSqFt !== null) {
    if (typeof data.minCarpetAreaSqFt !== 'number' || data.minCarpetAreaSqFt < 0) {
      const error = new Error('minCarpetAreaSqFt must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate buyerSegment if provided
  if (data.buyerSegment) {
    const validSegments = ['family', 'investor', 'student', 'bachelor', 'retiree'];
    if (!validSegments.includes(data.buyerSegment)) {
      const error = new Error(`buyerSegment must be one of: ${validSegments.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate preferredPropertyTypes if provided
  if (Array.isArray(data.preferredPropertyTypes)) {
    const validTypes = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Shop', 'Farmhouse', 'Studio'];
    data.preferredPropertyTypes.forEach((type) => {
      if (!validTypes.includes(type)) {
        const error = new Error(`preferredPropertyTypes contains invalid type: ${type}. Valid types: ${validTypes.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    });
  }

  // Validate listingPreference if provided
  if (data.listingPreference) {
    const validListingPrefs = ['Sale', 'Rent', 'Lease', 'Any'];
    if (!validListingPrefs.includes(data.listingPreference)) {
      const error = new Error(`listingPreference must be one of: ${validListingPrefs.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate furnishingPreference if provided
  if (Array.isArray(data.furnishingPreference)) {
    const validFurnishing = ['Unfurnished', 'Semi-Furnished', 'Fully-Furnished', 'Any'];
    data.furnishingPreference.forEach((pref) => {
      if (!validFurnishing.includes(pref)) {
        const error = new Error(`furnishingPreference contains invalid value: ${pref}. Valid values: ${validFurnishing.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
    });
  }
};

/**
 * Validate budget range: min <= max
 *
 * @param {Object} budget - {min, max}
 * @throws {Error} if budget is invalid
 */
const validateBudget = (budget) => {
  if (!budget || typeof budget !== 'object') {
    const error = new Error('budget must be an object with min and max');
    error.statusCode = 400;
    throw error;
  }

  const { min, max } = budget;

  if (min !== undefined && min !== null) {
    if (typeof min !== 'number' || min < 0) {
      const error = new Error('budget.min must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
  }

  if (max !== undefined && max !== null) {
    if (typeof max !== 'number' || max < 0) {
      const error = new Error('budget.max must be a non-negative number');
      error.statusCode = 400;
      throw error;
    }
  }

  // Check min <= max
  if (min !== undefined && max !== undefined && min !== null && max !== null) {
    if (min > max) {
      const error = new Error(`budget.min (${min}) cannot be greater than budget.max (${max})`);
      error.statusCode = 400;
      throw error;
    }
  }
};

/**
 * Validate AI personalization weights sum to 1.0
 * Allows small floating-point tolerance (0.0001).
 *
 * @param {Object} weights - {price, location, amenities, connectivity, roiPotential}
 * @throws {Error} if weights don't sum to 1.0
 */
const validateWeights = (weights) => {
  if (!weights || typeof weights !== 'object') {
    const error = new Error('weights must be an object');
    error.statusCode = 400;
    throw error;
  }

  const allowedKeys = ['price', 'location', 'amenities', 'connectivity', 'roiPotential'];

  // Validate all values are in range [0, 1]
  Object.entries(weights).forEach(([key, value]) => {
    if (allowedKeys.includes(key)) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        const error = new Error(`weights.${key} must be a number between 0 and 1`);
        error.statusCode = 400;
        throw error;
      }
    } else {
      const error = new Error(`Invalid weight key: ${key}. Allowed: ${allowedKeys.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  });

  // Calculate sum with tolerance for floating-point precision
  const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
  const tolerance = 0.0001;

  if (Math.abs(sum - 1.0) > tolerance) {
    const error = new Error(`Weights must sum to 1.0. Current sum: ${sum.toFixed(4)}`);
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Validate GeoJSON Point format and coordinates.
 * Format: { type: 'Point', coordinates: [longitude, latitude] }
 *
 * @param {Object} point - GeoJSON Point object
 * @throws {Error} if point is invalid
 */
const validateReferencePoint = (point) => {
  if (!point || typeof point !== 'object') {
    const error = new Error('referencePoint must be a GeoJSON Point object');
    error.statusCode = 400;
    throw error;
  }

  if (point.type !== 'Point') {
    const error = new Error('referencePoint.type must be "Point"');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(point.coordinates)) {
    const error = new Error('referencePoint.coordinates must be an array [longitude, latitude]');
    error.statusCode = 400;
    throw error;
  }

  if (point.coordinates.length !== 2) {
    const error = new Error('referencePoint.coordinates must have exactly 2 elements [longitude, latitude]');
    error.statusCode = 400;
    throw error;
  }

  const [longitude, latitude] = point.coordinates;

  // Validate longitude range: [-180, 180]
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    const error = new Error(`Invalid longitude ${longitude}. Must be between -180 and 180`);
    error.statusCode = 400;
    throw error;
  }

  // Validate latitude range: [-90, 90]
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    const error = new Error(`Invalid latitude ${latitude}. Must be between -90 and 90`);
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  validatePreferenceData,
  validateBudget,
  validateWeights,
  validateReferencePoint,
};
