/**
 * preferenceController.js
 * Controller layer for Buyer Preferences management.
 *
 * Handles HTTP request/response logic for preference endpoints.
 * Extracts and validates incoming data, calls service layer,
 * and returns consistent API responses.
 *
 * The buyer is always the authenticated caller (`req.user.id`, set by the
 * `protect` middleware) — never a client-supplied id — so one buyer can
 * never read or overwrite another buyer's preferences.
 */

const preferenceService = require('../services/preferenceService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Fetches preferences for the authenticated buyer.
 * GET /api/buyer/preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const preferences = await preferenceService.getPreferences(req.user.id);
    return sendSuccess(res, 200, 'Preferences fetched successfully', preferences);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * Saves (creates or replaces) preferences for the authenticated buyer.
 * POST /api/buyer/preferences
 */
const savePreferences = async (req, res, next) => {
  try {
    const preferences = await preferenceService.savePreferences(req.user.id, req.body);
    return sendSuccess(res, 201, 'Preferences saved successfully', preferences);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates specific preference fields (partial update) for the authenticated buyer.
 * PATCH /api/buyer/preferences
 *
 * Note: This is different from savePreferences which replaces the entire doc.
 * This only updates the fields provided in the request body.
 */
const updatePreferences = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return sendError(res, 400, 'At least one preference field must be provided for update');
    }

    const preferences = await preferenceService.updatePreferences(req.user.id, req.body);
    return sendSuccess(res, 200, 'Preferences updated successfully', preferences);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes all preferences for the authenticated buyer.
 * DELETE /api/buyer/preferences
 */
const deletePreferences = async (req, res, next) => {
  try {
    await preferenceService.deletePreferences(req.user.id);
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
