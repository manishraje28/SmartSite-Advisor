/**
 * userService.js
 * Business logic layer for User management.
 * 
 * This handles user registration and login validation.
 */

const { User } = require('../models');

/**
 * Registers a new user.
 * @param {Object} userData - User details (name, email, password, role).
 */
const register = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    const error = new Error('User already exists with this email');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create(userData);
  return user;
};

/**
 * Validates user credentials.
 * @param {String} email - User email.
 * @param {String} password - User password.
 */
const login = async (email, password) => {
  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Remove password from returned object
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

module.exports = {
  register,
  login,
};
