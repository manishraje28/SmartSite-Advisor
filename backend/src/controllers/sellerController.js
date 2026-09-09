/**
 * sellerController.js
 * Controller layer for Seller Insights and dashboard operations.
 *
 * Handles HTTP request/response logic for seller endpoints.
 * Extracts and validates incoming data, calls service layer,
 * and returns consistent API responses.
 *
 * The seller is always the authenticated caller (`req.user.id`, set by the
 * `protect` middleware) — never a client-supplied id — so one seller can
 * never read another seller's insights or analytics.
 */

const sellerInsightsService = require('../services/sellerInsightsService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Fetches all insights for the authenticated seller's properties with pagination.
 * GET /api/seller/insights?page=1&limit=10&sort=score
 */
const getInsights = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'score' } = req.query;

    const result = await sellerInsightsService.getSellerInsights(req.user.id, {
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
 * GET /api/seller/insights/:propertyId
 */
const getPropertyInsight = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return sendError(res, 400, 'propertyId URL parameter is required');
    }

    const insight = await sellerInsightsService.getPropertyInsight(propertyId, req.user.id);
    return sendSuccess(res, 200, 'Property insight retrieved successfully', insight);
  } catch (error) {
    next(error);
  }
};

/**
 * Marks an improvement suggestion as resolved.
 * PATCH /api/seller/insights/:propertyId/suggestions/:suggestionId/resolve
 */
const resolveSuggestion = async (req, res, next) => {
  try {
    const { propertyId, suggestionId } = req.params;

    if (!propertyId) {
      return sendError(res, 400, 'propertyId URL parameter is required');
    }

    if (!suggestionId) {
      return sendError(res, 400, 'suggestionId URL parameter is required');
    }

    const insight = await sellerInsightsService.resolveSuggestion(
      propertyId,
      suggestionId,
      req.user.id
    );

    return sendSuccess(res, 200, 'Suggestion marked as resolved', insight);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches aggregated analytics across all of the authenticated seller's properties.
 * GET /api/seller/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await sellerInsightsService.getSellerAnalytics(req.user.id);
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
