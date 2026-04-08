/**
 * scoringService.js
 * Calls the Python Scoring Engine microservice to calculate property AI scores.
 *
 * Design:
 * - Non-blocking: If Python service is down, property creation continues without scores
 * - Graceful degradation: Missing scores don't prevent property creation
 * - Async parallel: Scoring happens after property is saved to DB
 */

const axios = require('axios');

const SCORING_ENGINE_URL = process.env.SCORING_ENGINE_URL || 'http://localhost:5001';
const SCORING_TIMEOUT = 5000; // 5 second timeout

/**
 * Scores a property by calling the Python Scoring Engine.
 *
 * @param {Object} property - Mongoose Property document
 * @returns {Promise<Object|null>} - aiScore object or null if scoring fails
 */
const scoreProperty = async (property) => {
  try {
    // Build payload matching Python API expectations
    const payload = {
      propertyId: property._id.toString(),
      propertyType: property.propertyType,
      location: {
        city: property.location.city,
        address: property.location.address,
        coordinates: property.location.coordinates,
      },
      specifications: property.specifications || {},
      amenities: property.amenities || [],
      price: property.price,
      engagementMetrics: {
        views: property.views || 0,
        saves: property.saves || 0,
        inquiries: property.inquiries || 0,
      },
    };

    // Call Python scoring engine
    const response = await axios.post(`${SCORING_ENGINE_URL}/score`, payload, {
      timeout: SCORING_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    // Extract aiScore from response
    if (response.data && response.data.success && response.data.data) {
      return response.data.data; // Returns { overall, locationScore, connectivityScore, amenitiesScore, roiPotential, ... }
    }

    console.warn(`[Scoring] Invalid response format from Python service for property ${property._id}`);
    return null;
  } catch (error) {
    // Non-blocking error: log but don't throw
    console.error(`[Scoring] Failed to score property ${property._id}:`, error.message);
    return null;
  }
};

/**
 * Health check for Python Scoring Engine service.
 * Used to verify service is running before attempting to score.
 *
 * @returns {Promise<boolean>} - true if service is reachable, false otherwise
 */
const healthCheck = async () => {
  try {
    const response = await axios.get(`${SCORING_ENGINE_URL}/health`, {
      timeout: 2000,
    });
    return response.status === 200;
  } catch (error) {
    console.warn(`[Scoring] Health check failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  scoreProperty,
  healthCheck,
};
