/**
 * verify_buyer_preferences.js
 * Integration test for Buyer Preferences APIs.
 *
 * Tests:
 * 1. Save preferences (POST /api/buyer/preferences)
 * 2. Fetch preferences (GET /api/buyer/preferences)
 * 3. Update preferences (PATCH /api/buyer/preferences)
 * 4. Delete preferences (DELETE /api/buyer/preferences)
 * 5. Error handling (validation, not found, etc.)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
let testBuyerId = null;
const testBuyerData = {
  name: 'Test Buyer',
  email: `testbuyer_${Date.now()}@test.com`,
  password: 'Password@123',
  role: 'buyer'
};

const preferenceData = {
  budget: { min: 50, max: 150 }, // 50-150 Lakhs
  preferredPropertyTypes: ['Apartment', 'Villa'], // Use correct field name
  minBedrooms: 2,
  minCarpetAreaSqFt: 1200,
  buyerSegment: 'family',
  listingPreference: 'Sale',
  furnishingPreference: ['Semi-Furnished', 'Fully-Furnished'],
  preferredLocations: ['Bandra', 'Powai', 'Andheri'],
  referencePoint: {
    type: 'Point',
    coordinates: [72.88, 19.08] // Mumbai
  },
  maxDistanceKm: 10,
  requiredAmenities: ['Parking', 'Gym', 'Security'],
  weights: {
    price: 0.35,
    location: 0.30,
    amenities: 0.20,
    connectivity: 0.10,
    roiPotential: 0.05
  }
};

/**
 * Helper: Log test result
 */
function logTest(testNum, name, passed) {
  const symbol = passed ? '✅' : '❌';
  console.log(`${symbol} Test ${testNum}: ${name}`);
}

/**
 * Run all integration tests
 */
