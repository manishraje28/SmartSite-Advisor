/**
 * healthRoutes.js
 * A simple health check endpoint.
 *
 * Why? Every production API needs a /health endpoint for:
 * - Load balancers (e.g., AWS ALB) to confirm the server is alive
 * - Monitoring tools (e.g., UptimeRobot, Datadog)
 * - Quick local verification that the server started correctly
 */

const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 SmartSite API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;
