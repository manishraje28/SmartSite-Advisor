# Step 9: Node.js ↔ Python AI Service Integration

## Status: ✅ FULLY IMPLEMENTED & TESTED

The Node.js backend and Python Scoring Engine are fully integrated. This document explains:
- How they communicate
- Error handling patterns
- Request/response flow
- How to test the integration

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Web)                             │
│                                                                       │
│  "Create a new property listing"                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ POST /api/properties
                         │ {title, location, specs, amenities, price}
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│               NODE.JS EXPRESS BACKEND (Port 3000)                    │
│                                                                       │
│  propertyController.createProperty()                                 │
│         ↓                                                             │
│  propertyService.createProperty()                                    │
│         ↓                                                             │
│  Property.create() → Save to MongoDB                                │
│         ↓                                                             │
│  scoringPropertyAsync() [ASYNC - NON-BLOCKING]                      │
│         ↓                                                             │
│  scoringService.scoreProperty(property)                             │
│         ↓                                                             │
│  axios.post('http://localhost:5001/score', propertyPayload)         │
│         ↓                                                             │
│  [Returns immediately with 201] ←── Response to client              │
│         ↓                                                             │
│  [Waiting for Python response in background...]                     │
│         ↓                                                             │
│  property.aiScore = response.data.data                              │
│  property.save() → Update MongoDB with scores                        │
│                                                                       │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ HTTP POST to /score
                         │ {propertyId, location, specs, amenities, price, views, saves, inquiries}
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│         PYTHON FLASK SCORING ENGINE (Port 5001)                     │
│                                                                       │
│  @app.route('/score', methods=['POST'])                             │
│         ↓                                                             │
│  validate request JSON                                               │
│         ↓                                                             │
│  calculate_composite_score(property_data)                           │
│         ├── location_scorer.py (0-100)                              │
│         ├── connectivity_scorer.py (0-100)                          │
│         ├── amenities_scorer.py (0-100)                             │
│         ├── roi_scorer.py (0-100)                                   │
│         └── composite (weighted average)                             │
│         ↓                                                             │
│  return {overall, locationScore, connectivityScore,                 │
│          amenitiesScore, roiPotential, breakdown, reasoning}        │
│         ↓                                                             │
│  Response JSON 200 OK                                                │
│                                                                       │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ HTTP 200 with JSON response
                         ▼
                    [Back to Node.js]
                    Node saves to MongoDB
                         │
                         ▼
   Seller can now see property with aiScore
   GET /api/properties/:id returns full scores
```

---

## Communication Flow: Step-by-Step

### Step 1: Seller Creates Property
```bash
POST http://localhost:3000/api/properties
Content-Type: application/json

{
  "seller": "507f1f77bcf86cd799439011",  # Seller's User ID
  "title": "Beautiful 3BHK Apartment",
  "description": "...",
  "location": {
    "type": "Point",
    "coordinates": [72.88, 19.08],      # [longitude, latitude]
    "address": "Powai IT Park",
    "city": "Powai",
    "state": "Maharashtra",
    "pincode": "400076",
    "country": "India"
  },
  "specifications": {
    "bedrooms": 3,
    "bathrooms": 2,
    "carpetArea": 1600,
    "floor": 12,
    "totalFloors": 20,
    "age": 5,
    "facing": "East"
  },
  "amenities": ["Parking", "Gym", "Security", "Swimming Pool"],
  "price": 95000000,
  "pricePerSqFt": 59375,
  "listingType": "Sale",
  "propertyType": "Apartment",
  "status": "available"
}
```

### Step 2: Node.js Creates Property in MongoDB (INSTANT)

**File:** `propertyController.js` (line 15-19)
```javascript
const createProperty = async (req, res, next) => {
  const property = await propertyService.createProperty(req.body);
  return sendSuccess(res, 201, 'Property created successfully', property);
};
```

**Response to client (IMMEDIATE - within 100ms):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "_id": "66536f77bcf86cd799439012",
    "title": "Beautiful 3BHK Apartment",
    "location": { ... },
    "specifications": { ... },
    "amenities": [...],
    "price": 95000000,
    "aiScore": {},              # Empty initially
    "views": 0,
    "saves": 0,
    "inquiries": 0,
    "createdAt": "2026-04-07T23:50:00Z",
    "updatedAt": "2026-04-07T23:50:00Z"
  }
}
```

