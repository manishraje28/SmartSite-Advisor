/**
 * preferenceService.js
 * Business logic layer for Buyer Preferences management.
 *
 * Handles:
 * - Creating/updating buyer preferences (upsert pattern)
 * - Fetching preferences for recommendation purposes
 * - Partial preference updates
 * - Validation of preference constraints
 *
 * Why separate? So AI agents and other services can call these methods
 * without needing an HTTP request. Also simplifies testing.
 */

const { BuyerPreferences, User } = require('../models');
const { validatePreferenceData, validateWeights } = require('../utils/preferenceValidator');
const mongoose = require('mongoose');

/**
 * Validate that buyerId is a valid MongoDB ObjectId.
 * Throws 400 if invalid format.
 * Throws 404 if user doesn't exist.
 */
const validateAndFetchBuyer = async (buyerId) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    const error = new Error('Invalid buyerId format');
    error.statusCode = 400;
    throw error;
  }

  // Check user exists
  const user = await User.findById(buyerId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Check user is a buyer
  if (user.role !== 'buyer') {
    const error = new Error('User must have role "buyer" to have preferences');
    error.statusCode = 400;
    throw error;
  }

  return user;
};

/**
 * Fetches preferences for a specific buyer.
 * @param {String} buyerId - MongoDB ObjectId of the buyer user
 * @returns {Object} BuyerPreferences document or null
 */
const getPreferences = async (buyerId) => {
  // Validate user exists and is a buyer
  await validateAndFetchBuyer(buyerId);

  // Fetch preferences
  let preferences = await BuyerPreferences.findOne({ user: buyerId });

  // Fix: If referencePoint has null coordinates, remove the entire referencePoint field
  // to avoid geospatial index validation errors on subsequent updates
  if (preferences && preferences.referencePoint && !Array.isArray(preferences.referencePoint.coordinates)) {
    await BuyerPreferences.updateOne(
      { _id: preferences._id },
      { $unset: { referencePoint: 1 } }
    );
    preferences = await BuyerPreferences.findOne({ user: buyerId });
  }

  if (!preferences) {
    const error = new Error('Preferences not found. Create preferences first.');
    error.statusCode = 404;
    throw error;
  }

  return preferences;
};

/**
 * Saves (creates or replaces) buyer preferences.
 * Upsert pattern: if preferences exist, replace them. Otherwise, create new.
 *
 * @param {String} buyerId - MongoDB ObjectId of the buyer user
 * @param {Object} preferenceData - New preference values
 * @returns {Object} Saved BuyerPreferences document
 */
const savePreferences = async (buyerId, preferenceData) => {
  // Validate user exists and is a buyer
  await validateAndFetchBuyer(buyerId);

  // Validate incoming preference data
  validatePreferenceData(preferenceData);

  // Build the update data (ensure user field is set)
  let updateData = {
    ...preferenceData,
    user: buyerId,
  };

  // Fix: If referencePoint is not provided or has invalid coordinates,
  // we need to handle it carefully because MongoDB's geospatial index
  // will fail on null coordinates. We'll use $unset to remove it.
  const query = { user: buyerId };
  let updateOperation = { $set: updateData };

  if (!Array.isArray(updateData.referencePoint?.coordinates)) {
    // Remove referencePoint from $set and add it to $unset
    const { referencePoint, ...setData } = updateData;
    updateOperation = {
      $set: setData,
      $unset: { referencePoint: 1 }
    };
  }

  // Upsert: create if doesn't exist, replace if it does
  const preferences = await BuyerPreferences.findOneAndUpdate(
    query,
    updateOperation,
    { upsert: true, new: true, runValidators: true }
  );

  return preferences;
};

/**
 * Updates specific fields of buyer preferences (partial update).
 * Does NOT replace the entire document—only updates provided fields.
 *
 * @param {String} buyerId - MongoDB ObjectId of the buyer user
 * @param {Object} updateData - Fields to update (partial)
 * @returns {Object} Updated BuyerPreferences document
 */
const updatePreferences = async (buyerId, updateData) => {
  // Validate user exists and is a buyer
  await validateAndFetchBuyer(buyerId);

  // Validate only the fields being updated
  validatePreferenceData(updateData);

  // Build the update operation to handle geospatial index issues
  let updateOperation = { $set: updateData };

  if (updateData.referencePoint && !Array.isArray(updateData.referencePoint.coordinates)) {
    // If referencePoint is invalid, use $unset to remove it
    const { referencePoint, ...setData } = updateData;
    updateOperation = {
      $set: setData,
      $unset: { referencePoint: 1 }
    };
  }

  // Perform partial update
  const preferences = await BuyerPreferences.findOneAndUpdate(
    { user: buyerId },
    updateOperation,
    { new: true, runValidators: true }
  );

  if (!preferences) {
    const error = new Error('Preferences not found. Create preferences first.');
    error.statusCode = 404;
    throw error;
  }

  return preferences;
};

/**
 * Deletes all preferences for a buyer.
 * This clears their search criteria but keeps the User record.
 *
 * @param {String} buyerId - MongoDB ObjectId of the buyer user
 * @returns {Object} Deleted BuyerPreferences document
 */
const deletePreferences = async (buyerId) => {
  // Validate user exists
  await validateAndFetchBuyer(buyerId);

  // Delete preferences
  const preferences = await BuyerPreferences.findOneAndDelete({ user: buyerId });

  if (!preferences) {
    const error = new Error('Preferences not found');
    error.statusCode = 404;
    throw error;
  }

  return preferences;
};

module.exports = {
  getPreferences,
  savePreferences,
  updatePreferences,
  deletePreferences,
};
