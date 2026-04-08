const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function debug() {
  try {
    // Test case 1: Check what happens when we PATCH with only partial data
    console.log('═══ TEST 1: PATCH Preserves Other Fields ═══\n');
    const buyerRes = await axios.post(`${BASE_URL}/users/register`, {
      name: 'Debug Buyer 1',
      email: `debug1_${Date.now()}@test.com`,
      password: 'Password@123',
      role: 'buyer'
    });
    const buyerId = buyerRes.data.data._id;

    // Save with propertyTypes
    const saveRes = await axios.post(`${BASE_URL}/buyer/preferences`, {
      buyerId,
      budget: { min: 50, max: 150 },
      propertyTypes: ['Apartment', 'Villa'],
      minBedrooms: 2
    });
    console.log('After SAVE:');
    console.log('  propertyTypes:', saveRes.data.data.propertyTypes);
    console.log('  minBedrooms:', saveRes.data.data.minBedrooms);

    // PATCH with only minBedrooms
    const patchRes = await axios.patch(`${BASE_URL}/buyer/preferences`, {
      buyerId,
      minBedrooms: 3
    });
    console.log('\nAfter PATCH (only minBedrooms):');
    console.log('  propertyTypes:', patchRes.data.data.propertyTypes);
    console.log('  minBedrooms:', patchRes.data.data.minBedrooms);
    console.log('  Test 11 check: propertyTypes.length > 0?', patchRes.data.data.propertyTypes && patchRes.data.data.propertyTypes.length > 0);

    // Test case 2: Check error for invalid buyerId
    console.log('\n═══ TEST 2: Invalid buyerId Error ═══\n');
    try {
      const invalidId = '507f1f77bcf86cd799439011'; // valid format but doesn't exist
      await axios.get(`${BASE_URL}/buyer/preferences`, {
        params: { buyerId: invalidId }
      });
      console.log('❌ Should have thrown an error');
    } catch (err) {
      console.log('Status:', err.response?.status);
      console.log('Message:', err.response?.data?.message);
      console.log('Test 18 check: status === 404?', err.response?.status === 404);
    }

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

debug();
