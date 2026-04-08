/**
 * errorHandler.js
 * Global Express error-handling middleware.
 *
 * Why centralized? Instead of writing try/catch in every controller,
 * we throw errors from anywhere and let this one handler format the response.
 * All error responses will be consistent JSON objects.
 */

const errorHandler = (err, req, res, next) => {
  // Use the error's own status code if set, otherwise default to 500.
  const statusCode = err.statusCode || 500;

  // In production, don't leak internal error details to the client.
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace is only exposed in development for debugging.
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
