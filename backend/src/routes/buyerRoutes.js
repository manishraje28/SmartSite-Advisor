const express = require('express');
const preferenceController = require('../controllers/preferenceController');
const matchmakingService = require('../services/matchmakingService');
const Property = require('../models/Property');
const { getNearbyAmenities } = require('../services/nearbyAmenitiesService');
const Groq = require('groq-sdk');
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

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
    const { enhancePropertyWithLivability } = require('../services/nearbyAmenitiesService');
    const preferences = buyerId ? await BuyerPreferences.findOne({ user: buyerId }) : null;

    const properties = await Property.find({ _id: { $in: propertyIds } })
      .populate('seller', 'name email phone')
      .lean();

    // Limit to 4 properties so we don't bombard Google APIs
    const propertiesToProcess = properties.slice(0, 4);

    const compared = await Promise.all(propertiesToProcess.map(async property => {
      // Fetch Google Places data and calculate new scores!
      const enhancedProperty = await enhancePropertyWithLivability(property);

      const matchPercentage = preferences
        ? matchmakingService.calculateMatchForProperty(enhancedProperty, preferences)
        : (enhancedProperty.aiScore?.overall || 50);

      // Generate AI insights
      const insights = [];
      const aiScore = enhancedProperty.aiScore || {};
      
      // We will now include real Google Livability/Connectivity in our logic
      const trueLivability = enhancedProperty.livabilityScore || aiScore.locationScore || 50;
      const trueConnectivity = enhancedProperty.connectivityScore || aiScore.connectivityScore || 50;
      
      if (trueLivability >= 80) {
        insights.push({ type: 'positive', text: `Excellent Livability rating (${trueLivability}/100) based on nearby amenities.` });
      }
      if (trueConnectivity >= 80) {
         insights.push({ type: 'positive', text: `Great Connectivity to public transit (${trueConnectivity}/100).` });
      }
      if (aiScore.roiPotential >= 80) {
        insights.push({ type: 'positive', text: `Strong ROI potential (${aiScore.roiPotential}/100).` });
      }
      if (aiScore.amenitiesScore < 60) {
        insights.push({ type: 'warning', text: `Property's internal amenities score could be improved (${aiScore.amenitiesScore}/100)` });
      }
      if (enhancedProperty.price < 10000000) {
        insights.push({ type: 'positive', text: 'Budget-friendly option' });
      }

      return { ...enhancedProperty, matchPercentage, insights };
    }));

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

// ── EXPLAINABILITY CHAT BOT ─────────────────
router.post('/explain', async (req, res) => {
  try {
    const { message, propertyId, radius } = req.body;
    
    if (!groq) {
      // Fallback if no Groq API Key is configured
      const property = await Property.findById(propertyId).lean();
      return res.json({
        success: true,
        data: {
          reply: `To get real AI insights, please add your GROQ_API_KEY to the backend .env file. For now, I can see you're looking at ${property ? property.title : 'this property'}.`,
          rawAmenities: {}
        }
      });
    }

    // 1. Get the property being discussed
    const property = await Property.findById(propertyId).lean();
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const [lng, lat] = property.location.coordinates;
    const customRadius = radius ? parseInt(radius) : 10000; // default 10km for chat

    // 2. Gather raw amenities explicitly requested over custom radius for the AI
    const amenities = await getNearbyAmenities(lat, lng, customRadius) || {};
    
    // Format what the AI needs to know
    let contextStr = `Property: ${property.title}, Price: INR ${property.price}\n`;
    contextStr += `Location: ${property.location.address}, ${property.location.city}\n`;
    contextStr += `Current Search Radius: ${customRadius / 1000} km\n`;
    contextStr += `Nearby Amenities Found (Top 3 per category):\n`;
    Object.entries(amenities).forEach(([type, data]) => {
      contextStr += `- ${type}: ${data.count} total inside radius. Top names: ${data.top.map(a=>a.name).join(', ')}\n`;
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert Real Estate Explainability AI for "SmartSite". You look at the property context and answer the user's questions about amenities within the area (like "Are there any schools within 10km?").
          
          Context:\n${contextStr}\n
          
          IMPORTANT: Your answer must be concise, helpful, and clearly explain why this makes the location good or bad. If they requested 10kms and you see them, list them and tell them that we will plot them on the map. Keep sentences short. Use regular newlines for spacing. Do not use asterisks for bolding or complex markdown.`
        },
        { role: 'user', content: message }
      ],
      model: 'openai/gpt-oss-120b',
    });

    res.json({
      success: true,
      data: {
        reply: completion.choices[0].message.content,
        rawAmenities: amenities  // so frontend can plot them!
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process chat' });
  }
});

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Buyer module loaded ✅' });
});

module.exports = router;
