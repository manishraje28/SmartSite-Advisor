const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/properties';
const MOCK_SELLER_ID = '69d3c77e998a3d935e40c76f';

async function verifyCRUD() {
  try {
    console.log('--- Testing Property CRUD ---');

    // 1. Create Property
    console.log('\n1. Creating Property...');
    const createRes = await axios.post(BASE_URL, {
      seller: MOCK_SELLER_ID,
      title: 'Luxury 3BHK Apartment',
      description: 'Spacious apartment with sea view and modern amenities.',
      propertyType: 'Apartment',
      listingType: 'Sale',
      price: 15000000,
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // Mumbai
        address: 'Worli Sea Face',
        city: 'Mumbai',
        pincode: '400018'
      },
      amenities: ['Gym', 'Swimming Pool', 'Parking']
    });
    const propertyId = createRes.data.data._id;
    console.log('✅ Created Property ID:', propertyId);

    // 2. Get All Properties
    console.log('\n2. Fetching All Properties...');
    const getAllRes = await axios.get(BASE_URL);
    console.log('✅ Total Properties Found:', getAllRes.data.data.total);

    // 3. Get Property by ID
    console.log('\n3. Fetching Property by ID...');
    const getByIdRes = await axios.get(`${BASE_URL}/${propertyId}`);
    console.log('✅ Property Title:', getByIdRes.data.data.title);

    // 4. Update Property (Change price)
    console.log('\n4. Updating Property Price...');
    const updateRes = await axios.patch(`${BASE_URL}/${propertyId}`, {
      price: 14500000
    });
    console.log('✅ Updated Price:', updateRes.data.data.formattedPrice);

    // 5. Delete Property
    console.log('\n5. Deleting Property...');
    const deleteRes = await axios.delete(`${BASE_URL}/${propertyId}`);
    console.log('✅ Delete Message:', deleteRes.data.message);

    // 6. Verify Deletion
    console.log('\n6. Verifying Deletion...');
    try {
      await axios.get(`${BASE_URL}/${propertyId}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✅ Verified: Property no longer exists.');
      } else {
        throw err;
      }
    }

    console.log('\n🚀 ALL CRUD TESTS PASSED!');
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

verifyCRUD();
