/**
 * sellerValidator.js
 * Validation helpers for seller-specific operations.
 *
 * Ensures:
 * - User has 'seller' role
 * - ObjectId formats are valid
 * - Pagination parameters are sensible
 * - Sort fields are allowed
 */

const { User } = require('../models');
const mongoose = require('mongoose');

/**
 * Validate that user exists and has role 'seller'.
 * Throws 400 if user role is wrong, 404 if user doesn't exist.
 *
 * @param {String} sellerId - MongoDB ObjectId
 * @throws {Error} with statusCode
 * @returns {Object} The user document
 */
const validateSellerRole = async (sellerId) => {
  // Check ObjectId format first
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    const error = new Error('Invalid sellerId format');
    error.statusCode = 400;
    throw error;
  }

  // Fetch user
  const user = await User.findById(sellerId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Check role
  if (user.role !== 'seller') {
    const error = new Error('User must have role "seller" to access seller insights');
    error.statusCode = 403;
    throw error;
  }

  return user;
};

/**
 * Validate MongoDB ObjectId format.
 * Throws 400 if invalid.
 *
 * @param {String} id - Supposed ObjectId
 * @param {String} fieldName - Name of field for error message
 * @throws {Error} if invalid
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName} format`);
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Validate pagination and sorting parameters.
 *
 * @param {Number|String} page - Page number (must be >= 1)
 * @param {Number|String} limit - Items per page (must be 1-100)
 * @param {String} sort - Sort field (must be one of: score, demand, updated)
 * @throws {Error} if validation fails
 */
const validatePaginationParams = (page, limit, sort) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    const error = new Error('Page must be a number >= 1');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    const error = new Error('Limit must be a number between 1 and 100');
    error.statusCode = 400;
    throw error;
  }

  const validSortFields = ['score', 'demand', 'updated'];
  if (sort && !validSortFields.includes(sort)) {
    const error = new Error(`Sort must be one of: ${validSortFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  validateSellerRole,
  validateObjectId,
  validatePaginationParams
};
