require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Property = require('./src/models/Property');
const BuyerPreferences = require('./src/models/BuyerPreferences');
const SellerInsights = require('./src/models/SellerInsights');
const propertyService = require('./src/services/propertyService');

const MONGO_URI = process.env.MONGO_URI;

const mumbaiSellers = [
  {
    name: 'Lodha Developers',
    email: 'seller_lodha@smartsite.com',
    password: 'password123',
    role: 'seller',
    phone: '+91 98765 00001'
  },
  {
    name: 'Godrej Properties',
    email: 'seller_godrej@smartsite.com',
    password: 'password123',
    role: 'seller',
    phone: '+91 98765 00002'
  },
  {
    name: 'Oberoi Realty',
    email: 'seller_oberoi@smartsite.com',
    password: 'password123',
    role: 'seller',
    phone: '+91 98765 00003'
  },
  {
    name: 'Hiranandani Group',
    email: 'seller_hiranandani@smartsite.com',
    password: 'password123',
    role: 'seller',
    phone: '+91 98765 00004'
  }
];

const mumbaiProperties = [
  {
    title: 'Lodha Park - Allura',
    description: 'Incredible 3BHK sea-view apartment in Worli. Set in a 17-acre development with a 7-acre private park, multiple swimming pools, and an exclusive clubhouse.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 65000000, 
    pricePerSqFt: 46428,
    sellerIndex: 0, // Lodha
    location: {
      type: 'Point',
      coordinates: [72.8242, 19.0116], // Worli, Lower Parel border
      address: 'Lodha Park, Pandurang Budhkar Marg, Worli',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400018',
    },
    specifications: {
      bedrooms: 3, bathrooms: 3, balconies: 1,
      carpetArea: 1400, builtUpArea: 1800,
      floor: 54, totalFloors: 78,
      parkingSpots: 2, facing: 'West',
      furnishingStatus: 'Semi-Furnished', age: 2,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Children Play Area', 'Jogging Track', 'Tennis Court'],
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'Godrej Trees - Premium 2BHK',
    description: 'A vibrant flagship project by Godrej Properties situated in Vikhroli. Excellent connectivity to Eastern Express Highway. Features world-class commercial and residential retail spaces inside the complex.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 32000000,
    pricePerSqFt: 38095,
    sellerIndex: 1, // Godrej
    location: {
      type: 'Point',
      coordinates: [72.9272, 19.0975], // Vikhroli
      address: 'The Trees by Godrej, Vikhroli East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400079',
    },
    specifications: {
      bedrooms: 2, bathrooms: 2, balconies: 0,
      carpetArea: 840, builtUpArea: 1100,
      floor: 15, totalFloors: 35,
      parkingSpots: 1, facing: 'East',
      furnishingStatus: 'Unfurnished', age: 4,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Jogging Track', 'Maintenance Staff'],
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'Oberoi Sky City - Opulent Life',
    description: 'Spacious 3BHK in Borivali East right next to the Western Express Highway and upcoming Metro Station. Expansive views of the Sanjay Gandhi National Park.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 34000000,
    pricePerSqFt: 30909,
    sellerIndex: 2, // Oberoi
    location: {
      type: 'Point',
      coordinates: [72.8654, 19.2206], // Borivali East
      address: 'Oberoi Sky City, Off WEH, Borivali East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400066',
    },
    specifications: {
      bedrooms: 3, bathrooms: 3, balconies: 1,
      carpetArea: 1100, builtUpArea: 1450,
      floor: 42, totalFloors: 60,
      parkingSpots: 2, facing: 'North-East',
      furnishingStatus: 'Semi-Furnished', age: 1,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Children Play Area', 'Basketball Court'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'Hiranandani Atlantis',
    description: 'Beautiful 2BHK in the heart of Hiranandani Gardens, Powai. Steps away from the high street, Galleria mall, schools, and hospitals with stunning lake viewing options.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 31000000,
    pricePerSqFt: 41333,
    sellerIndex: 3, // Hiranandani
    location: {
      type: 'Point',
      coordinates: [72.9056, 19.1197], // Powai
      address: 'Hiranandani Gardens, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400076',
    },
    specifications: {
      bedrooms: 2, bathrooms: 2, balconies: 0,
      carpetArea: 750, builtUpArea: 950,
      floor: 18, totalFloors: 28,
      parkingSpots: 1, facing: 'South',
      furnishingStatus: 'Fully-Furnished', age: 8,
    },
    amenities: ['Lift', 'Gym', 'Parking', 'Security', 'Power Backup', 'Garden', 'Clubhouse', 'CCTV', 'Water Storage', 'Maintenance Staff'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1de2d9d044?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'Rustomjee Seasons - BKC Annexe',
    description: 'Luxurious 3BHK perfectly situated in BKC Annexe. Just minutes away from elite corporate hubs, Jio World Drive, and top international schools.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 45000000,
    pricePerSqFt: 37500,
    sellerIndex: 0, // Reusing lodha for demo if needed, but lets just map to index
    location: {
      type: 'Point',
      coordinates: [72.8530, 19.0601], // BKC Annexe
      address: 'Rustomjee Seasons, BKC Annexe, Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
    },
    specifications: {
      bedrooms: 3, bathrooms: 3, balconies: 2,
      carpetArea: 1200, builtUpArea: 1550,
      floor: 12, totalFloors: 24,
      parkingSpots: 2, facing: 'West',
      furnishingStatus: 'Semi-Furnished', age: 3,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Clubhouse', 'CCTV', 'Tennis Court', 'Children Play Area'],
    images: ['https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'L&T Crescent Bay',
    description: 'A marquee gated development in Parel. 2BHK residence with an elevated sky deck connecting the towers. Brilliant connectivity via Eastern Freeway.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 36000000,
    pricePerSqFt: 42352,
    sellerIndex: 1, 
    location: {
      type: 'Point',
      coordinates: [72.8427, 18.9953], // Parel
      address: 'L&T Crescent Bay, Jerbai Wadia Road, Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400012',
    },
    specifications: {
      bedrooms: 2, bathrooms: 2, balconies: 1,
      carpetArea: 850, builtUpArea: 1100,
      floor: 34, totalFloors: 50,
      parkingSpots: 1, facing: 'East',
      furnishingStatus: 'Unfurnished', age: 5,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Clubhouse', 'CCTV', 'Jogging Track', 'Basketball Court'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'Piramal Revanta - Modern Studio',
    description: 'Ideal studio apartment for bachelors or young couples in Mulund West. Right on the edge of the Sanjay Gandhi National Park, exceptionally green and peaceful.',
    propertyType: 'Studio',
    listingType: 'Sale',
    price: 13000000,
    pricePerSqFt: 28888,
    sellerIndex: 2,
    location: {
      type: 'Point',
      coordinates: [72.9431, 19.1764], // Mulund West
      address: 'Piramal Revanta, Goregaon-Mulund Link Road, Mulund West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400080',
    },
    specifications: {
      bedrooms: 1, bathrooms: 1, balconies: 0,
      carpetArea: 450, builtUpArea: 600,
      floor: 10, totalFloors: 45,
      parkingSpots: 1, facing: 'North',
      furnishingStatus: 'Fully-Furnished', age: 2,
    },
    amenities: ['Lift', 'Gym', 'Parking', 'Security', 'Power Backup', 'CCTV', 'Garden', 'Children Play Area'],
    images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80'],
    status: 'available',
  },
  {
    title: 'Runwal Forests - Kanjurmarg',
    description: 'Premium 3BHK flat situated over 15 acres of lush greenery. Fantastic views of the Powai lake and hills. Walking distance to Kanjurmarg station.',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: 24500000,
    pricePerSqFt: 24500,
    sellerIndex: 3,
    location: {
      type: 'Point',
      coordinates: [72.9348, 19.1251], // Kanjurmarg West
      address: 'Runwal Forests, LBS Marg, Kanjurmarg West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400078',
    },
    specifications: {
      bedrooms: 3, bathrooms: 3, balconies: 1,
      carpetArea: 1000, builtUpArea: 1350,
      floor: 21, totalFloors: 40,
      parkingSpots: 2, facing: 'South-East',
      furnishingStatus: 'Semi-Furnished', age: 3,
    },
    amenities: ['Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Clubhouse', 'CCTV', 'Rainwater Harvesting', 'Gas Pipeline'],
    images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'],
    status: 'available',
  }
];

const seedMumbai = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await BuyerPreferences.deleteMany({});
    await SellerInsights.deleteMany({});
    console.log('🗑️  Cleared all old data');

    // Create 4 Real Sellers
    const createdSellers = [];
    for (const s of mumbaiSellers) {
      createdSellers.push(await User.create(s));
      console.log(`👤 Created seller: ${s.name}`);
    }

    // Create realistic dynamic properties and trigger scoring engine
    console.log('🏠 Creating dynamic Mumbai properties (and sending to Python AI engine)...');
    
    // We will use propertyService so it hits the Python API properly!
    for (const p of mumbaiProperties) {
      p.seller = createdSellers[p.sellerIndex]._id;
      
      // Call service instead of direct Mongoose so the Non-blocking Python scoring works
      const property = await propertyService.createProperty(p);
      console.log(`  -> Created & Sent to AI: ${property.title}`);
      
      // Delay slightly to give Python Flask server time to breathe nicely without throttling
      await new Promise(r => setTimeout(r, 500)); 
    }

    // Create ONE test buyer with NO preferences set up yet
    const testBuyer = await User.create({
      name: 'Rahul Sharma',
      email: 'buyer@smartsite.com',
      password: 'password123',
      role: 'buyer',
      phone: '+91 99999 11111'
    });
    console.log('👤 Created demo buyer: buyer@smartsite.com');

    // Buyer preference should be created by the Mongoose hook / route logic, but we do it manually for seed
    await BuyerPreferences.create({
      user: testBuyer._id,
      weights: { price: 0.35, location: 0.30, amenities: 0.20, connectivity: 0.10, roiPotential: 0.05 }
    });

    console.log('✅ Mumbai database successfully seeded and scored!');
    console.log('----------------------------------------------------');
    console.log('Login credentials:');
    console.log('Buyer: buyer@smartsite.com / password123');
    console.log('Seller 1: seller_lodha@smartsite.com / password123');
    console.log('Seller 2: seller_godrej@smartsite.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding completely failed', error);
    process.exit(1);
  }
};

seedMumbai();