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
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HEALTH CHECK (unauthenticated)
// ─────────────────────────────────────────────

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Seller module loaded ✅' });
});

router.use(protect, restrictTo('seller'));

// ─────────────────────────────────────────────
// SELLER INSIGHTS ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /api/seller/insights?page=1&limit=10&sort=score
 * Fetch all insights for the authenticated seller's properties with pagination.
 * Sort options: 'score' (default), 'demand', 'updated'
 */
router.get('/insights', sellerController.getInsights);

/**
 * GET /api/seller/insights/:propertyId
 * Fetch detailed insights for a specific property owned by the authenticated seller.
 */
router.get('/insights/:propertyId', sellerController.getPropertyInsight);

/**
 * PATCH /api/seller/insights/:propertyId/suggestions/:suggestionId/resolve
 * Mark an improvement suggestion as resolved.
 */
router.patch('/insights/:propertyId/suggestions/:suggestionId/resolve', sellerController.resolveSuggestion);

/**
 * GET /api/seller/analytics
 * Get aggregated analytics across the authenticated seller's properties.
 * Returns: total views/saves/inquiries, average scores, conversion rates.
 */
router.get('/analytics', sellerController.getAnalytics);

module.exports = router;
