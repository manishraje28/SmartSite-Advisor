const express = require('express');
const preferenceController = require('../controllers/preferenceController');
const matchmakingService = require('../services/matchmakingService');
const Property = require('../models/Property');

const router = express.Router();

// ── BUYER PREFERENCES ───────────────────────
router.post('/preferences', preferenceController.savePreferences);
router.get('/preferences', preferenceController.getPreferences);
router.patch('/preferences', preferenceController.updatePreferences);
router.delete('/preferences', preferenceController.deletePreferences);

// ── MATCHED PROPERTIES (AI-powered) ─────────
router.get('/matches', async (req, res) => {
  try {
    const { buyerId, page, limit, minScore, sort, city, propertyType, minPrice, maxPrice, bedrooms } = req.query;
    
    if (!buyerId) {
      return res.status(400).json({ success: false, message: 'buyerId is required' });
    }

    const result = await matchmakingService.getMatchedProperties(buyerId, {
      page: page || 1,
      limit: limit || 12,
      minScore: minScore || 0,
      sort: sort || 'match',
      city,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ success: false, message: 'Failed to get matches' });
  }
});

// ── COMPARE PROPERTIES ──────────────────────
router.post('/compare', async (req, res) => {
  try {
    const { propertyIds, buyerId } = req.body;
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 property IDs required' });
    }

    const BuyerPreferences = require('../models/BuyerPreferences');
    const preferences = buyerId ? await BuyerPreferences.findOne({ user: buyerId }) : null;

    const properties = await Property.find({ _id: { $in: propertyIds } })
      .populate('seller', 'name email phone')
      .lean();

    const compared = properties.map(property => {
      const matchPercentage = preferences
        ? matchmakingService.calculateMatchForProperty(property, preferences)
        : (property.aiScore?.overall || 50);

      // Generate AI insights
      const insights = [];
      const aiScore = property.aiScore || {};
      
      if (aiScore.locationScore >= 80) {
        insights.push({ type: 'positive', text: `Excellent location score (${aiScore.locationScore}/100)` });
      }
      if (aiScore.roiPotential >= 80) {
        insights.push({ type: 'positive', text: `Strong ROI potential (${aiScore.roiPotential}/100)` });
      }
      if (aiScore.amenitiesScore < 60) {
        insights.push({ type: 'warning', text: `Amenities score could be improved (${aiScore.amenitiesScore}/100)` });
      }
      if (property.price < 10000000) {
        insights.push({ type: 'positive', text: 'Budget-friendly option' });
      }

      return { ...property, matchPercentage, insights };
    });

    // Sort by match percentage
    compared.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Generate winner explanation
    const winner = compared[0];
    const explanation = [];
    if (preferences) {
      const weights = preferences.weights || {};
      if (weights.location >= 0.25 && winner.aiScore?.locationScore >= 75) {
        explanation.push(`${winner.title} scores highest on Location, your top priority`);
      }
      if (weights.price >= 0.3) {
        explanation.push(`Best price-to-value ratio based on your ${Math.round((weights.price || 0.35) * 100)}% price weight`);
      }
      explanation.push(`Overall ${winner.matchPercentage}% match with your preferences`);
    }

    res.json({
      success: true,
      data: {
        properties: compared,
        winner: { id: winner._id, title: winner.title, explanation },
      },
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ success: false, message: 'Failed to compare properties' });
  }
});

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Buyer module loaded ✅' });
});

module.exports = router;
