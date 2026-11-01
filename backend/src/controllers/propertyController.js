/**
 * propertyController.js
 * Controller layer for Property management.
 * 
 * Why? Separating HTTP request/response logic from business logic.
 * This handles parsing query params, body data, and formatting responses.
 */

const Property = require('../models/Property');
const propertyService = require('../services/propertyService');
const { geocodeAddress } = require('../services/googleGeocodingService');
const { getPriceFairness } = require('../services/priceFairnessService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// The app only covers Mumbai, Thane and Navi Mumbai.
const MMR_BOUNDS = { minLat: 18.85, maxLat: 19.55, minLng: 72.75, maxLng: 73.35 };

// Google returns a loose match (e.g. just "Maharashtra, India") for an address
// it can't find. Accept a result only if it names something more specific than
// the city or state.
const VAGUE_ADDRESS_PARTS = new Set(['india', 'maharashtra', 'mumbai', 'mumbai suburban', 'thane', 'navi mumbai']);
const isPreciseAddress = (formattedAddress = '') =>
  formattedAddress
    .split(',')
    .map((part) => part.trim().toLowerCase().replace(/\s*\d{6}$/, ''))
    .some((part) => part && !VAGUE_ADDRESS_PARTS.has(part));

// Coordinates drive the map, nearby-amenity lookups, AQI and the location
// score, so they're always derived server-side from the address — never
// trusted from the client.
const geocodeLocation = async (location = {}) => {
  const query = [location.address, location.city, location.state || 'Maharashtra', location.pincode, 'India']
    .filter(Boolean)
    .join(', ');
  const geo = await geocodeAddress(query);
  if (!geo || !isPreciseAddress(geo.formattedAddress)) return null;

  const { lat, lng } = geo;
  const inCoverage = lat >= MMR_BOUNDS.minLat && lat <= MMR_BOUNDS.maxLat && lng >= MMR_BOUNDS.minLng && lng <= MMR_BOUNDS.maxLng;
  if (!inCoverage) return null;

  return {
    location: { ...location, type: 'Point', coordinates: [lng, lat] },
    formattedAddress: geo.formattedAddress,
  };
};

const ADDRESS_NOT_FOUND = "We couldn't find this address in Mumbai, Thane or Navi Mumbai. Please check the street, area and pincode.";

/**
 * Shows a seller where their address will be placed before they submit.
 * Google sometimes fuzzy-matches a mistyped address to a different real
 * street, which only a human can catch.
 * GET /api/properties/geocode-preview?address=...&city=...&pincode=...
 */
const previewLocation = async (req, res, next) => {
  try {
    const { address, city, pincode } = req.query;
    const geo = await geocodeLocation({ address, city, pincode });
    if (!geo) return sendError(res, 400, ADDRESS_NOT_FOUND);
    return sendSuccess(res, 200, 'Address located', {
      formattedAddress: geo.formattedAddress,
      coordinates: geo.location.coordinates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new property listing.
 * `seller` is always the authenticated caller — a client can never list a
 * property under someone else's account by passing a different `seller` field.
 */
const createProperty = async (req, res, next) => {
  try {
    const geo = await geocodeLocation(req.body.location);
    if (!geo) return sendError(res, 400, ADDRESS_NOT_FOUND);

    const property = await propertyService.createProperty({ ...req.body, location: geo.location, seller: req.user.id });
    return sendSuccess(res, 201, 'Property created successfully', property);
  } catch (error) {
    next(error); // Passes to global error handler
  }
};

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  score: { 'aiScore.overall': -1 },
};

/**
 * Gets all properties with optional filtering.
 */
const getAllProperties = async (req, res, next) => {
  try {
    const { city, propertyType, minPrice, maxPrice, status, sort, page = 1, limit = 10, search } = req.query;

    const filters = { city, propertyType, minPrice, maxPrice, status, search };
    const skip = (page - 1) * limit;
    // Sorting happens in the database across every matching property, so page 2
    // continues where page 1 left off. `_id` breaks ties so pages never overlap.
    const options = { sort: { ...(SORT_OPTIONS[sort] || SORT_OPTIONS.newest), _id: 1 }, limit, skip };

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
    const priceFairness = await getPriceFairness(property);
    return sendSuccess(res, 200, 'Property fetched successfully', { ...property.toJSON(), priceFairness });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing property. Only the seller who owns it may update it.
 */
const updateProperty = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing) {
      return sendError(res, 404, 'Property not found');
    }
    if (existing.seller.toString() !== req.user.id) {
      return sendError(res, 403, 'You do not have permission to update this property');
    }

    const updateData = { ...req.body };
    delete updateData.seller;
    if (updateData.location) {
      const existingLocation = existing.location.toObject();
      delete existingLocation.coordinates;
      const geo = await geocodeLocation({ ...existingLocation, ...updateData.location });
      if (!geo) return sendError(res, 400, ADDRESS_NOT_FOUND);
      updateData.location = geo.location;
    }

    const property = await propertyService.updateProperty(req.params.id, updateData);
    if (updateData.location) {
      propertyService.scoringPropertyAsync(property).catch((err) => {
        console.error(`[Property] Re-scoring after location change failed for ${property._id}:`, err.message);
      });
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
 * Deletes a property. Only the seller who owns it may delete it.
 */
const deleteProperty = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing) {
      return sendError(res, 404, 'Property not found');
    }
    if (existing.seller.toString() !== req.user.id) {
      return sendError(res, 403, 'You do not have permission to delete this property');
    }

    await propertyService.deleteProperty(req.params.id);
    return sendSuccess(res, 200, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  previewLocation,
  createProperty,
  getAllProperties,
  getPropertyById,
  saveProperty,
  updateProperty,
  deleteProperty,
};
