/**
 * preferenceController.js
 * Controller layer for Buyer Preferences management.
 *
 * Handles HTTP request/response logic for preference endpoints.
 * Extracts and validates incoming data, calls service layer,
 * and returns consistent API responses.
 */

const preferenceService = require('../services/preferenceService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Fetches preferences for a specific buyer.
 * GET /api/buyer/preferences?buyerId=...
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPreferences = async (req, res, next) => {
  try {
    const { buyerId } = req.query;

    // Validate buyerId is provided
    if (!buyerId) {
      return sendError(res, 400, 'buyerId query parameter is required');
    }

    const preferences = await preferenceService.getPreferences(buyerId);
    return sendSuccess(res, 200, 'Preferences fetched successfully', preferences);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * Saves (creates or replaces) buyer preferences.
 * POST /api/buyer/preferences
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const savePreferences = async (req, res, next) => {
  try {
    const { buyerId, ...preferenceData } = req.body;

    // Validate buyerId is provided
    if (!buyerId) {
      return sendError(res, 400, 'buyerId is required in request body');
    }

    const preferences = await preferenceService.savePreferences(buyerId, preferenceData);
    return sendSuccess(res, 201, 'Preferences saved successfully', preferences);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates specific preference fields (partial update).
 * PATCH /api/buyer/preferences
 *
 * Note: This is different from savePreferences which replaces the entire doc.
 * This only updates the fields provided in the request body.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { buyerId, ...updateData } = req.body;

    // Validate buyerId is provided
    if (!buyerId) {
      return sendError(res, 400, 'buyerId is required in request body');
    }

    // Validate at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, 'At least one preference field must be provided for update');
    }

    const preferences = await preferenceService.updatePreferences(buyerId, updateData);
    return sendSuccess(res, 200, 'Preferences updated successfully', preferences);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes all preferences for a buyer.
 * DELETE /api/buyer/preferences?buyerId=...
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deletePreferences = async (req, res, next) => {
  try {
    const { buyerId } = req.query;

    // Validate buyerId is provided
    if (!buyerId) {
      return sendError(res, 400, 'buyerId query parameter is required');
    }

    await preferenceService.deletePreferences(buyerId);
    return sendSuccess(res, 200, 'Preferences deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreferences,
  savePreferences,
  updatePreferences,
  deletePreferences,
};
