/**
 * verify_step8_integration.js
 * Integration test: Verify that properties get scored by Python engine when created.
 *
 * Prerequisites:
 * 1. Node.js backend running: npm start (or npm run dev)
 * 2. Python scoring engine running: python scoring-engine/app.py
 * 3. MongoDB running and connected
 *
 * Run this test:
 * node verify_step8_integration.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const SCORING_ENGINE_URL = 'http://localhost:5000';

// Test data: A good property for scoring
const TEST_PROPERTY = {
  seller: null, // Will be set after creating user
  title: 'Beautiful 3BHK Apartment in Powai',
  description: 'Well-maintained apartment with modern amenities',
  propertyType: 'Apartment',
  listingType: 'Sale',
  price: 95000000, // ₹95 Lakhs
  pricePerSqFt: 59375,
  isPriceNegotiable: true,
  location: {
    type: 'Point',
    coordinates: [72.88, 19.08], // Powai, Mumbai [lon, lat]
    address: 'Powai IT Park Area',
    city: 'Powai',
    state: 'Maharashtra',
    pincode: '400076',
    country: 'India',
  },
  specifications: {
    bedrooms: 3,
    bathrooms: 2,
    balconies: 1,
    carpetArea: 1600,
    builtUpArea: 2000,
    floor: 12,
    totalFloors: 20,
    parkingSpots: 2,
    facing: 'East',
    furnishingStatus: 'Semi-Furnished',
    age: 5,
  },
  amenities: ['Parking', 'Gym', 'Security', 'Swimming Pool', 'Garden', 'Power Backup'],
  images: [],
  status: 'available',
};

// Test data: A property without parking (should score lower)
const TEST_PROPERTY_NO_PARKING = {
  seller: null,
  title: 'Apartment without Parking',
  description: 'Basic apartment, no parking available',
  propertyType: 'Apartment',
  listingType: 'Sale',
  price: 80000000,
  location: {
    type: 'Point',
    coordinates: [72.88, 19.08],
    address: 'Powai',
    city: 'Powai',
    state: 'Maharashtra',
    pincode: '400076',
    country: 'India',
  },
  specifications: {
    bedrooms: 3,
    bathrooms: 2,
    carpetArea: 1500,
    floor: 10,
    totalFloors: 15,
    facing: 'North',
    age: 10,
  },
  amenities: ['Gym', 'Security'], // No Parking
  images: [],
  status: 'available',
};

let testsPassed = 0;
let testsFailed = 0;

const log = (symbol, message) => {
  console.log(`${symbol} ${message}`);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async (name, fn) => {
  try {
    log('🧪', `TEST: ${name}`);
    await fn();
    testsPassed++;
    log('✅', `PASSED: ${name}\n`);
  } catch (error) {
    testsFailed++;
    log('❌', `FAILED: ${name}`);
    log('  ', `Reason: ${error.message}\n`);
  }
};

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 STEP 8: SCORING ENGINE INTEGRATION TESTS');
  console.log('='.repeat(70) + '\n');

  // ─────────────────────────────────────────────────────────────────────
  // Pre-flight checks
  // ─────────────────────────────────────────────────────────────────────

  console.log('📋 PRE-FLIGHT CHECKLIST\n');

  await test('Python Scoring Engine is running on port 5000', async () => {
    try {
      const response = await axios.get(`${SCORING_ENGINE_URL}/health`, { timeout: 2000 });
      if (response.status !== 200) throw new Error('Health check returned non-200 status');
    } catch (error) {
      throw new Error(
        `Scoring Engine not reachable. Make sure Python service is running: python scoring-engine/app.py\nError: ${error.message}`
      );
    }
  });

  await test('Node.js backend is running on port 3000', async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/properties`, { timeout: 2000 });
      // Any response means backend is running
    } catch (error) {
      throw new Error(
        `Backend not reachable. Make sure Node.js backend is running: npm start\nError: ${error.message}`
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 1: Create a test user (for property seller)
  // ─────────────────────────────────────────────────────────────────────

  console.log('\n📊 INTEGRATION TESTS\n');

  let sellerId = null;

  await test('Create test user (property seller)', async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, {
        name: `Test Seller ${Date.now()}`,
        email: `seller-${Date.now()}@test.com`,
        password: 'Test@123',
        role: 'seller',
      });

      if (!response.data.data || !response.data.data._id) {
        throw new Error('User creation response missing _id');
      }

      sellerId = response.data.data._id;
    } catch (error) {
      throw new Error(`User creation failed: ${error.response?.data?.message || error.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 2: Create a property and verify initial state
  // ─────────────────────────────────────────────────────────────────────

  let propertyId = null;
  let property = null;

  await test('Create property via POST /api/properties', async () => {
    try {
      const payload = { ...TEST_PROPERTY, seller: sellerId };
      const response = await axios.post(`${API_BASE_URL}/properties`, payload);

      if (!response.data.success || !response.data.data) {
        throw new Error('Property creation failed or missing data');
      }

      property = response.data.data;
      propertyId = property._id;

      if (!propertyId) {
        throw new Error('Created property has no _id');
      }
    } catch (error) {
      throw new Error(`Property creation failed: ${error.response?.data?.message || error.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 3: Wait for async scoring and verify aiScore is populated
  // ─────────────────────────────────────────────────────────────────────

  await test('Wait for async scoring to complete (30 second timeout)', async () => {
    let scored = false;
    let attempts = 0;
    const maxAttempts = 30; // Check every 1 second for 30 seconds

    while (attempts < maxAttempts && !scored) {
      await delay(1000);
      attempts++;

      try {
        const response = await axios.get(`${API_BASE_URL}/properties/${propertyId}`);
        property = response.data.data;

        if (property.aiScore && property.aiScore.overall) {
          scored = true;
          log('  ', `Scoring completed in ${attempts} seconds`);
        }
      } catch (error) {
        // Continue waiting
      }
    }

    if (!scored) {
      throw new Error(
        `Scoring did not complete within 30 seconds. Check if Python scoring engine is running and accessible.`
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 4: Verify aiScore structure
  // ─────────────────────────────────────────────────────────────────────

  await test('aiScore is present and has overall score', async () => {
    if (!property.aiScore) {
      throw new Error('aiScore object is missing');
    }
    if (typeof property.aiScore.overall !== 'number') {
      throw new Error(`aiScore.overall is not a number: ${property.aiScore.overall}`);
    }
    if (property.aiScore.overall < 0 || property.aiScore.overall > 100) {
      throw new Error(`aiScore.overall is out of range [0-100]: ${property.aiScore.overall}`);
    }
    log('  ', `Overall score: ${property.aiScore.overall}/100`);
  });

  await test('All component scores are present', async () => {
    const requiredFields = ['locationScore', 'connectivityScore', 'amenitiesScore', 'roiPotential'];
    const missing = [];

    for (const field of requiredFields) {
      if (typeof property.aiScore[field] !== 'number') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing or invalid component scores: ${missing.join(', ')}`);
    }

    log('  ', `✓ Location: ${property.aiScore.locationScore}/100`);
    log('  ', `✓ Connectivity: ${property.aiScore.connectivityScore}/100`);
    log('  ', `✓ Amenities: ${property.aiScore.amenitiesScore}/100`);
    log('  ', `✓ ROI: ${property.aiScore.roiPotential}/100`);
  });

  await test('lastScoredAt timestamp is set', async () => {
    if (!property.aiScore.lastScoredAt) {
      throw new Error('lastScoredAt is missing');
    }
    const date = new Date(property.aiScore.lastScoredAt);
    if (isNaN(date.getTime())) {
      throw new Error('lastScoredAt is not a valid date');
    }
    log('  ', `Scored at: ${date.toISOString()}`);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 5: Verify reasonable score ranges for good Powai property
  // ─────────────────────────────────────────────────────────────────────

  await test('Overall score is in reasonable range for good property (75-95)', async () => {
    if (property.aiScore.overall < 75 || property.aiScore.overall > 95) {
      throw new Error(
        `Score ${property.aiScore.overall} is out of expected range for good property (75-95)`
      );
    }
    log('  ', `Score is reasonable: ${property.aiScore.overall}/100`);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 6: Create property without parking and verify comparative scoring
  // ─────────────────────────────────────────────────────────────────────

  let propertyNoParkingId = null;
  let propertyNoParking = null;

  await test('Create second property without parking', async () => {
    try {
      const payload = { ...TEST_PROPERTY_NO_PARKING, seller: sellerId };
      const response = await axios.post(`${API_BASE_URL}/properties`, payload);

      if (!response.data.success || !response.data.data) {
        throw new Error('Property creation failed');
      }

      propertyNoParkingId = response.data.data._id;
    } catch (error) {
      throw new Error(`Failed to create second property: ${error.message}`);
    }
  });

  await test('Wait for second property scoring', async () => {
    let scored = false;
    let attempts = 0;

    while (attempts < 30 && !scored) {
      await delay(1000);
      attempts++;

      try {
        const response = await axios.get(`${API_BASE_URL}/properties/${propertyNoParkingId}`);
        propertyNoParking = response.data.data;

        if (propertyNoParking.aiScore && propertyNoParking.aiScore.overall) {
          scored = true;
        }
      } catch (error) {
        // Continue waiting
      }
    }

    if (!scored) {
      throw new Error('Scoring timeout for second property');
    }
  });

  await test('Property without parking scores lower than with parking', async () => {
    if (propertyNoParking.aiScore.overall >= property.aiScore.overall) {
      throw new Error(
        `No-parking score (${propertyNoParking.aiScore.overall}) should be lower than with-parking (${property.aiScore.overall})`
      );
    }
    log('  ', `With parking: ${property.aiScore.overall}`);
    log('  ', `Without parking: ${propertyNoParking.aiScore.overall}`);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Results
  // ─────────────────────────────────────────────────────────────────────

  console.log('='.repeat(70));
  console.log(`📊 RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(70) + '\n');

  if (testsFailed === 0) {
    log('✅', 'ALL TESTS PASSED! Step 8 integration is complete.\n');
    process.exit(0);
  } else {
    log('❌', `${testsFailed} test(s) failed. See details above.\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
