/**
 * propertyRoutes.js
 * Routing for Property module.
 * 
 * Why? Separating route definitions from the central app.js.
 * This handles HTTP mapping and will eventually include route-specific middleware.
 */

const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

/**
 * @route   POST /api/properties
 * @desc    Create a new property listing
 */
router.post('/', propertyController.createProperty);

/**
 * @route   GET /api/properties
 * @desc    Get all properties (with filtering/pagination)
 */
router.get('/', propertyController.getAllProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get a specific property by ID
 */
router.get('/:id', propertyController.getPropertyById);

/**
 * @route   PATCH /api/properties/:id
 * @desc    Update an existing property
 */
router.patch('/:id', propertyController.updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 */
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
