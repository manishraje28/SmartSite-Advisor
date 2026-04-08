/**
 * models/index.js
 * Central export for all Mongoose models.
 *
 * Why? Instead of requiring individual model files across controllers/services,
 * import from this single file: const { User, Property } = require('../models');
 * This makes refactoring (e.g., renaming a model file) a one-line change here.
 */

const User = require('./User');
const Property = require('./Property');
const BuyerPreferences = require('./BuyerPreferences');
const SellerInsights = require('./SellerInsights');

module.exports = { User, Property, BuyerPreferences, SellerInsights };