**Key Point:** Property is saved and returned to client immediately. Scoring happens asynchronously in the background.

### Step 3: Node.js Triggers Async Scoring (IN BACKGROUND)

**File:** `propertyService.js` (line 19-20)
```javascript
// Non-blocking: Score the property in the background
scoringPropertyAsync(property).catch((err) => {
  console.error(`[Property] Non-blocking scoring failed for ${property._id}:`, err.message);
});
```

This function doesn't wait (`no await`), so property creation returns immediately.

### Step 4: Node.js Validates Property Data

**File:** `propertyService.js` (line 27-45)
```javascript
const scoringPropertyAsync = async (property) => {
  try {
    // Validate property before scoring
    const validation = validatePropertyForScoring(property.toObject());
    if (!validation.isValid) {
      console.warn(`[Scoring] Validation failed: ${validation.errors.join(', ')}`);
      return;  // Skip scoring if invalid
    }
    // ... continue to scoring
  }
};
```

**Validation checks** (from `scoringValidator.js`):
- ✅ location.city exists (required)
- ✅ coordinates are valid GeoJSON [lon, lat]
- ✅ price is positive number
- ✅ amenities is an array of strings
- ⚠️ Warnings for missing optional fields (address, age, etc.)

### Step 5: Node.js Calls Python Scoring Engine

**File:** `scoringService.js` (line 15-48)
```javascript
const scoreProperty = async (property) => {
  try {
    const payload = {
      propertyId: property._id.toString(),
      propertyType: property.propertyType,
      location: {
        city: property.location.city,
        address: property.location.address,
        coordinates: property.location.coordinates,
      },
      specifications: property.specifications || {},
      amenities: property.amenities || [],
      price: property.price,
      engagementMetrics: {
        views: property.views || 0,
        saves: property.saves || 0,
        inquiries: property.inquiries || 0,
      },
    };

    // Call Python scoring engine
    const response = await axios.post(
      'http://localhost:5001/score',  # Python Flask server
      payload,
      { timeout: 5000 }                # 5 second timeout
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;  # Return aiScore object
    }
    return null;
  } catch (error) {
    console.error(`[Scoring] Failed: ${error.message}`);
    return null;  # Graceful degradation
  }
};
```

**Request to Python (1-5 seconds after property creation):**
```json
POST http://localhost:5001/score

{
  "propertyId": "66536f77bcf86cd799439012",
  "propertyType": "Apartment",
  "location": {
    "city": "Powai",
    "address": "Powai IT Park",
    "coordinates": [72.88, 19.08]
  },
  "specifications": {
    "bedrooms": 3,
    "bathrooms": 2,
    "carpetArea": 1600,
    "floor": 12,
    "totalFloors": 20,
    "age": 5,
    "facing": "East"
  },
  "amenities": ["Parking", "Gym", "Security", "Swimming Pool"],
  "price": 95000000,
  "engagementMetrics": {
    "views": 0,
    "saves": 0,
    "inquiries": 0
  }
}
```

### Step 6: Python Calculates Scores

**File:** `engines/composite_scorer.py` (line 40-85)

```python
def calculate_composite_score(property_data):
    # Call all 5 scoring engines
    location_result = calculate_location_score(property_data)      # 0-100
    connectivity_result = calculate_connectivity_score(property_data) # 0-100
    amenities_result = calculate_amenities_score(property_data)    # 0-100
    roi_result = calculate_roi_score(property_data)               # 0-100

    # Get individual scores
    location_score = location_result["score"]        # e.g., 91
    connectivity_score = connectivity_result["score"]  # e.g., 90
    amenities_score = amenities_result["score"]      # e.g., 75
    roi_score = roi_result["score"]                  # e.g., 87

    # Calculate weighted overall score
    overall_score = (
        location_score * 0.35 +        # 35% weight
        connectivity_score * 0.30 +    # 30% weight
        amenities_score * 0.20 +       # 20% weight
        roi_score * 0.15               # 15% weight
    )

    # Result: (91*0.35) + (90*0.30) + (75*0.20) + (87*0.15) = 84.85 → 85
```

