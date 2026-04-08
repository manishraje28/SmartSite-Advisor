/**
 * sellerRoutes.js
 * Routes for seller-specific functionality.
 *
 * Currently implemented:
 * - Seller insights (list, detail, resolve suggestions, analytics)
 *
 * Future additions:
 * - Property management
 * - Pricing recommendations
 * - Performance tracking
 */

const express = require('express');
const sellerController = require('../controllers/sellerController');

const router = express.Router();

// ─────────────────────────────────────────────
// SELLER INSIGHTS ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /api/seller/insights?sellerId=...&page=1&limit=10&sort=score
 * Fetch all insights for seller's properties with pagination.
 * Sort options: 'score' (default), 'demand', 'updated'
 */
router.get('/insights', sellerController.getInsights);

/**
 * GET /api/seller/insights/:propertyId?sellerId=...
 * Fetch detailed insights for a specific property.
 */
router.get('/insights/:propertyId', sellerController.getPropertyInsight);

/**
 * PATCH /api/seller/insights/:propertyId/suggestions/:suggestionId/resolve
 * Mark an improvement suggestion as resolved.
 * Body: { sellerId }
 */
router.patch('/insights/:propertyId/suggestions/:suggestionId/resolve', sellerController.resolveSuggestion);

/**
 * GET /api/seller/analytics?sellerId=...
 * Get aggregated analytics across all seller's properties.
 * Returns: total views/saves/inquiries, average scores, conversion rates.
 */
router.get('/analytics', sellerController.getAnalytics);

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Seller module loaded ✅' });
});

module.exports = router;
