require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Property = require('./src/models/Property');
const BuyerPreferences = require('./src/models/BuyerPreferences');
const SellerInsights = require('./src/models/SellerInsights');

const MONGO_URI = process.env.MONGO_URI;

// Mumbai Neighborhoods and their typical coordinates
const mumbaiLocations = [
  { area: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', coords: [72.8333, 19.0596], priceMult: 1.5, type: 'Apartment' },
  { area: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', coords: [72.8340, 19.1351], priceMult: 1.1, type: 'Apartment' },
  { area: 'Colaba', city: 'Mumbai', state: 'Maharashtra', pincode: '400005', coords: [72.8258, 18.9154], priceMult: 1.8, type: 'Apartment' },
  { area: 'Juhu', city: 'Mumbai', state: 'Maharashtra', pincode: '400049', coords: [72.8258, 19.1075], priceMult: 1.6, type: 'Villa' },
  { area: 'Powai', city: 'Mumbai', state: 'Maharashtra', pincode: '400076', coords: [72.9056, 19.1197], priceMult: 1.2, type: 'Apartment' },
  { area: 'Borivali West', city: 'Mumbai', state: 'Maharashtra', pincode: '400092', coords: [72.8465, 19.2345], priceMult: 0.8, type: 'Apartment' },
  { area: 'Malad West', city: 'Mumbai', state: 'Maharashtra', pincode: '400064', coords: [72.8409, 19.1860], priceMult: 0.85, type: 'Apartment' },
  { area: 'Goregaon East', city: 'Mumbai', state: 'Maharashtra', pincode: '400063', coords: [72.8596, 19.1685], priceMult: 0.9, type: 'Apartment' },
  { area: 'Worli', city: 'Mumbai', state: 'Maharashtra', pincode: '400018', coords: [72.8183, 19.0169], priceMult: 1.7, type: 'Apartment' },
  { area: 'Lower Parel', city: 'Mumbai', state: 'Maharashtra', pincode: '400013', coords: [72.8258, 18.9950], priceMult: 1.5, type: 'Apartment' }
];

const builders = ['Lodha', 'Godrej', 'Rustomjee', 'Oberoi', 'Hiranandani', 'Prestige', 'K Raheja', 'Piramal', 'Runwal', 'Kalpataru'];
const adjectives = ['Luxurious', 'Premium', 'Modern', 'Elegant', 'Spacious', 'Sea-view', 'Exclusive'];
const propertyAmenities = [
  'Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 
  'Garden', 'Clubhouse', 'CCTV', 'Children Play Area', 'Jogging Track',
  'Tennis Court', 'Gas Pipeline', 'Intercom', 'Maintenance Staff'
];
const facings = ['East', 'West', 'North', 'South', 'North-East', 'South-East'];
const statuses = ['Fully-Furnished', 'Semi-Furnished', 'Unfurnished'];

// Helper to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random number between min and max
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper to get random sub-array
const randomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateMumbaiProperties = (sellerId) => {
  const properties = [];
  for (let i = 0; i < 50; i++) {
    const loc = randomItem(mumbaiLocations);
    const builder = randomItem(builders);
    const bedrooms = randomInt(1, 4);
    const carpetArea = bedrooms * randomInt(350, 500);
    const builtinArea = Math.round(carpetArea * 1.2);
    const pricePerSqFt = Math.round(randomInt(12000, 35000) * loc.priceMult);
    const price = builtInArea = carpetArea * 1.3 * pricePerSqFt; // approx total
    
    // Slight randomization of coordinates
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    const coordinates = [loc.coords[0] + lngOffset, loc.coords[1] + latOffset];

    const isCommercial = Math.random() > 0.9;
    const propType = isCommercial ? 'Office' : loc.type;

    properties.push({
      seller: sellerId,
      title: `${builder} ${randomItem(adjectives)} ${propType}`,
      description: `A ${adjectives[Math.floor(Math.random() * adjectives.length)].toLowerCase()} ${bedrooms}BHK ${propType.toLowerCase()} located in the prime area of ${loc.area}, Mumbai. Experience the best of city life with premium amenities and top-class connectivity.`,
      propertyType: propType,
      listingType: Math.random() > 0.8 ? 'Lease' : 'Sale',
      price: Math.round(price / 100000) * 100000, // round to nearest lakh
      pricePerSqFt: pricePerSqFt,
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: `${builder} Enclave, ${loc.area}`,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
      },
      specifications: {
        bedrooms: isCommercial ? 0 : bedrooms, 
        bathrooms: isCommercial ? 2 : bedrooms, 
        balconies: isCommercial ? 0 : randomInt(0, Math.min(bedrooms, 3)),
        carpetArea: carpetArea, 
        builtUpArea: Math.round(carpetArea * 1.25),
        floor: randomInt(1, 45), 
        totalFloors: randomInt(10, 60),
        parkingSpots: randomInt(1, 3), 
        facing: randomItem(facings),
        furnishingStatus: randomItem(statuses), 
        age: randomInt(0, 15),
      },
      amenities: randomItems(propertyAmenities, randomInt(5, 12)),
      images: [`/images/property-${randomInt(1, 4)}.png`],
      status: 'available',
      aiScore: { 
        overall: randomInt(70, 96), 
        locationScore: randomInt(75, 99), 
        connectivityScore: randomInt(80, 99), 
        amenitiesScore: randomInt(70, 98), 
        roiPotential: randomInt(65, 95), 
        lastScoredAt: new Date() 
      },
      views: randomInt(50, 1000), 
      saves: randomInt(10, 200), 
      inquiries: randomInt(1, 50),
    });
  }
  return properties;
};

// ... run the seed 
const runSeed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear db
    await User.deleteMany({});
    await Property.deleteMany({});
    await BuyerPreferences.deleteMany({});
    await SellerInsights.deleteMany({});
    console.log('🗑️  Cleared existing data (Including Properties, Users, Insights)');

    // Create Seller
    const seller = new User({
      name: 'Mumbai Premium Realtors',
      email: 'seller@smartsite.com',
      password: 'password123',
      role: 'seller',
      phone: '9876543210'
    });
    await seller.save();
    console.log('👤 Created demo seller: seller@smartsite.com');

    // Create Buyer
    const buyer = new User({
      name: 'Demo Buyer',
      email: 'buyer@smartsite.com',
      password: 'password123',
      role: 'buyer',
      phone: '9876543211'
    });
    await buyer.save();
    console.log('👤 Created demo buyer: buyer@smartsite.com');

    // Generate 50 Mumbai properties
    const mumbaiProps = generateMumbaiProperties(seller._id);
    const createdProperties = await Property.insertMany(mumbaiProps);
    console.log(`🏠 Created ${createdProperties.length} Mumbai properties`);

    // Create Preferences
    const prefs = new BuyerPreferences({
      user: buyer._id,
      budget: { min: 10000000, max: 80000000 },
      preferredLocations: ['Andheri West', 'Bandra West', 'Powai'],
      preferredPropertyTypes: ['Apartment'],
      minBedrooms: 2,
      minCarpetAreaSqFt: 800,
      furnishingPreference: ['Semi-Furnished', 'Fully-Furnished'],
      requiredAmenities: ['Gym', 'Swimming Pool', 'Security'],
      referencePoint: { type: 'Point', coordinates: [72.8777, 19.0760] },
      maxDistanceKm: 20
    });
    await prefs.save();
    console.log('⚙️  Created buyer preferences for Mumbai');

    // Create insights
    const insights = createdProperties.map(prop => ({
      property: prop._id,
      seller: seller._id,
      viewData: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        views: randomInt(5, 50)
      })),
      inquiryData: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        inquiries: randomInt(0, 5)
      })),
      demographics: {
        ageGroups: { '18-24': 5, '25-34': 40, '35-44': 35, '45-54': 15, '55+': 5 },
        topLocations: [{ city: 'Mumbai', percentage: 80 }, { city: 'Pune', percentage: 10 }, { city: 'Delhi', percentage: 10 }]
      },
      competitorComparison: {
        pricePercentile: randomInt(30, 90),
        viewsPercentile: randomInt(40, 95),
        similarPropertiesCount: randomInt(5, 50)
      }
    }));
    await SellerInsights.insertMany(insights);
    console.log('📊 Created seller insights for all properties');

    console.log('\n✅ Mumbai Seed completed successfully!');
    console.log('📋 Test Credentials:');
    console.log('   Buyer:  buyer@smartsite.com / password123');
    console.log('   Seller: seller@smartsite.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

runSeed();