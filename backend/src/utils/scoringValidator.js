/**
 * scoringValidator.js
 * Validates property data before sending to Python Scoring Engine.
 *
 * Checks:
 * - Required fields (location.city, specifications)
 * - Valid amenities format
 * - Price is numeric and positive
 */

/**
 * Validates property data for scoring.
 *
 * @param {Object} property - Property object (from Mongoose or plain object)
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePropertyForScoring = (property) => {
  const errors = [];

  // Check location exists and has city
  if (!property.location) {
    errors.push('Property must have location');
  } else if (!property.location.city) {
    errors.push('Property location must include city');
  }

  // Check location has valid coordinates
  if (property.location && property.location.coordinates) {
    if (!Array.isArray(property.location.coordinates) || property.location.coordinates.length !== 2) {
      errors.push('Location coordinates must be [longitude, latitude]');
    } else {
      const [lon, lat] = property.location.coordinates;
      if (lon < -180 || lon > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
    }
  } else {
    errors.push('Property location must include coordinates');
  }

  // Check price is positive number
  if (typeof property.price !== 'number' || property.price <= 0) {
    errors.push('Property price must be a positive number');
  }

  // Check amenities is an array
  if (property.amenities && !Array.isArray(property.amenities)) {
    errors.push('Amenities must be an array');
  }

  // Check amenities are strings
  if (property.amenities && Array.isArray(property.amenities)) {
    const nonStringAmenities = property.amenities.filter((a) => typeof a !== 'string');
    if (nonStringAmenities.length > 0) {
      errors.push('All amenities must be strings');
    }
  }

  // Check specifications object exists (can be empty, but must exist)
  if (!property.specifications || typeof property.specifications !== 'object') {
    errors.push('Property specifications must be an object');
  }

  // Check property type
  if (!property.propertyType) {
    errors.push('Property must have a type');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Checks if property has minimum data for meaningful scoring.
 * Some properties may score lower if missing optional fields, but scoring should proceed.
 *
 * @param {Object} property - Property object
 * @returns {string[]} - Array of warnings (non-blocking)
 */
const validatePropertyCompleteness = (property) => {
  const warnings = [];

  if (!property.location.address) {
    warnings.push('Property address is empty - will use generic address scoring');
  }

  if (!property.specifications.age) {
    warnings.push('Property age not specified - amenities modernization score may be inaccurate');
  }

  if (!property.specifications.bedrooms) {
    warnings.push('Property bedroom count not specified');
  }

  if (!property.amenities || property.amenities.length === 0) {
    warnings.push('Property has no amenities listed - amenities score will be low');
  }

  return warnings;
};

module.exports = {
  validatePropertyForScoring,
  validatePropertyCompleteness,
};
