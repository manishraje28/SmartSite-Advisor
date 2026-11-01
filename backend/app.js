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
const agentRoutes = require('./src/routes/agentRoutes');

// Middleware modules
const errorHandler = require('./src/middlewares/errorHandler');
const notFound = require('./src/middlewares/notFound');

const rateLimit = require('./src/middlewares/rateLimit');

const app = express();

// Behind Render/other proxies, req.ip must come from X-Forwarded-For or every
// visitor looks like the proxy (and shares one rate-limit bucket).
app.set('trust proxy', 1);

/**
 * helmet: Sets secure HTTP response headers automatically.
 * Protects against XSS, clickjacking, MIME sniffing, etc.
 */
app.use(helmet());

/**
 * cors: Cross-Origin Resource Sharing.
 * CLIENT_ORIGIN is a comma-separated list of allowed frontend origins. Without it,
 * any origin is allowed — fine on a dev machine, refused in production.
 */
// Browsers send the origin without a trailing slash, so strip any pasted one
// ("https://site.com/" would otherwise never match and CORS fails silently).
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
if (!allowedOrigins.length && process.env.NODE_ENV === 'production') {
  throw new Error('CLIENT_ORIGIN must be set in production (e.g. https://smartsite.onrender.com).');
}
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
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
// 20 sign-in/sign-up attempts per IP per 15 minutes slows password guessing.
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/google'], rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/auth', authRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/agents', agentRoutes);

// ─────────────────────────────────────────────
// ERROR HANDLING (must be registered LAST)
// ─────────────────────────────────────────────

// Catches requests to undefined routes → creates a 404 error
app.use(notFound);

// Global error handler → formats all errors as JSON
app.use(errorHandler);

module.exports = app;
