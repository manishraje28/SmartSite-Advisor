const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function test18() {
  try {
    await axios.get(`${BASE_URL}/buyer/preferences`, {
      params: { buyerId: 'invalid-id' }
    });
    console.log('❌ Should have thrown an error');
  } catch (err) {
    console.log('Status:', err.response?.status);
    console.log('Message:', err.response?.data?.message);
  }
}

test18();
