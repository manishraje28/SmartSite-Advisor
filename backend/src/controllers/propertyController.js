/**
 * propertyController.js
 * Controller layer for Property management.
 * 
 * Why? Separating HTTP request/response logic from business logic.
 * This handles parsing query params, body data, and formatting responses.
 */

const propertyService = require('../services/propertyService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Creates a new property listing.
 */
const createProperty = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty(req.body);
    return sendSuccess(res, 201, 'Property created successfully', property);
  } catch (error) {
    next(error); // Passes to global error handler
  }
};

/**
 * Gets all properties with optional filtering.
 */
const getAllProperties = async (req, res, next) => {
  try {
    const { city, propertyType, minPrice, maxPrice, status, sort, page = 1, limit = 10 } = req.query;
    
    const filters = { city, propertyType, minPrice, maxPrice, status };
    const skip = (page - 1) * limit;
    const options = { sort, limit, skip };

    const data = await propertyService.getAllProperties(filters, options);
    return sendSuccess(res, 200, 'Properties fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a specific property by ID.
 */
const getPropertyById = async (req, res, next) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }
    return sendSuccess(res, 200, 'Property fetched successfully', property);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing property.
 */
const updateProperty = async (req, res, next) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.body);
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }
    return sendSuccess(res, 200, 'Property updated successfully', property);
  } catch (error) {
    next(error);
  }
};

/**
 * Saves/Likes a property.
 */
const saveProperty = async (req, res, next) => {
  try {
    const property = await propertyService.saveProperty(req.params.id);
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }
    return sendSuccess(res, 200, 'Property saved successfully', property.saves);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a property.
 */
const deleteProperty = async (req, res, next) => {
  try {
    const property = await propertyService.deleteProperty(req.params.id);
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }
    return sendSuccess(res, 200, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  saveProperty,
  updateProperty,
  deleteProperty,
};
