# Step 9: Practical Testing Guide

## Quick Start (5 Minutes)

### Terminal 1: Start Python Scoring Engine
```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/scoring-engine
/c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe app.py
```

**Expected output:**
```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5001
```

### Terminal 2: Start Node.js Backend
```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/backend
npm start
```

**Expected output:**
```
Server running on http://localhost:3000
Connected to MongoDB
```

### Terminal 3: Run Full Integration Test
```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/backend
node verify_step8_integration.js
```

**Expected result:**
```
📊 RESULTS: 13 passed, 0 failed
✅ ALL TESTS PASSED! Step 8 integration is complete.
```

---

## Manual Testing (Step-by-Step)

### Step 1: Verify Python Service Health

```bash
curl http://localhost:5001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "scoring-engine"
}
```

**If failed:**
- Check Python is running (should see "Running on" message)
- Check port is 5001 (not 5000)
- Try: `netstat -ano | grep 5001`

---

### Step 2: Test Python Scoring Directly

Make a direct API call to Python (bypassing Node.js):

```bash
curl -X POST http://localhost:5001/score \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "city": "Powai",
      "address": "Powai IT Park"
    },
    "specifications": {
      "bedrooms": 3,
      "age": 5,
      "facing": "East"
    },
    "amenities": ["Parking", "Gym", "Security", "Swimming Pool"],
    "price": 95000000,
    "engagementMetrics": {
      "views": 45,
      "saves": 8,
      "inquiries": 2
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "overall": 84,
    "locationScore": 91,
    "connectivityScore": 90,
    "amenitiesScore": 75,
    "roiPotential": 87,
    "breakdown": {
      "location": { ... },
      "connectivity": { ... },
      "amenities": { ... },
      "roiPotential": { ... }
    },
    "timestamp": "2026-04-07T23:50:03Z"
  }
}
```

**If failed:**
- Check Python console for errors
- Check all required fields are present
- Ensure amenities is an array

---

### Step 3: Verify Node.js Backend Health

```bash
curl http://localhost:3000/api/properties
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Properties fetched successfully",
  "data": {
    "properties": [],
    "total": 0,
    "limit": 10,
    "skip": 0
  }
}
```

**If failed:**
- Check Node.js is running
- Check MongoDB is connected (should see "Connected to MongoDB")
- Try: `npm start` again

---

### Step 4: Create Test User (Seller)

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Seller",
    "email": "seller@test.com",
    "password": "Test@123",
    "role": "seller"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test Seller",
    "email": "seller@test.com",
    "role": "seller"
  }
}
```

**Save the `_id` for next step:** `507f1f77bcf86cd799439011`

---

### Step 5: Create Property (Triggers Async Scoring)

```bash
USER_ID="507f1f77bcf86cd799439011"  # Use ID from Step 4

curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "'$USER_ID'",
    "title": "Beautiful 3BHK Powai Apartment",
    "description": "Well-maintained apartment with all modern amenities",
    "propertyType": "Apartment",
    "listingType": "Sale",
    "price": 95000000,
    "pricePerSqFt": 59375,
    "isPriceNegotiable": true,
    "location": {
      "type": "Point",
      "coordinates": [72.88, 19.08],
      "address": "Powai IT Park Area",
      "city": "Powai",
      "state": "Maharashtra",
      "pincode": "400076",
      "country": "India"
    },
    "specifications": {
      "bedrooms": 3,
      "bathrooms": 2,
      "balconies": 1,
      "carpetArea": 1600,
      "builtUpArea": 2000,
      "floor": 12,
      "totalFloors": 20,
      "parkingSpots": 2,
      "facing": "East",
      "furnishingStatus": "Semi-Furnished",
      "age": 5
    },
    "amenities": ["Parking", "Gym", "Security", "Swimming Pool", "Garden", "Power Backup"],
    "images": [],
    "status": "available"
  }'
```

**Expected Response (IMMEDIATE):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "_id": "66536f77bcf86cd799439012",
    "seller": "507f1f77bcf86cd799439011",
    "title": "Beautiful 3BHK Powai Apartment",
    "location": { ... },
    "specifications": { ... },
    "amenities": [...],
    "price": 95000000,
    "aiScore": {},              # Empty initially!
    "views": 0,
    "saves": 0,
    "inquiries": 0,
    "createdAt": "2026-04-07T23:55:00Z"
  }
}
```

**Key observation:** Response comes back instantly. aiScore is empty `{}`.

**Save property ID:** `66536f77bcf86cd799439012`

---

### Step 6: Wait for Async Scoring

```bash
# Wait 3-5 seconds for Python to score
sleep 5

PROPERTY_ID="66536f77bcf86cd799439012"

curl http://localhost:3000/api/properties/$PROPERTY_ID
```

**Expected Response (AFTER 5 seconds):**
```json
{
  "success": true,
  "message": "Property fetched successfully",
  "data": {
    "_id": "66536f77bcf86cd799439012",
    "title": "Beautiful 3BHK Powai Apartment",
    "location": { ... },
    "specifications": { ... },
    "price": 95000000,
    "aiScore": {
      "overall": 84,
      "locationScore": 91,
      "connectivityScore": 90,
      "amenitiesScore": 75,
      "roiPotential": 87,
      "lastScoredAt": "2026-04-07T23:55:03Z"
    },
    "views": 0,
    "saves": 0,
    "inquiries": 0
  }
}
```

