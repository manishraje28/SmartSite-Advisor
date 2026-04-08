/**
 * sellerInsightsService.js
 * Business logic layer for Seller Insights management.
 *
 * Handles:
 * - Fetching seller's property insights (paginated, sorted)
 * - Retrieving individual property insights
 * - Marking improvement suggestions as resolved
 * - Aggregating analytics across seller's properties
 *
 * Why separate? So admin dashboards and AI systems can call these methods
 * without needing an HTTP request. Also simplifies testing.
 */

const { SellerInsights, User, Property } = require('../models');
const mongoose = require('mongoose');
const { validateSellerRole, validateObjectId, validatePaginationParams } = require('../utils/sellerValidator');

/**
 * Fetches all insights for a seller's properties with pagination and sorting.
 *
 * @param {String} sellerId - MongoDB ObjectId of the seller (User)
 * @param {Object} options - Pagination and sorting options
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Items per page (default: 10, max: 100)
 * @param {String} options.sort - Sort field: 'score', 'demand', 'updated' (default: 'score')
 * @returns {Object} { insights, total, page, limit }
 */
const getSellerInsights = async (sellerId, options = {}) => {
  // Validate seller exists and has 'seller' role
  await validateSellerRole(sellerId);

  // Validate pagination parameters
  const { page = 1, limit = 10, sort = 'score' } = options;
  validatePaginationParams(page, limit, sort);

  // Build sort object
  let sortObj = {};
  if (sort === 'score') {
    sortObj = { 'currentScore.overall': -1 }; // High to low
  } else if (sort === 'demand') {
    sortObj = { demandLevel: -1 };
  } else if (sort === 'updated') {
    sortObj = { updatedAt: -1 };
  }

  const skip = (page - 1) * limit;

  // Query insights for this seller
  const insights = await SellerInsights.find({ seller: sellerId })
    .sort(sortObj)
    .limit(Number(limit))
    .skip(Number(skip))
    .populate('property', 'title price propertyType status location views saves inquiries')
    .lean();

  // Get total count for pagination
  const total = await SellerInsights.countDocuments({ seller: sellerId });

  return {
    insights,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / limit)
  };
};

/**
 * Fetches a single property's insights with full details.
 * Validates that the seller owns this property.
 *
 * @param {String} propertyId - MongoDB ObjectId of the property
 * @param {String} sellerId - MongoDB ObjectId of the seller
 * @returns {Object} Complete SellerInsights document
 */
const getPropertyInsight = async (propertyId, sellerId) => {
  // Validate IDs format
  validateObjectId(propertyId, 'propertyId');
  validateObjectId(sellerId, 'sellerId');

  // Validate seller exists and has 'seller' role
  await validateSellerRole(sellerId);

  // Fetch the property to verify ownership
  const property = await Property.findById(propertyId);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }

  // Check ownership
  if (property.seller.toString() !== sellerId) {
    const error = new Error('You do not have access to this property');
    error.statusCode = 403;
    throw error;
  }

  // Fetch and return insights
  const insight = await SellerInsights.findOne({ property: propertyId })
    .populate('property', 'title price propertyType status location views saves inquiries')
    .populate('seller', 'name email');

  if (!insight) {
    const error = new Error('Insights not yet generated for this property');
    error.statusCode = 404;
    throw error;
  }

  return insight;
};

/**
 * Marks an improvement suggestion as resolved by the seller.
 * Updates the timestamp when the seller acted on it.
 *
 * @param {String} propertyId - MongoDB ObjectId of the property
 * @param {String} suggestionId - MongoDB ObjectId of the suggestion
 * @param {String} sellerId - MongoDB ObjectId of the seller
 * @returns {Object} Updated SellerInsights document
 */
const resolveSuggestion = async (propertyId, suggestionId, sellerId) => {
  // Validate IDs format
  validateObjectId(propertyId, 'propertyId');
  validateObjectId(suggestionId, 'suggestionId');
  validateObjectId(sellerId, 'sellerId');

  // Validate seller exists and has 'seller' role
  await validateSellerRole(sellerId);

  // Fetch the property to verify ownership
  const property = await Property.findById(propertyId);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }

  // Check ownership
  if (property.seller.toString() !== sellerId) {
    const error = new Error('You do not have access to this property');
    error.statusCode = 403;
    throw error;
  }

  // Update the specific suggestion's resolved status
  const insight = await SellerInsights.findOneAndUpdate(
    { property: propertyId, 'improvementSuggestions._id': suggestionId },
    {
      $set: {
        'improvementSuggestions.$.isResolved': true,
        'improvementSuggestions.$.resolvedAt': new Date()
      }
    },
    { new: true }
  ).populate('property', 'title price propertyType');

  if (!insight) {
    const error = new Error('Suggestion not found or property insights not available');
    error.statusCode = 404;
    throw error;
  }

  return insight;
};

/**
 * Aggregates demand statistics across all of a seller's properties.
 * Shows the total engagement and performance across their portfolio.
 *
 * @param {String} sellerId - MongoDB ObjectId of the seller
 * @returns {Object} Aggregated stats with total views, saves, inquiries, and avg demand level
 */
const getSellerAnalytics = async (sellerId) => {
  // Validate seller exists and has 'seller' role
  await validateSellerRole(sellerId);

  // Aggregate stats across all seller's insights
  const aggregationPipeline = [
    {
      $match: { seller: new mongoose.Types.ObjectId(sellerId) }
    },
    {
      $group: {
        _id: '$seller',
        totalViews: { $sum: '$demandStats.totalViews' },
        totalSaves: { $sum: '$demandStats.totalSaves' },
        totalInquiries: { $sum: '$demandStats.totalInquiries' },
        avgScore: { $avg: '$currentScore.overall' },
        propertiesCount: { $sum: 1 },
        highPriorityResolved: {
          $sum: {
            $size: {
              $filter: {
                input: '$improvementSuggestions',
                as: 'suggestion',
                cond: { $and: [
                  { $eq: ['$$suggestion.priority', 'high'] },
                  { $eq: ['$$suggestion.isResolved', true] }
                ] }
              }
            }
          }
        }
      }
    }
  ];

  const result = await SellerInsights.aggregate(aggregationPipeline);

  if (!result.length) {
    const error = new Error('No insights found for this seller');
    error.statusCode = 404;
    throw error;
  }

  const stats = result[0];
  return {
    totalViews: stats.totalViews || 0,
    totalSaves: stats.totalSaves || 0,
    totalInquiries: stats.totalInquiries || 0,
    averageScore: stats.avgScore ? Math.round(stats.avgScore * 10) / 10 : null,
    propertiesCount: stats.propertiesCount || 0,
    suggestionsResolved: stats.highPriorityResolved || 0,
    conversionRate: stats.totalInquiries && stats.totalViews ?
      ((stats.totalInquiries / stats.totalViews) * 100).toFixed(2) + '%' :
      'N/A'
  };
};

module.exports = {
  getSellerInsights,
  getPropertyInsight,
  resolveSuggestion,
  getSellerAnalytics
};