**Scoring breakdown:**
- **Location (91/100):** Powai is popular + good infrastructure
- **Connectivity (90/100):** 0.8km to metro, 2km to highway
- **Amenities (75/100):** Has Parking, Gym, Security, Pool (but no Garden)
- **ROI (87/100):** Good rental yield + 12% growth area
- **Overall (85/100):** Weighted average of all components

### Step 7: Python Returns Scores to Node.js

**Response from Python (200 OK):**
```json
{
  "success": true,
  "data": {
    "overall": 85,
    "locationScore": 91,
    "connectivityScore": 90,
    "amenitiesScore": 75,
    "roiPotential": 87,
    "breakdown": {
      "location": {
        "areaPopularity": 26,
        "infrastructureQuality": 22,
        "safetyRating": 19,
        "futureGrowthPotential": 15,
        "nearbyAmenities": 9,
        "reasoning": "Powai is popular with good infrastructure..."
      },
      "connectivity": {
        "publicTransport": 35,
        "carAccess": 25,
        "businessHubProximity": 20,
        "airportAccess": 10,
        "reasoning": "Metro/bus access is good (0.8km away)..."
      },
      "amenities": {
        "requiredAmenities": 35,
        "luxuryAmenities": 23,
        "outdoorSpaces": 12,
        "modernization": 8,
        "breakdown": {
          "required": ["Parking", "Gym", "Security"],
          "luxury": ["Swimming Pool"],
          "outdoor": []
        },
        "reasoning": "Has all critical amenities (parking, security)..."
      },
      "roiPotential": {
        "rentalYield": 32,
        "appreciationPotential": 32,
        "marketLiquidity": 18,
        "demandTrend": 5,
        "estimates": {
          "rentalYieldPercent": 1.27,
          "appreciationPercentYoY": 12.0,
          "marketLiquidityDays": 35,
          "estimatedAnnualRent": 1140000
        },
        "reasoning": "Excellent rental yield + strong area growth..."
      }
    },
    "timestamp": "2026-04-07T23:50:03Z"
  }
}
```

### Step 8: Node.js Stores Scores in MongoDB

**File:** `propertyService.js` (line 47-51)
```javascript
if (aiScore) {
  property.aiScore = aiScore;
  property.aiScore.lastScoredAt = new Date();
  await property.save();  # Update in MongoDB
}
```

**MongoDB update:**
```javascript
// Before
{
  _id: "66536f77bcf86cd799439012",
  title: "Beautiful 3BHK Apartment",
  aiScore: {}
}

// After (3-5 seconds later)
{
  _id: "66536f77bcf86cd799439012",
  title: "Beautiful 3BHK Apartment",
  aiScore: {
    overall: 85,
    locationScore: 91,
    connectivityScore: 90,
    amenitiesScore: 75,
    roiPotential: 87,
    lastScoredAt: "2026-04-07T23:50:03Z"
  }
}
```

### Step 9: Seller/Buyer Fetches Property with Scores

**After 1-5 seconds:**
```bash
GET http://localhost:3000/api/properties/66536f77bcf86cd799439012

Response:
{
  "success": true,
  "message": "Property fetched successfully",
  "data": {
    "_id": "66536f77bcf86cd799439012",
    "title": "Beautiful 3BHK Apartment",
    "location": { ... },
    "specifications": { ... },
    "amenities": [...],
    "price": 95000000,
    "aiScore": {
      "overall": 85,
      "locationScore": 91,
      "connectivityScore": 90,
      "amenitiesScore": 75,
      "roiPotential": 87,
      "lastScoredAt": "2026-04-07T23:50:03Z"
    },
    "views": 0,
    "saves": 0,
    "inquiries": 0
  }
}
```

Seller now sees: **"Your property scored 85/100 - Excellent!"**

---

## Error Handling Patterns

### Pattern 1: Python Service Down (Graceful Degradation)

```
Property creation request
    ↓
Node creates property in MongoDB (SUCCESS ✅)
    ↓
Request sent to Python /score endpoint
    ↓
Connection failed (Python not running)
    ↓
scoringService catches error, returns null
    ↓
propertyService logs warning, continues
    ↓
Property returned to seller WITHOUT aiScore
    ↓
Seller can still use property listing
    ↓
Property can be re-scored later when Python is running
```

