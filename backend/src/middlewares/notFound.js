/**
 * notFound.js
 * Catches any request that doesn't match a defined route.
 *
 * Why needed? Express doesn't automatically return 404 for unknown routes.
 * This middleware ensures a clean, consistent response instead of hanging.
 */

const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // Pass to the global error handler
};

module.exports = notFound;
