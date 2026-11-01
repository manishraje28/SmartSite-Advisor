const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { protect, blockDemoAccounts } = require('../middlewares/auth');
const { sendError } = require('../utils/apiResponse');
const { scraperEnabled: isScraperEnabled } = require('../config/features');

// Every agent calls the Groq LLM (and the scrape routes launch Playwright), so none
// of them can be open to anonymous traffic.
router.use(protect);

// Scraping needs a full browser install and lots of memory (see config/features.js).
const scraperEnabled = (req, res, next) =>
  isScraperEnabled()
    ? next()
    : sendError(res, 503, 'Live listing sync is disabled on this server.');

// 1. Parichay Buyer Persona Profiling
router.post('/profile', agentController.profileBuyer);

// 2. Valuation & ROI Specialist Audit
router.post('/valuation', agentController.evaluateValuation);

// 3. GeoSpatial & Environmental Health Audit
router.post('/geospatial', agentController.evaluateGeoSpatial);

// 4. Negotiation & EMI Deal Strategy
router.post('/negotiate', agentController.strategizeNegotiation);

// 5. Constructor Upgrade Action Plan (Seller)
router.post('/upgrade', agentController.evaluateConstructorUpgrade);

// 6. Live Multi-Agent Debate & Consensus Engine
router.post('/debate', agentController.runMultiAgentDebate);

// 7. Live Real Estate Harvester & Scraper Agent
router.post('/scrape/search', scraperEnabled, blockDemoAccounts, agentController.harvestLiveListings);

// 8. On-Demand Property Portal Live Sync
router.post('/scrape/sync/:propertyId', scraperEnabled, blockDemoAccounts, agentController.syncSingleProperty);

module.exports = router;
