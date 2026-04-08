/**
 * seed.js - Populate database with sample data for development
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Property = require('./src/models/Property');
const BuyerPreferences = require('./src/models/BuyerPreferences');
const SellerInsights = require('./src/models/SellerInsights');

const MONGO_URI = process.env.MONGO_URI;

const sampleProperties = [
  {
    title: 'Prestige Lakeside Habitat',
    description: 'Premium 3BHK apartment with lake view in the heart of Whitefield. World-class amenities including Olympic swimming pool, state-of-art gym, and children\'s play area.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 12000000,
    pricePerSqFt: 8275,
    location: {
      type: 'Point',
      coordinates: [77.7480, 12.9698],
      address: 'Prestige Lakeside Habitat, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
    },
    specifications: {
      bedrooms: 3, bathrooms: 3, balconies: 2,
      carpetArea: 1450, builtUpArea: 1800,
      floor: 12, totalFloors: 25,
      parkingSpots: 2, facing: 'East',
      furnishingStatus: 'Semi-Furnished', age: 2,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Children Play Area', 'Jogging Track'],
    images: ['/images/property-1.png'],
    status: 'available',
    aiScore: { overall: 88, locationScore: 90, connectivityScore: 85, amenitiesScore: 92, roiPotential: 82, lastScoredAt: new Date() },
    views: 342, saves: 45, inquiries: 12,
  },
  {
    title: 'Brigade Gateway Enclave',
    description: 'Luxurious 4BHK villa with private garden in a gated community. Premium marble flooring, modular kitchen, and smart home automation throughout.',
    propertyType: 'Villa',
    listingType: 'Sale',
    price: 18000000,
    pricePerSqFt: 6000,
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'Brigade Gateway, Rajajinagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560010',
    },
    specifications: {
      bedrooms: 4, bathrooms: 4, balconies: 3,
      carpetArea: 3000, builtUpArea: 3500, plotArea: 2400,
      floor: 0, totalFloors: 3,
      parkingSpots: 3, facing: 'North',
      furnishingStatus: 'Fully-Furnished', age: 1,
    },
    amenities: ['Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Intercom', 'Children Play Area', 'Tennis Court'],
    images: ['/images/property-2.png'],
    status: 'available',
    aiScore: { overall: 85, locationScore: 82, connectivityScore: 78, amenitiesScore: 90, roiPotential: 88, lastScoredAt: new Date() },
    views: 567, saves: 78, inquiries: 23,
  },
  {
    title: 'Sobha Dream Acres',
    description: 'Modern 2BHK flat in one of Bangalore\'s fastest-growing corridors. Excellent connectivity to ORR and upcoming metro station. Great for first-time buyers.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 9500000,
    pricePerSqFt: 7917,
    location: {
      type: 'Point',
      coordinates: [77.6970, 12.8448],
      address: 'Sobha Dream Acres, Panathur Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560103',
    },
    specifications: {
      bedrooms: 2, bathrooms: 2, balconies: 1,
      carpetArea: 1200, builtUpArea: 1450,
      floor: 8, totalFloors: 20,
      parkingSpots: 1, facing: 'South-East',
      furnishingStatus: 'Semi-Furnished', age: 3,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'CCTV', 'Jogging Track', 'Gas Pipeline'],
    images: ['/images/property-3.png'],
    status: 'available',
    aiScore: { overall: 79, locationScore: 75, connectivityScore: 82, amenitiesScore: 72, roiPotential: 85, lastScoredAt: new Date() },
    views: 234, saves: 32, inquiries: 8,
  },
  {
    title: 'Embassy Tech Village',
    description: 'Premium commercial office space in Bangalore\'s tech hub. Grade A building with floor-to-ceiling glass, central AC, and premium lobby. Ideal for IT companies.',
    propertyType: 'Office',
    listingType: 'Lease',
    price: 5000000,
    pricePerSqFt: 2500,
    location: {
      type: 'Point',
      coordinates: [77.6924, 12.9279],
      address: 'Embassy Tech Village, Outer Ring Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560037',
    },
    specifications: {
      carpetArea: 2000, builtUpArea: 2400,
      floor: 5, totalFloors: 15,
      parkingSpots: 5, facing: 'West',
      furnishingStatus: 'Unfurnished', age: 1,
    },
    amenities: ['Lift', 'Parking', 'Security', 'Power Backup', 'CCTV', 'Intercom', 'Maintenance Staff'],
    images: ['/images/property-4.png'],
    status: 'available',
    aiScore: { overall: 82, locationScore: 95, connectivityScore: 90, amenitiesScore: 70, roiPotential: 78, lastScoredAt: new Date() },
    views: 123, saves: 15, inquiries: 5,
  },
  {
    title: 'Godrej Splendour',
    description: 'Elegant 3BHK apartment with panoramic city views. Premium finishes including Italian marble, designer fittings, and smart home integration.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 15500000,
    pricePerSqFt: 9700,
    location: {
      type: 'Point',
      coordinates: [77.6629, 12.9352],
      address: 'Godrej Splendour, Brookefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560048',
    },
    specifications: {
      bedrooms: 3, bathrooms: 3, balconies: 2,
      carpetArea: 1600, builtUpArea: 1950,
      floor: 18, totalFloors: 30,
      parkingSpots: 2, facing: 'North-East',
      furnishingStatus: 'Fully-Furnished', age: 0,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Intercom', 'Rainwater Harvesting', 'Solar Panels', 'Children Play Area', 'Jogging Track', 'Basketball Court'],
    images: ['/images/property-1.png'],
    status: 'available',
    aiScore: { overall: 91, locationScore: 88, connectivityScore: 86, amenitiesScore: 95, roiPotential: 90, lastScoredAt: new Date() },
    views: 678, saves: 112, inquiries: 34,
  },
  {
    title: 'Mantri Serenity',
    description: 'Peaceful 2BHK in a serene residential enclave. Walking distance to schools and hospitals. Perfect for families seeking tranquility within the city.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 7200000,
    pricePerSqFt: 6545,
    location: {
      type: 'Point',
      coordinates: [77.5738, 12.9141],
      address: 'Mantri Serenity, Kanakapura Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560062',
    },
    specifications: {
      bedrooms: 2, bathrooms: 2, balconies: 1,
      carpetArea: 1100, builtUpArea: 1350,
      floor: 5, totalFloors: 15,
      parkingSpots: 1, facing: 'South',
      furnishingStatus: 'Semi-Furnished', age: 5,
    },
    amenities: ['Lift', 'Gym', 'Parking', 'Security', 'Power Backup', 'Garden', 'CCTV', 'Children Play Area'],
    images: ['/images/property-3.png'],
    status: 'available',
    aiScore: { overall: 74, locationScore: 72, connectivityScore: 68, amenitiesScore: 70, roiPotential: 80, lastScoredAt: new Date() },
    views: 189, saves: 22, inquiries: 6,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await BuyerPreferences.deleteMany({});
    await SellerInsights.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create seller user
    const seller = await User.create({
      name: 'Raj Properties',
      email: 'seller@smartsite.com',
      password: 'password123',
      role: 'seller',
      phone: '+91 98765 43210',
      isVerified: true,
    });
    console.log('👤 Created seller:', seller.email);

    // Create buyer user
    const buyer = await User.create({
      name: 'Rahul Sharma',
      email: 'buyer@smartsite.com',
      password: 'password123',
      role: 'buyer',
      phone: '+91 91234 56789',
      isVerified: true,
    });
    console.log('👤 Created buyer:', buyer.email);

    // Create buyer preferences
    await BuyerPreferences.create({
      user: buyer._id,
      preferredPropertyTypes: ['Apartment', 'Villa'],
      listingPreference: 'Sale',
      budget: { min: 5000000, max: 20000000 },
      preferredLocations: ['Bangalore', 'Whitefield', 'Brookefield'],
      minBedrooms: 2,
      requiredAmenities: ['Gym', 'Parking'],
      buyerSegment: 'family',
      weights: {
        price: 0.30,
        location: 0.30,
        amenities: 0.20,
        connectivity: 0.10,
        roiPotential: 0.10,
      },
      referencePoint: {
        type: 'Point',
        coordinates: [77.6410, 12.9716],
      },
      isComplete: true,
    });
    console.log('⚙️  Created buyer preferences');

    // Create properties
    const createdProperties = [];
    for (const propData of sampleProperties) {
      const property = await Property.create({
        ...propData,
        seller: seller._id,
      });
      createdProperties.push(property);
    }
    console.log(`🏠 Created ${createdProperties.length} properties`);

    // Create seller insights for each property
    for (const property of createdProperties) {
      const suggestions = [];
      const aiScore = property.aiScore || {};
      
      if (aiScore.amenitiesScore < 80) {
        suggestions.push({
          type: 'amenity',
          priority: 'high',
          message: 'Add Gym amenity to boost Amenities score by ~12%',
          impact: 12,
        });
      }
      if (aiScore.connectivityScore < 85) {
        suggestions.push({
          type: 'targeting',
          priority: 'medium',
          message: 'Highlight metro proximity to improve Connectivity score by ~8%',
          impact: 8,
        });
      }
      suggestions.push({
        type: 'imagery',
        priority: 'low',
        message: 'Add professional photography to increase engagement by ~25%',
        impact: 25,
      });

      await SellerInsights.create({
        property: property._id,
        seller: seller._id,
        currentScore: {
          overall: aiScore.overall || 70,
          locationScore: aiScore.locationScore || 70,
          connectivityScore: aiScore.connectivityScore || 70,
          amenitiesScore: aiScore.amenitiesScore || 70,
          roiPotential: aiScore.roiPotential || 70,
        },
        scoreHistory: [
          { score: (aiScore.overall || 70) - 8, recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), reason: 'Initial scoring' },
          { score: (aiScore.overall || 70) - 3, recordedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), reason: 'Added amenities' },
          { score: aiScore.overall || 70, recordedAt: new Date(), reason: 'Latest analysis' },
        ],
        demandStats: {
          totalViews: property.views,
          uniqueViews: Math.round(property.views * 0.7),
          totalSaves: property.saves,
          totalInquiries: property.inquiries,
          weeklyTrend: [
            { week: '2026-W10', views: Math.round(property.views * 0.1), inquiries: Math.round(property.inquiries * 0.1) },
            { week: '2026-W11', views: Math.round(property.views * 0.12), inquiries: Math.round(property.inquiries * 0.12) },
            { week: '2026-W12', views: Math.round(property.views * 0.15), inquiries: Math.round(property.inquiries * 0.15) },
            { week: '2026-W13', views: Math.round(property.views * 0.18), inquiries: Math.round(property.inquiries * 0.2) },
            { week: '2026-W14', views: Math.round(property.views * 0.2), inquiries: Math.round(property.inquiries * 0.22) },
            { week: '2026-W15', views: Math.round(property.views * 0.25), inquiries: Math.round(property.inquiries * 0.2) },
          ],
        },
        demandLevel: property.inquiries > 20 ? 'very_high' : property.inquiries > 10 ? 'high' : property.inquiries > 5 ? 'moderate' : 'low',
        buyerSegmentMatch: {
          family: 65 + Math.round(Math.random() * 20),
          investor: 50 + Math.round(Math.random() * 30),
          student: 20 + Math.round(Math.random() * 20),
          bachelor: 30 + Math.round(Math.random() * 20),
          retiree: 40 + Math.round(Math.random() * 20),
        },
        topTargetSegment: 'family',
        improvementSuggestions: suggestions,
        lastAiAnalysisAt: new Date(),
        analysisVersion: '1.0.0',
      });
    }
    console.log('📊 Created seller insights for all properties');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Buyer:  buyer@smartsite.com / password123');
    console.log('   Seller: seller@smartsite.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
