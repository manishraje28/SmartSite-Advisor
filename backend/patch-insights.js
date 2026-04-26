require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./src/models/Property');
const SellerInsights = require('./src/models/SellerInsights');

const MONGO_URI = process.env.MONGO_URI;

const patchInsights = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('âœ… Connected to MongoDB for patching insights');

    const properties = await Property.find();
    
    for (const property of properties) {
      const existingInsight = await SellerInsights.findOne({ property: property._id });
      if (!existingInsight) {
        
        let aiScore = property.aiScore || {};
        const suggestions = [
          {
            type: 'pricing',
            priority: 'high',
            message: 'Lower price by 3% to match similar properties in the area and boost inquiries by ~15%',
            impact: 15,
          },
          {
            type: 'imagery',
            priority: 'medium',
            message: 'Add a video tour. Listings with video get 40% more engagement.',
            impact: 40,
          }
        ];

        await SellerInsights.create({
          property: property._id,
          seller: property.seller,
          currentScore: {
            overall: aiScore.overall || 70,
            locationScore: aiScore.locationScore || 70,
            connectivityScore: aiScore.connectivityScore || 70,
            amenitiesScore: aiScore.amenitiesScore || 70,
            roiPotential: aiScore.roiPotential || 70,
          },
          scoreHistory: [
            { score: (aiScore.overall || 70) - 5, recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), reason: 'Initial analysis' },
            { score: aiScore.overall || 70, recordedAt: new Date(), reason: 'Current score' },
          ],
          demandStats: {
            totalViews: property.views || Math.floor(Math.random() * 100),
            uniqueViews: Math.round((property.views || 50) * 0.7),
            totalSaves: property.saves || Math.floor(Math.random() * 20),
            totalInquiries: property.inquiries || Math.floor(Math.random() * 10),
            weeklyTrend: [
              { week: '2026-W16', views: 10, inquiries: 2 },
              { week: '2026-W17', views: 20, inquiries: 5 },
            ],
          },
          demandLevel: 'moderate',
          buyerSegmentMatch: {
            family: 50 + Math.round(Math.random() * 30),
            investor: 40 + Math.round(Math.random() * 30),
            student: 20 + Math.round(Math.random() * 20),
            bachelor: 30 + Math.round(Math.random() * 30),
            retiree: 30 + Math.round(Math.random() * 20),
          },
          topTargetSegment: 'family',
          improvementSuggestions: suggestions,
          lastAiAnalysisAt: new Date(),
          analysisVersion: '1.1.0',
        });
        console.log(`  -> Created missing Insight for: ${property.title}`);
      }
    }
    
    console.log('âœ… Insights patched successfully');
    process.exit(0);
  } catch (err) {
    console.error('âŒ Patch failed', err);
    process.exit(1);
  }
};

patchInsights();