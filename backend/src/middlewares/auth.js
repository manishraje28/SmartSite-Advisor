/**
 * auth.js
 * JWT verification and role-gating middleware.
 *
 * `protect` replaces the old pattern of trusting a client-supplied
 * buyerId/sellerId in the request body/query — it derives the caller's
 * identity from a verified token and exposes it as `req.user`.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 401, 'Invalid or expired token');
    }

    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired token');
    }
    next(error);
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 403, 'You do not have permission to perform this action');
  }
  next();
};

// The demo accounts' passwords are shown on the login page, so anyone can use them.
// Keep them read-only for listings so a visitor can't vandalise shared data.
const DEMO_EMAILS = ['buyer@smartsite.com', 'seller@smartsite.com'];

const blockDemoAccounts = (req, res, next) => {
  if (req.user && DEMO_EMAILS.includes(req.user.email)) {
    return sendError(res, 403, 'Demo accounts are read-only. Create your own account to post or edit listings.');
  }
  next();
};

module.exports = { protect, restrictTo, blockDemoAccounts };
