/**
 * app.js
 * Express application configuration.
 *
 * This file ONLY sets up the app — it does NOT start the server.
 * Server binding happens in server.js.
 *
 * Why this separation?
 * - app.js can be imported in test files without opening a port
 * - Keeps server startup logic completely isolated
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Route modules
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const buyerRoutes = require('./src/routes/buyerRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');
const propertyRoutes = require('./src/routes/propertyRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Middleware modules
const errorHandler = require('./src/middlewares/errorHandler');
const notFound = require('./src/middlewares/notFound');

const app = express();

/**
 * helmet: Sets secure HTTP response headers automatically.
 * Protects against XSS, clickjacking, MIME sniffing, etc.
 */
app.use(helmet());

/**
 * cors: Cross-Origin Resource Sharing.
 * Modified to allow all origins temporarily while we resolve VPN routing issue.
 */
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────
// PARSING MIDDLEWARE
// ─────────────────────────────────────────────

/**
 * express.json(): Parses incoming JSON request bodies.
 * The limit prevents excessively large payloads (e.g., DoS via huge JSON).
 */
app.use(express.json({ limit: '10mb' }));

/**
 * express.urlencoded(): Parses URL-encoded form data.
 * Needed for any HTML form submissions.
 */
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// LOGGING MIDDLEWARE
// ─────────────────────────────────────────────

/**
 * morgan: HTTP request logger.
 * 'dev' format: [METHOD] [url] [status] [response-time]
 * Only enabled in development to avoid noisy production logs.
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);

// ─────────────────────────────────────────────
// ERROR HANDLING (must be registered LAST)
// ─────────────────────────────────────────────

// Catches requests to undefined routes → creates a 404 error
app.use(notFound);

// Global error handler → formats all errors as JSON
app.use(errorHandler);

module.exports = app;
