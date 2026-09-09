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
const { protect, restrictTo } = require('../middlewares/auth');

/**
 * @route   POST /api/properties
 * @desc    Create a new property listing (seller-only; ownership is taken from the token)
 */
router.post('/', protect, restrictTo('seller'), propertyController.createProperty);

/**
 * @route   GET /api/properties
 * @desc    Get all properties (with filtering/pagination) — public
 */
router.get('/', propertyController.getAllProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get a specific property by ID — public
 */
router.get('/:id', propertyController.getPropertyById);

/**
 * @route   POST /api/properties/:id/save
 * @desc    Increment the saves counter — public
 */
router.post('/:id/save', propertyController.saveProperty);

/**
 * @route   PATCH /api/properties/:id
 * @desc    Update an existing property (only the owning seller may update)
 */
router.patch('/:id', protect, propertyController.updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property (only the owning seller may delete)
 */
router.delete('/:id', protect, propertyController.deleteProperty);

module.exports = router;
