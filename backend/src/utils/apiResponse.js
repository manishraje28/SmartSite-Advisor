/**
 * apiResponse.js
 * Utility helpers for sending consistent API responses.
 *
 * Why? Every route should return a uniform shape so the frontend
 * can handle responses predictably without per-route parsing logic.
 *
 * Shape:
 * {
 *   success: true | false,
 *   message: "...",
 *   data: { ... }   // only on success
 * }
 */

/**
 * Send a successful response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Human-readable success message
 * @param {any} data - Payload to return to the client
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Human-readable error message
 */
const sendError = (res, statusCode = 500, message = 'Error') => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
