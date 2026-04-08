const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/users';

async function verifyUserAuth() {
  const timestamp = Date.now();
  const buyerEmail = `buyer_${timestamp}@test.com`;
  const sellerEmail = `seller_${timestamp}@test.com`;
  const password = 'Password@123';

  try {
    console.log('--- Testing User Module (Register/Login) ---');

    // 1. Register a Buyer
    console.log('\n1. Registering a Buyer...');
    const regBuyerRes = await axios.post(`${BASE_URL}/register`, {
      name: 'Test Buyer',
      email: buyerEmail,
      password: password,
      role: 'buyer'
    });
    console.log('✅ Buyer Registered:', regBuyerRes.data.data.email);

    // 2. Register a Seller
    console.log('\n2. Registering a Seller...');
    const regSellerRes = await axios.post(`${BASE_URL}/register`, {
      name: 'Test Seller',
      email: sellerEmail,
      password: password,
      role: 'seller'
    });
    console.log('✅ Seller Registered:', regSellerRes.data.data.email);

    // 3. Login with Buyer
    console.log('\n3. Logging in as Buyer...');
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      email: buyerEmail,
      password: password
    });
    console.log('✅ Login Successful. Name:', loginRes.data.data.name);

    // 4. Test Duplicate Email
    console.log('\n4. Testing Duplicate Email error...');
    try {
      await axios.post(`${BASE_URL}/register`, {
        name: 'Clone User',
        email: buyerEmail,
        password: password,
        role: 'buyer'
      });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log('✅ Correctly handled duplicate email error (409 Conflict)');
      } else {
        throw err;
      }
    }

    // 5. Test Invalid Credentials
    console.log('\n5. Testing Invalid Credentials error...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: buyerEmail,
        password: 'wrongpassword'
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ Correctly handled invalid credentials error (401 Unauthorized)');
      } else {
        throw err;
      }
    }

    console.log('\n🚀 ALL USER AUTH TESTS PASSED!');
  } catch (error) {
    if (error.response) {
      console.error('\n❌ TEST FAILED (Status:', error.response.status, '):');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('\n❌ TEST FAILED:', error.message);
    }
    process.exit(1);
  }
}

verifyUserAuth();
