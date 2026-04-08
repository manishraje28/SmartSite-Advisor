const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function debug() {
  try {
    // Create test buyer
    const buyerRes = await axios.post(`${BASE_URL}/users/register`, {
      name: 'Debug Buyer',
      email: `debug_${Date.now()}@test.com`,
      password: 'Password@123',
      role: 'buyer'
    });
    const buyerId = buyerRes.data.data._id;
    console.log('Buyer ID:', buyerId);

    // Save full preferences
    const saveRes = await axios.post(`${BASE_URL}/buyer/preferences`, {
      buyerId,
      budget: { min: 50, max: 150 },
      propertyTypes: ['Apartment', 'Villa'],
      minBedrooms: 2,
      buyerSegment: 'family'
    });
    console.log('\n✅ After SAVE:');
    console.log('  propertyTypes:', saveRes.data.data.propertyTypes);
    console.log('  minBedrooms:', saveRes.data.data.minBedrooms);

    // Patch update
    const updateRes = await axios.patch(`${BASE_URL}/buyer/preferences`, {
      buyerId,
      minBedrooms: 3
    });
    console.log('\n✅ After PATCH (only minBedrooms):');
    console.log('  propertyTypes:', updateRes.data.data.propertyTypes);
    console.log('  minBedrooms:', updateRes.data.data.minBedrooms);

    // Test with invalid buyerId
    try {
      await axios.get(`${BASE_URL}/buyer/preferences`, {
        params: { buyerId: '507f1f77bcf86cd799439011' } // valid ObjectId format but doesn't exist
      });
      console.log('\n❌ Invalid buyerId should return 404');
    } catch (err) {
      console.log('\n✅ Invalid buyerId returns:', err.response?.status, err.response?.data?.message);
    }

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

debug();
