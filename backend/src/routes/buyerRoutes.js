const express = require('express');
const preferenceController = require('../controllers/preferenceController');
const matchmakingService = require('../services/matchmakingService');
const Property = require('../models/Property');
const { getNearbyAmenities } = require('../services/nearbyAmenitiesService');
const Groq = require('groq-sdk');
const { protect, restrictTo } = require('../middlewares/auth');
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Buyer module loaded ✅' });
});

router.use(protect);

// ── BUYER PREFERENCES ───────────────────────
router.post('/preferences', restrictTo('buyer'), preferenceController.savePreferences);
router.get('/preferences', restrictTo('buyer'), preferenceController.getPreferences);
router.patch('/preferences', restrictTo('buyer'), preferenceController.updatePreferences);
router.delete('/preferences', restrictTo('buyer'), preferenceController.deletePreferences);

// ── MATCHED PROPERTIES (AI-powered) ─────────
router.get('/matches', async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page, limit, minScore, sort, city, propertyType, minPrice, maxPrice, bedrooms } = req.query;

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
    const { propertyIds } = req.body;
    const buyerId = req.user.id;

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

      // Without buyer preferences there's no personalized fit to compute, so fall back
      // to the property's own aiScore — but honestly: a property that hasn't been
      // scored yet (aiScore.overall is null) should show as unscored, not silently
      // default to a fabricated 50 that looks identical for every unscored property.
      const matchPercentage = preferences
        ? matchmakingService.calculateMatchForProperty(enhancedProperty, preferences)
        : (enhancedProperty.aiScore?.overall ?? null);

      // Generate AI insights
      const insights = [];
      const aiScore = enhancedProperty.aiScore || {};
      
      // We will now include real Google Livability/Connectivity in our logic
      const trueLivability = enhancedProperty.livabilityScore || aiScore.locationScore || 50;
      const trueConnectivity = enhancedProperty.connectivityScore || aiScore.connectivityScore || 50;
      const environmentScore = enhancedProperty.environmentScore || {};
      
      if (trueLivability >= 80) {
        insights.push({ type: 'positive', text: `Excellent Livability rating (${trueLivability}/100) based on nearby amenities.` });
      }
      if (trueConnectivity >= 80) {
         insights.push({ type: 'positive', text: `Great Connectivity to public transit (${trueConnectivity}/100).` });
      }
      if (environmentScore.overall >= 80) {
        insights.push({
          type: 'positive',
          text: `Strong environmental quality (${environmentScore.overall}/100) with AQI ${environmentScore.aqi || 'N/A'}${environmentScore.aqiLabel ? ` - ${environmentScore.aqiLabel}` : ''}.`,
        });
      }
      if (environmentScore.aqi >= 4) {
        insights.push({
          type: 'warning',
          text: `Air quality is ${environmentScore.aqiLabel || 'poor'} (AQI ${environmentScore.aqi}) and may affect outdoor comfort.`,
        });
      }
      if (environmentScore.forecast?.trend === 'Worsening') {
        insights.push({
          type: 'warning',
          text: 'Air quality is expected to worsen over the next 24 hours.',
        });
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

    // AI Suitability Score — the exact sub-scores and per-factor reasoning
    // computed by the Python scoring engine, so the chatbot can answer
    // "why is the score X?" with the engine's actual reasoning instead of
    // guessing at a plausible-sounding explanation.
    if (property.aiScore?.overall != null) {
      contextStr += `\nAI Suitability Score: ${property.aiScore.overall}/100 (this is the exact number to cite if asked "why is the score X")\n`;
      contextStr += `- Location Score: ${property.aiScore.locationScore}/100\n`;
      contextStr += `- Connectivity Score: ${property.aiScore.connectivityScore}/100\n`;
      contextStr += `- Amenities Score: ${property.aiScore.amenitiesScore}/100\n`;
      contextStr += `- ROI Potential Score: ${property.aiScore.roiPotential}/100\n`;
      const b = property.aiScore.breakdown;
      if (b?.location?.reasoning) contextStr += `Location reasoning: ${b.location.reasoning}\n`;
      if (b?.connectivity?.reasoning) contextStr += `Connectivity reasoning: ${b.connectivity.reasoning}\n`;
      if (b?.amenities?.reasoning) contextStr += `Amenities reasoning: ${b.amenities.reasoning}\n`;
      if (b?.roiPotential?.reasoning) contextStr += `ROI/appreciation reasoning: ${b.roiPotential.reasoning}\n`;
    } else {
      contextStr += `\nThis property has not yet been AI-scored — say so plainly if asked about its score.\n`;
    }

    if (property.environmentScore?.overall != null) {
      contextStr += `\nEnvironment/AQI Score: ${property.environmentScore.overall}/100 (AQI ${property.environmentScore.aqi}, ${property.environmentScore.aqiLabel || 'unlabeled'})\n`;
      if (property.environmentScore.summary) contextStr += `Environment summary: ${property.environmentScore.summary}\n`;
    }

    contextStr += `\nCurrent Search Radius: ${customRadius / 1000} km\n`;
    contextStr += `Nearby Amenities Found (Top 3 per category):\n`;
    Object.entries(amenities).forEach(([type, data]) => {
      contextStr += `- ${type}: ${data.count} total inside radius. Top names: ${data.top.map(a=>a.name).join(', ')}\n`;
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert Real Estate Explainability AI for "SmartSite". You answer two kinds of questions about this exact property: (1) nearby amenities (like "Are there any schools within 10km?"), and (2) why the property's AI Suitability Score (or any of its sub-scores) is what it is (like "Why is the score 84?" or "Why is this suitable for a family?").

          Context:\n${contextStr}\n

          IMPORTANT: For score/reasoning questions, cite the exact sub-scores and the reasoning text given above — never invent a reason not grounded in this context, and never invent a different overall number than the one given. For amenity questions, answer from the amenities list above and mention we'll plot them on the map. Keep answers concise with short sentences. Use regular newlines for spacing. Do not use asterisks for bolding or complex markdown.`
        },
        { role: 'user', content: message }
      ],
      // openai/gpt-oss-120b returns empty content on short/typical prompts (its token
      // budget gets consumed by internal reasoning before any visible output) —
      // qwen/qwen3.8-27b was verified to reliably return real content.
      model: 'qwen/qwen3.8-27b',
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

module.exports = router;
