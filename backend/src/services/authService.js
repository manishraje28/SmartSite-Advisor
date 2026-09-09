/**
 * authService.js
 * Business logic for registration, login, session lookup, and Google Sign-In.
 */

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const BuyerPreferences = require('../models/BuyerPreferences');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
});

const createBuyerPreferencesIfNeeded = async (user) => {
  if (user.role !== 'buyer') return;
  const existing = await BuyerPreferences.findOne({ user: user._id });
  if (existing) return;
  await BuyerPreferences.create({ user: user._id, referencePoint: undefined });
};

const register = async ({ name, email, password, role, phone }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email: normalizedEmail, password, role: role || 'buyer', phone });
  await createBuyerPreferencesIfNeeded(user);

  user.lastLogin = new Date();
  await user.save();

  return { user: publicUser(user), token: generateToken(user) };
};

const login = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !user.password || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  return { user: publicUser(user), token: generateToken(user) };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return publicUser(user);
};

const googleLogin = async (idToken) => {
  if (!googleClient) {
    const error = new Error('Google Sign-In is not configured on the server');
    error.statusCode = 500;
    throw error;
  }
  if (!idToken) {
    const error = new Error('idToken is required');
    error.statusCode = 400;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
    } else {
      user = new User({
        name,
        email: normalizedEmail,
        googleId,
        avatar: picture,
        role: 'buyer',
      });
    }
  }

  user.lastLogin = new Date();
  await user.save();
  await createBuyerPreferencesIfNeeded(user);

  return { user: publicUser(user), token: generateToken(user) };
};

module.exports = { register, login, getCurrentUser, googleLogin };
