/**
 * userRoutes.js
 * Routing for User module.
 * 
 * Defines endpoints for registration and login.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (Buyer or Seller)
 */
router.post('/register', userController.registerUser);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate a user
 */
router.post('/login', userController.loginUser);

module.exports = router;