**Code:** `scoringService.js` (line 38-42)
```javascript
catch (error) {
  console.error(`[Scoring] Failed to score property ${property._id}:`, error.message);
  return null;  // Returns null, doesn't throw
}
```

**Result:**
- ✅ Property is created and usable
- ⚠️ aiScore is empty (null)
- 📝 Error logged for debugging
- 🔄 Can be re-scored manually later

### Pattern 2: Invalid Property Data (Skip Scoring)

```
Property creation
    ↓
Invalid data detected:
  - Missing location.city
  - Invalid coordinates
  - Price = 0
  - Amenities not array
    ↓
Validation fails in propertyService
    ↓
Scoring is skipped (doesn't waste Python API call)
    ↓
Property created without scores
    ↓
Console warning logged
    ↓
No error thrown (property still usable)
```

**Code:** `propertyService.js` (line 29-33)
```javascript
const validation = validatePropertyForScoring(property.toObject());
if (!validation.isValid) {
  console.warn(`[Scoring] Validation failed: ${validation.errors.join(', ')}`);
  return;  // Skip scoring, don't throw
}
```

### Pattern 3: Timeout (5-Second Timeout)

```
Request sent to Python /score
    ↓
[Waiting...]
[Waiting...]
[Waiting...]
5 seconds pass - TIMEOUT
    ↓
axios throws error
    ↓
scoringService catches, logs error, returns null
    ↓
Property already saved in MongoDB (no rollback needed)
    ↓
Next time someone views property, they might trigger re-scoring
```

**Code:** `scoringService.js` (line 43)
```javascript
const response = await axios.post(`${SCORING_ENGINE_URL}/score`, payload, {
  timeout: 5000,  // 5 second timeout
});
```

**Why 5 seconds?**
- Typical scoring takes 50-200ms
- 5 seconds gives plenty of buffer
- Prevents hanging forever if Python crashes

### Pattern 4: Invalid Python Response (Malformed JSON)

```
Python responds with non-JSON or missing success field
    ↓
response.data.success !== true
    ↓
scoringService detects invalid format
    ↓
console.warn("Invalid response format")
    ↓
Returns null
    ↓
Property continues without scores
```

**Code:** `scoringService.js` (line 47-49)
```javascript
if (response.data && response.data.success && response.data.data) {
  return response.data.data;
} else {
  console.warn(`Invalid response format from Python service`);
  return null;
}
```

---

## Key Design Decisions

### 1. Non-Blocking (Fire-and-Forget)

**Why?**
- Property creation is fast (< 100ms)
- User gets instant confirmation
- Scoring happens in parallel

**Code Pattern:**
```javascript
// This does NOT wait for scoring
scoringPropertyAsync(property).catch((err) => { ... });

// Property returned to user immediately
return sendSuccess(res, 201, 'Property created', property);
```

### 2. Graceful Degradation

**If Python scores fail:**
- ✅ Property is still created
- ✅ Property is searchable
- ✅ Buyer/seller can still use it
- ⚠️ No aiScore (can be added later)

**Alternative would be risky:** If scoring fails → whole property creation fails
- ❌ Poor user experience
- ❌ Partial data loss
- ❌ Dependency on Python availability

### 3. Async/Await Pattern

**Why async await for scoring?**
```javascript
// Good: Function can be awaited if needed later
const scoringPropertyAsync = async (property) => {
  const aiScore = await scoringService.scoreProperty(property);
};

// But we call it without await
scoringPropertyAsync(property).catch(...);  // Fire-and-forget
```

This gives us flexibility:
- Normal flow: Fire-and-forget (non-blocking)
- Batch operations: Can await if needed
- Admin tools: Can retrieve and score manually

### 4. Separate Validation Layer

**Why validate before calling Python?**
```javascript
// Don't waste Python API call on obviously invalid data
const validation = validatePropertyForScoring(property);
if (!validation.isValid) {
  return;  // Skip Python call
}
```

**Savings:**
- Avoid unnecessary network calls
- Fail fast (no 5-second timeout waste)
- Reduce Python load
- Clear error messages

