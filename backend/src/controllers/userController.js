/**
 * userController.js
 * Controller layer for User management.
 *
 * Maps HTTP requests to service methods for User registration and login.
 */

const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Registers a new user (Buyer or Seller).
 */
const registerUser = async (req, res, next) => {
  try {
    const user = await userService.register(req.body);

    // Generate JWT token
    const token = generateToken(user._id);

    // Format response
    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };

    return sendSuccess(res, 201, 'User registered successfully', responseData);
  } catch (error) {
    next(error); // This will handle duplicate email errors from service
  }
};

/**
 * Logs in a user.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userService.login(email, password);

    // Generate JWT token
    const token = generateToken(user._id);

    // Format response
    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };

    return sendSuccess(res, 200, 'Login successful', responseData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
};
