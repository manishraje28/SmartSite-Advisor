/**
 * propertyService.js
 * Business logic layer for Property management.
 *
 * Why? Separating DB logic from controllers makes it reusable.
 * For example, an AI agent could call these methods directly
 * without needing an HTTP request.
 */

const { Property } = require('../models');
const scoringService = require('./scoringService');
const weatherService = require('./openWeatherService');
const { validatePropertyForScoring } = require('../utils/scoringValidator');

/**
 * Creates a new property.
 * @param {Object} propertyData - The fields for the new property.
 */
const createProperty = async (propertyData) => {
  const property = await Property.create(propertyData);

  // Non-blocking: Score the property in the background
  // If scoring fails, property is still created and returned successfully
  scoringPropertyAsync(property).catch((err) => {
    console.error(`[Property] Non-blocking scoring failed for ${property._id}:`, err.message);
  });

  return property;
};

/**
 * Scores a property asynchronously (non-blocking).
 * Calls Python Scoring Engine and updates property.aiScore if successful.
 *
 * @param {Object} property - Mongoose Property document
 */
const scoringPropertyAsync = async (property) => {
  try {
    // Validate property before scoring
    const validation = validatePropertyForScoring(property.toObject());
    const canRunAiScore = validation.isValid;
    if (!canRunAiScore) {
      console.warn(`[Scoring] Validation failed for property ${property._id}: ${validation.errors.join(', ')}`);
    }

    const [aiScore, environmentScore] = await Promise.all([
      canRunAiScore ? scoringService.scoreProperty(property) : Promise.resolve(null),
      weatherService.getEnvironmentalInsights(property),
    ]);

    if (aiScore) {
      property.aiScore = aiScore;
      property.aiScore.lastScoredAt = new Date();
      console.log(`[Scoring] Successfully scored property ${property._id}: overall=${aiScore.overall}`);
    }

    if (environmentScore) {
      property.environmentScore = environmentScore;
      console.log(`[Weather] Successfully scored property ${property._id}: env=${environmentScore.overall}`);
    }

    if (aiScore || environmentScore) {
      await property.save();
    }
  } catch (error) {
    console.error(`[Scoring] Error in scoringPropertyAsync:`, error.message);
  }
};

/**
 * Retrieves properties with filtration and sorting.
 * @param {Object} filters - Search filters (city, type, price range).
 * @param {Object} options - Pagination/sorting options.
 */
const getAllProperties = async (filters = {}, options = {}) => {
  const { city, propertyType, minPrice, maxPrice, status = 'available' } = filters;
  const { sort = { createdAt: -1 }, limit = 10, skip = 0 } = options;

  const query = { status };
  
  if (city) query['location.city'] = { $regex: city, $options: 'i' };
  if (propertyType) query.propertyType = propertyType;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const properties = await Property.find(query)
    .sort(sort)
    .limit(Number(limit))
    .skip(Number(skip))
    .populate('seller', 'name email'); // Populate basic seller info for UI

  const total = await Property.countDocuments(query);

  return { properties, total, limit, skip };
};

/**
 * Fetches a single property by ID.
 * @param {String} id - The MongoDB ObjectID.
 */
const getPropertyById = async (id) => {
  const property = await Property.findById(id).populate('seller', 'name email');
  return property;
};

/**
 * Updates an existing property.
 * @param {String} id - The MongoDB ObjectID.
 * @param {Object} updateData - Partially updated fields.
 */
const updateProperty = async (id, updateData) => {
  const property = await Property.findByIdAndUpdate(id, updateData, {
    new: true, // Return the modified document
    runValidators: true, // Run schema validators on the update
  });
  return property;
};

/**
 * Deletes a property.
 * @param {String} id - The MongoDB ObjectID.
 */
const deleteProperty = async (id) => {
  const property = await Property.findByIdAndDelete(id);
  return property;
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};