---

## Testing the Integration

### Test 1: Health Check (Python Running?)

```bash
curl http://localhost:5001/health

# Expected response:
{"status": "ok", "service": "scoring-engine"}
```

**Verifies:**
- Python server is running
- Network connectivity is OK
- Port 5001 is accessible

### Test 2: Direct Score Call

```bash
curl -X POST http://localhost:5001/score \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"city": "Powai"},
    "specifications": {"age": 5},
    "amenities": ["Parking"],
    "price": 95000000
  }'

# Expected: JSON with overall, locationScore, connectivityScore, etc.
```

**Verifies:**
- Python scoring logic works
- Response format correct
- No Python errors

### Test 3: Create Property (Node.js → Python)

```bash
# 1. Get a seller ID (or create test user)
USER_ID="507f1f77bcf86cd799439011"

# 2. Create property
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "'$USER_ID'",
    "title": "Test Property",
    "location": {
      "type": "Point",
      "coordinates": [72.88, 19.08],
      "address": "Powai",
      "city": "Powai"
    },
    "specifications": {"age": 5},
    "amenities": ["Parking"],
    "price": 95000000,
    "propertyType": "Apartment",
    "listingType": "Sale"
  }'

# Response: 201 Created with property (aiScore: empty initially)
```

**Verifies:**
- Property creation works
- Node.js accepts request
- Response is immediate

### Test 4: Wait for Scoring

```bash
# Wait 3-5 seconds, then fetch property
sleep 5

PROPERTY_ID="<property_id_from_step_3>"

curl http://localhost:3000/api/properties/$PROPERTY_ID

# Expected: aiScore should now be populated!
{
  "aiScore": {
    "overall": 85,
    "locationScore": 91,
    ...
  }
}
```

**Verifies:**
- Python scored the property
- Scores stored in MongoDB
- Node.js retrieved updated property

### Test 5: Full Integration Test

```bash
cd /c/Users/Lenovo/Projects/SmartSite\ Advisor/backend
node verify_step8_integration.js
```

**Test coverage:**
- ✅ Create user
- ✅ Create property
- ✅ Wait for async scoring
- ✅ Verify aiScore populated
- ✅ All 5 components present
- ✅ Score ranges correct
- ✅ Comparative scoring (with/without parking)
- ✅ 13 tests total

---

## Debugging

### If Python scores aren't appearing:

**Check 1: Python running?**
```bash
curl http://localhost:5001/health
# If fails: Python not running, start it
```

**Check 2: Check logs**
```bash
# Node.js logs
# Look for [Scoring] messages in console
# If you see "Failed to score property", Python had an error

# Python logs
# Check Flask debug output for errors
```

**Check 3: Check database**
```bash
# Manually check property in MongoDB
db.properties.findOne({_id: ObjectId("xxx")})
# Check aiScore field - should be populated or empty object
```

**Check 4: Manually test Python**
```bash
curl -X POST http://localhost:5001/score \
  -H "Content-Type: application/json" \
  -d '{"location": {"city": "Powai"}, "price": 95000000}'
# If fails, Python has issues
```

### If properties create but scores don't appear after 30 seconds:

**Likely causes:**
1. Python service crashed
2. Port mismatch (expecting 5001, serving on 5000)
3. Network firewall blocking localhost:5001
4. Property data is invalid (validation fails silently)

**Solution:**
- Restart Python: `cd scoring-engine && python app.py`
- Check port: `netstat -ano | grep 5001`
- View logs in Python terminal for errors

---

## Summary

| Aspect | Details |
|--------|---------|
| **Communication** | Node.js (port 3000) ↔ Python (port 5001) via HTTP |
| **Protocol** | REST API with JSON request/response |
| **Timing** | Property returns in <100ms; Scoring happens in background (1-5s) |
| **Error Handling** | Non-blocking, graceful degradation, validates before scoring |
| **Failure Impact** | Python down = property created without scores (not a blocker) |
| **Data Storage** | Scores stored in MongoDB property.aiScore field |
| **Testing** | Auto-tested in verify_step8_integration.js (13 tests) |

**Step 9 Complete: Node.js ↔ Python integration fully documented and tested!** ✅
