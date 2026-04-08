/**
 * sellerController.js
 * Controller layer for Seller Insights and dashboard operations.
 *
 * Handles HTTP request/response logic for seller endpoints.
 * Extracts and validates incoming data, calls service layer,
 * and returns consistent API responses.
 */

const sellerInsightsService = require('../services/sellerInsightsService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Fetches all insights for the seller's properties with pagination.
 * GET /api/seller/insights?sellerId=...&page=1&limit=10&sort=score
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getInsights = async (req, res, next) => {
  try {
    const { sellerId, page = 1, limit = 10, sort = 'score' } = req.query;

    // Validate sellerId is provided
    if (!sellerId) {
      return sendError(res, 400, 'sellerId query parameter is required');
    }

    const result = await sellerInsightsService.getSellerInsights(sellerId, {
      page,
      limit,
      sort
    });

    return sendSuccess(res, 200, 'Insights retrieved successfully', result);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * Fetches a specific property's insights with full details.
 * GET /api/seller/insights/:propertyId?sellerId=...
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPropertyInsight = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { sellerId } = req.query;

    // Validate parameters
    if (!sellerId) {
      return sendError(res, 400, 'sellerId query parameter is required');
    }

    if (!propertyId) {
      return sendError(res, 400, 'propertyId URL parameter is required');
    }

    const insight = await sellerInsightsService.getPropertyInsight(propertyId, sellerId);
    return sendSuccess(res, 200, 'Property insight retrieved successfully', insight);
  } catch (error) {
    next(error);
  }
};

/**
 * Marks an improvement suggestion as resolved.
 * PATCH /api/seller/insights/:propertyId/suggestions/:suggestionId/resolve
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resolveSuggestion = async (req, res, next) => {
  try {
    const { propertyId, suggestionId } = req.params;
    const { sellerId } = req.body;

    // Validate parameters
    if (!sellerId) {
      return sendError(res, 400, 'sellerId is required in request body');
    }

    if (!propertyId) {
      return sendError(res, 400, 'propertyId URL parameter is required');
    }

    if (!suggestionId) {
      return sendError(res, 400, 'suggestionId URL parameter is required');
    }

    const insight = await sellerInsightsService.resolveSuggestion(
      propertyId,
      suggestionId,
      sellerId
    );

    return sendSuccess(res, 200, 'Suggestion marked as resolved', insight);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches aggregated analytics across all of the seller's properties.
 * GET /api/seller/analytics?sellerId=...
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { sellerId } = req.query;

    // Validate sellerId is provided
    if (!sellerId) {
      return sendError(res, 400, 'sellerId query parameter is required');
    }

    const analytics = await sellerInsightsService.getSellerAnalytics(sellerId);
    return sendSuccess(res, 200, 'Analytics retrieved successfully', analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsights,
  getPropertyInsight,
  resolveSuggestion,
  getAnalytics
};