**Key observation:** After 5 seconds, aiScore is populated! ✅

---

### Step 7: Verify All Components Present

From the response above, verify:
- ✅ `aiScore.overall` = 84 (0-100)
- ✅ `aiScore.locationScore` = 91 (0-100)
- ✅ `aiScore.connectivityScore` = 90 (0-100)
- ✅ `aiScore.amenitiesScore` = 75 (0-100)
- ✅ `aiScore.roiPotential` = 87 (0-100)
- ✅ `aiScore.lastScoredAt` = ISO timestamp

All present = Python integration working! ✅

---

### Step 8: Test Property Without Parking (Comparative)

```bash
USER_ID="507f1f77bcf86cd799439011"

curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "'$USER_ID'",
    "title": "3BHK Without Parking",
    "propertyType": "Apartment",
    "listingType": "Sale",
    "price": 85000000,
    "location": {
      "type": "Point",
      "coordinates": [72.88, 19.08],
      "address": "Powai",
      "city": "Powai",
      "state": "Maharashtra",
      "pincode": "400076"
    },
    "specifications": {
      "bedrooms": 3,
      "bathrooms": 2,
      "carpetArea": 1550,
      "floor": 10,
      "totalFloors": 15,
      "age": 10
    },
    "amenities": ["Gym", "Security"],
    "status": "available"
  }'
```

**Save property ID, wait 5 seconds, fetch:**
```bash
sleep 5
curl http://localhost:3000/api/properties/<new_property_id>
```

**Expected:** aiScore.overall should be LOWER than property with parking (84 > 70 approx)

---

## Automated Integration Test

Run the full automated test:

```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/backend
node verify_step8_integration.js
```

**What it tests:**
1. Python service running
2. Node.js backend running
3. Create test user
4. Create property with scoring
5. Wait for scoring (up to 30 seconds)
6. Verify aiScore populated
7. Verify all components
8. Verify score ranges
9. Create second property
10. Compare scores (with parking > without)
11. 13 tests total

**Success criteria:**
```
✅ TEST 1: Python Scoring Engine is running
✅ TEST 2: Node.js backend is running
✅ TEST 3: Create test user
✅ TEST 4: Create property
✅ TEST 5: Wait for async scoring
✅ TEST 6: aiScore is present
✅ TEST 7: Overall score 0-100
✅ TEST 8: Component scores present
✅ TEST 9: lastScoredAt timestamp
✅ TEST 10: Score in range (75-95)
✅ TEST 11: Create second property
✅ TEST 12: Second property scored
✅ TEST 13: Comparative scoring works

📊 Results: 13 passed, 0 failed
✅ ALL TESTS PASSED!
```

---

## Troubleshooting

### Issue: "Scoring Engine is not reachable"

```
Error: Cannot reach http://localhost:5001
```

**Solution:**
1. Check Python is running: `curl http://localhost:5001/health`
2. If fails, start Python:
   ```bash
   cd scoring-engine
   /c/Users/Lenovo/AppData/Local/Programs/Python/Python312/python.exe app.py
   ```
3. Check port isn't already in use: `netstat -ano | grep 5001`

---

### Issue: "Property created but scores don't appear"

```
Property ID: 66536f77bcf86cd799439012
Waited 5 seconds, aiScore still empty
```

**Debug steps:**
1. Check Python console for errors (should see `POST /score 200`)
2. Check Python scoring works:
   ```bash
   curl -X POST http://localhost:5001/score \
     -H "Content-Type: application/json" \
     -d '{"location": {"city": "Powai"}, "price": 95000000}'
   ```
3. Check Node.js logs for `[Scoring]` messages
4. Verify property data is valid (location.city required)

---

### Issue: Port 5001 already in use

```
Error: Address already in use :::5001
```

**Solution:**
1. Find process using port:
   ```bash
   netstat -ano | grep 5001
   # Example: TCP 0.0.0.0:5001 0.0.0.0:0 LISTENING 12345
   ```
2. Kill process (Windows): `taskkill /PID 12345 /F`
3. Try again

Or use different port - edit `scoring-engine/app.py` line 112:
```python
app.run(debug=True, host='0.0.0.0', port=5002)  # Changed to 5002
```

---

## Summary: Integration Complete ✅

| Component | Status | Location |
|-----------|--------|----------|
| Python Scoring Engine | ✅ Implemented | `/scoring-engine` |
| Flask REST API | ✅ Implemented | `/scoring-engine/app.py` |
| Node.js Integration | ✅ Implemented | `/backend/src/services/scoringService.js` |
| Validation Layer | ✅ Implemented | `/backend/src/utils/scoringValidator.js` |
| Property Service Hook | ✅ Implemented | `/backend/src/services/propertyService.js` |
| Integration Tests | ✅ Implemented | `/backend/verify_step8_integration.js` |
| Documentation | ✅ Implemented | `STEP_9_INTEGRATION.md` |

**Next Step: Step 10 - Recommendation Engine**
- Use aiScores + buyer preferences to match properties
- Implement `/api/buyer/recommendations` endpoint
- Create weighted matching algorithm
