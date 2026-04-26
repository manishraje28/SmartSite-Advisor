/**
 * propertyService.js
 * Business logic layer for Property management.
 *
 * Why? Separating DB logic from controllers makes it reusable.
 * For example, an AI agent could call these methods directly
 * without needing an HTTP request.
 */

const { Property, SellerInsights } = require('../models');
const scoringService = require('./scoringService');
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
    if (!validation.isValid) {
      console.warn(`[Scoring] Validation failed for property ${property._id}: ${validation.errors.join(', ')}`);
      return;
    }

    // Call Python Scoring Engine
    const aiScore = await scoringService.scoreProperty(property);

    if (aiScore) {
      // Update property with aiScore
      property.aiScore = aiScore;
      property.aiScore.lastScoredAt = new Date();
      await property.save();
      console.log(`[Scoring] Successfully scored property ${property._id}: overall=${aiScore.overall}`);

      // Dynamically Generate AI Insights for the Seller
      const suggestions = [];

      if (aiScore.breakdown?.location?.reasoning) {
        suggestions.push({ type: 'targeting', priority: 'medium', impact: 10, message: aiScore.breakdown.location.reasoning.split('.')[0] });
      }
      if (aiScore.breakdown?.connectivity?.reasoning) {
        suggestions.push({ type: 'description', priority: 'high', impact: 15, message: aiScore.breakdown.connectivity.reasoning });
      }
      if (aiScore.breakdown?.amenities?.reasoning) {
        suggestions.push({ type: 'amenity', priority: 'low', impact: 5, message: aiScore.breakdown.amenities.reasoning });
      }
      if (aiScore.breakdown?.roiPotential?.reasoning) {
        suggestions.push({ type: 'pricing', priority: 'high', impact: 20, message: aiScore.breakdown.roiPotential.reasoning });
      }

      await SellerInsights.findOneAndUpdate(
        { property: property._id },
        {
          $set: {
            seller: property.seller,
            'currentScore.overall': aiScore.overall || 70,
            'currentScore.locationScore': aiScore.locationScore || 70,
            'currentScore.connectivityScore': aiScore.connectivityScore || 70,
            'currentScore.amenitiesScore': aiScore.amenitiesScore || 70,
            'currentScore.roiPotential': aiScore.roiPotential || 70,
            demandStats: {
              totalViews: property.views || 0,
              uniqueViews: Math.round((property.views || 0) * 0.7),
              totalSaves: property.saves || 0,
              totalInquiries: property.inquiries || 0,
              weeklyTrend: [
                { week: 'Current', views: property.views || 0, inquiries: property.inquiries || 0 }
              ]
            },
            demandLevel: 'moderate',
            buyerSegmentMatch: { family: 60, investor: 50, bachelors: 30 },
            topTargetSegment: 'family',
            improvementSuggestions: suggestions.length ? suggestions : [{ type: 'imagery', priority: 'medium', impact: 20, message: 'Add better property images to increase views.' }],
            lastAiAnalysisAt: new Date(),
            analysisVersion: '1.2.0 (Dynamic)'
          },
          $push: {
            scoreHistory: {
              score: aiScore.overall || 70,
              recordedAt: new Date(),
              reason: 'AI Scoring Engine Analysis'
            }
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Scoring] Dynamic SellerInsights upserted for property ${property._id}`);
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
 * Increments the view count dynamically.
 * @param {String} id - The MongoDB ObjectID.
 */
const getPropertyById = async (id) => {
  const property = await Property.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('seller', 'name email');

  if (property) {
    await SellerInsights.updateOne(
      { property: id },
      { $inc: { 'demandStats.totalViews': 1 } }
    ).catch(err => console.error('Failed to increment SellerInsights views:', err));
  }

  return property;
};

/**
 * Saves/Likes a property, incrementing the save count.
 * @param {String} id - The MongoDB ObjectID.
 */
const saveProperty = async (id) => {
  const property = await Property.findByIdAndUpdate(
    id,
    { $inc: { saves: 1 } },
    { new: true }
  );

  if (property) {
    await SellerInsights.updateOne(
      { property: id },
      { $inc: { 'demandStats.totalSaves': 1 } }
    ).catch(err => console.error('Failed to increment SellerInsights saves:', err));
  }

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
  saveProperty,
  updateProperty,
  deleteProperty,
};