async function runTests() {
  try {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('🧪 BUYER PREFERENCES API INTEGRATION TESTS');
    console.log('══════════════════════════════════════════════════════════\n');

    // ──────────────────────────────────────────────────────────────
    // SETUP: Register a test buyer
    // ──────────────────────────────────────────────────────────────
    console.log('📝 SETUP: Registering test buyer...');
    const registerRes = await axios.post(`${BASE_URL}/users/register`, testBuyerData);
    testBuyerId = registerRes.data.data._id;
    console.log(`✅ Buyer registered with ID: ${testBuyerId}\n`);

    // ──────────────────────────────────────────────────────────────
    // TEST 1: Save preferences (POST)
    // ──────────────────────────────────────────────────────────────
    console.log('TEST GROUP 1: Save Preferences (POST)');
    console.log('─────────────────────────────────────────────────\n');

    try {
      const saveRes = await axios.post(`${BASE_URL}/buyer/preferences`, {
        buyerId: testBuyerId,
        ...preferenceData
      });
      logTest(1, 'Save preferences succeeds', saveRes.status === 201);
      logTest(2, 'Response has correct structure',
        saveRes.data.success === true && saveRes.data.message && saveRes.data.data);
      logTest(3, 'Preferences have budget field',
        saveRes.data.data.budget && saveRes.data.data.budget.min === 50);
      logTest(4, 'Preferences have weights field',
        saveRes.data.data.weights && saveRes.data.data.weights.price === 0.35);
      console.log();
    } catch (err) {
      logTest(1, 'Save preferences succeeds', false);
      console.error('Error:', err.response?.data || err.message);
      console.log();
    }

    // ──────────────────────────────────────────────────────────────
    // TEST 2: Fetch preferences (GET)
    // ──────────────────────────────────────────────────────────────
    console.log('TEST GROUP 2: Fetch Preferences (GET)');
    console.log('─────────────────────────────────────────────────\n');

    try {
      const fetchRes = await axios.get(`${BASE_URL}/buyer/preferences`, {
        params: { buyerId: testBuyerId }
      });
      logTest(5, 'Fetch preferences succeeds', fetchRes.status === 200);
      logTest(6, 'Fetched data matches saved data',
        fetchRes.data.data.budget.min === 50 && fetchRes.data.data.minBedrooms === 2);
      logTest(7, 'Geospatial reference point is preserved',
        fetchRes.data.data.referencePoint &&
        fetchRes.data.data.referencePoint.coordinates[0] === 72.88);
      console.log();
    } catch (err) {
      logTest(5, 'Fetch preferences succeeds', false);
      console.error('Error:', err.response?.data || err.message);
      console.log();
    }

    // ──────────────────────────────────────────────────────────────
    // TEST 3: Update preferences (PATCH - partial update)
    // ──────────────────────────────────────────────────────────────
    console.log('TEST GROUP 3: Update Preferences (PATCH)');
    console.log('─────────────────────────────────────────────────\n');

    try {
      const updateRes = await axios.patch(`${BASE_URL}/buyer/preferences`, {
        buyerId: testBuyerId,
        budget: { min: 75, max: 200 },
        minBedrooms: 3
      });
      logTest(8, 'Update preferences succeeds', updateRes.status === 200);
      logTest(9, 'Budget is updated',
        updateRes.data.data.budget.min === 75);
      logTest(10, 'Bedrooms are updated',
        updateRes.data.data.minBedrooms === 3);
      logTest(11, 'Other fields are preserved',
        updateRes.data.data.preferredPropertyTypes && updateRes.data.data.preferredPropertyTypes.length > 0);
      console.log();
    } catch (err) {
      logTest(8, 'Update preferences succeeds', false);
      console.error('Error:', err.response?.data || err.message);
      console.log();
    }

    // ──────────────────────────────────────────────────────────────
    // TEST 4: Validation - Budget range validation
    // ──────────────────────────────────────────────────────────────
    console.log('TEST GROUP 4: Validation Tests');
    console.log('─────────────────────────────────────────────────\n');

    try {
      await axios.post(`${BASE_URL}/buyer/preferences`, {
        buyerId: testBuyerId,
        budget: { min: 200, max: 100 } // min > max
      });
      logTest(12, 'Budget validation detects min > max', false);
    } catch (err) {
      logTest(12, 'Budget validation detects min > max',
        err.response?.status === 400);
    }

    try {
      await axios.post(`${BASE_URL}/buyer/preferences`, {
        buyerId: testBuyerId,
        weights: {
          price: 0.5,
          location: 0.3,
          amenities: 0.2
          // sum = 1.0
        }
      });
      logTest(13, 'Weights validation accepts valid sum', true);
    } catch (err) {
      logTest(13, 'Weights validation accepts valid sum', false);
      console.error('Error:', err.response?.data || err.message);
    }

    try {
      await axios.post(`${BASE_URL}/buyer/preferences`, {
        buyerId: testBuyerId,
        weights: {
          price: 0.5,
          location: 0.3,
          amenities: 0.1 // sum = 0.9, not 1.0
        }
      });
      logTest(14, 'Weights validation detects invalid sum', false);
    } catch (err) {
      logTest(14, 'Weights validation detects invalid sum',
        err.response?.status === 400);
    }

    try {
      await axios.post(`${BASE_URL}/buyer/preferences`, {
        buyerId: testBuyerId,
        referencePoint: {
          type: 'Point',
          coordinates: [270, 19.08] // invalid longitude
        }
      });
      logTest(15, 'Geospatial validation detects invalid coordinates', false);
    } catch (err) {
      logTest(15, 'Geospatial validation detects invalid coordinates',
        err.response?.status === 400);
    }

    console.log();

    // ──────────────────────────────────────────────────────────────
    // TEST 5: Delete preferences (DELETE)
    // ──────────────────────────────────────────────────────────────
    console.log('TEST GROUP 5: Delete Preferences (DELETE)');
    console.log('─────────────────────────────────────────────────\n');

    try {
      const deleteRes = await axios.delete(`${BASE_URL}/buyer/preferences`, {
        params: { buyerId: testBuyerId }
      });
      logTest(16, 'Delete preferences succeeds', deleteRes.status === 200);
    } catch (err) {
      logTest(16, 'Delete preferences succeeds', false);
      console.error('Error:', err.response?.data || err.message);
    }

    // Verify deletion
    try {
      await axios.get(`${BASE_URL}/buyer/preferences`, {
        params: { buyerId: testBuyerId }
      });
      logTest(17, 'Verify deletion (404 on fetch)', false);
    } catch (err) {
      logTest(17, 'Verify deletion (404 on fetch)',
        err.response?.status === 404);
    }

    console.log();

    // ──────────────────────────────────────────────────────────────
    // TEST 6: Error handling
    // ──────────────────────────────────────────────────────────────
    console.log('TEST GROUP 6: Error Handling');
    console.log('─────────────────────────────────────────────────\n');

    try {
      await axios.get(`${BASE_URL}/buyer/preferences`, {
        params: { buyerId: '507f1f77bcf86cd799439011' } // Valid ObjectId format that doesn't exist
      });
      logTest(18, 'Invalid buyerId returns 404', false);
    } catch (err) {
      logTest(18, 'Invalid buyerId returns 404',
        err.response?.status === 404);
    }

    try {
      await axios.post(`${BASE_URL}/buyer/preferences`, {
        // missing buyerId
        budget: { min: 50, max: 100 }
      });
      logTest(19, 'Missing buyerId returns 400', false);
    } catch (err) {
      logTest(19, 'Missing buyerId returns 400',
        err.response?.status === 400);
    }

    console.log();
    console.log('══════════════════════════════════════════════════════════');
    console.log('🎉 ALL BUYER PREFERENCES TESTS COMPLETED!');
    console.log('══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ SETUP ERROR:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
