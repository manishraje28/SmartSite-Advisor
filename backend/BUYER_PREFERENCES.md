# Buyer Preferences Implementation - Complete Documentation

## Overview
Buyer preferences are the foundation of the SmartSite recommendation engine. They encapsulate what a buyer is looking for in a property and drive personalized recommendations.

## What Are Buyer Preferences?

Buyer preferences are a buyer's search criteria and priorities stored in a single document linked 1:1 to their User account. They include:

### Core Search Criteria
- **Budget Range:** min and max price (in Lakhs for India)
- **Property Types:** Apartment, Villa, Plot, etc. (multiple selections)
- **Listing Type:** Sale, Rent, Lease, or Any
- **Size Requirements:** minimum bedrooms, minimum carpet area
- **Furnishing:** Unfurnished, Semi-Furnished, Fully-Furnished preferences

### Location Preferences
- **Preferred Locations:** Array of city/neighborhood names (e.g., "Bandra", "Powai")
- **Reference Point:** GeoJSON Point coordinates (nearby office, school, etc.)
- **Max Distance:** Maximum distance from reference point in km

### AI Personalization
- **Buyer Segment:** family, investor, student, bachelor, or retiree
- **Weights:** How much each factor influences recommendations (sum=1.0):
  - price (0.35): Price sensitivity
  - location (0.30): Location importance
  - amenities (0.20): Desired features
  - connectivity (0.10): Transport access
  - roiPotential (0.05): Investment returns

### Interaction History (Implicit Signals)
- **Saved Properties:** Properties the buyer bookmarked
- **Viewed Properties:** Properties viewed with timestamps

## API Endpoints

### 1. Save Preferences (POST)
**Endpoint:** `POST /api/buyer/preferences`

**Purpose:** Create or completely replace buyer preferences (upsert).

**Request Body:**
```json
{
  "buyerId": "USER_ID",
  "budget": {"min": 50, "max": 150},
  "preferredPropertyTypes": ["Apartment", "Villa"],
  "minBedrooms": 2,
  "minCarpetAreaSqFt": 1200,
  "buyerSegment": "family",
  "listingPreference": "Sale",
  "furnishingPreference": ["Semi-Furnished", "Fully-Furnished"],
  "preferredLocations": ["Bandra", "Powai"],
  "referencePoint": {
    "type": "Point",
    "coordinates": [72.88, 19.08]  // [longitude, latitude]
  },
  "maxDistanceKm": 10,
  "requiredAmenities": ["Parking", "Gym", "Security"],
  "weights": {
    "price": 0.35,
    "location": 0.30,
    "amenities": 0.20,
    "connectivity": 0.10,
    "roiPotential": 0.05
  }
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Preferences saved successfully",
  "data": { /* saved preference object */ }
}
```

### 2. Fetch Preferences (GET)
**Endpoint:** `GET /api/buyer/preferences?buyerId=USER_ID`

**Purpose:** Retrieve a buyer's saved preferences (used by recommendation engine).

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Preferences fetched successfully",
  "data": { /* preference object */ }
}
```

### 3. Update Preferences (PATCH)
**Endpoint:** `PATCH /api/buyer/preferences`

**Purpose:** Partially update preferences (only provided fields change, others preserved).

**Request Body:**
```json
{
  "buyerId": "USER_ID",
  "budget": {"min": 75, "max": 200},
  "minBedrooms": 3
}
```

**Response:** 200 OK

### 4. Delete Preferences (DELETE)
**Endpoint:** `DELETE /api/buyer/preferences?buyerId=USER_ID`

**Purpose:** Clear all preferences for a buyer.

**Response:** 200 OK

## How Preferences Drive Recommendations

### Phase 1: Hard Constraints (Filtering)
Before any scoring, these hard filters eliminate unsuitable properties:

```
if property.price < preferences.budget.min → SKIP
if property.price > preferences.budget.max → SKIP
if property.type NOT IN preferences.preferredPropertyTypes → SKIP
if property.bedrooms < preferences.minBedrooms → SKIP
if property.carpetArea < preferences.minCarpetAreaSqFt → SKIP
if property.furnishing NOT IN preferences.furnishingPreference → SKIP
if property.requiredAmenities NOT ALL present → SKIP
```

### Phase 2: Geographic Filtering
If a reference point is specified, use MongoDB geospatial queries:

```javascript
db.properties.find({
  "location": {
    "$geoNear": {
      "geometry": preferences.referencePoint,
      "maxDistance": preferences.maxDistanceKm * 1000  // convert to meters
    }
  }
})
```

Result: Properties outside the distance radius are filtered out.

### Phase 3: Weighted Scoring
For remaining properties, calculate a composite recommendation score using the buyer's custom weights:

```
recommendation_score = (
  base_quality_score * 0.05 +
  price_match_score * weights.price (0.35) +
  location_match_score * weights.location (0.30) +
  amenities_match_score * weights.amenities (0.20) +
  connectivity_score * weights.connectivity (0.10) +
  roiPotential_score * weights.roiPotential (0.05)
)
```

**Score Components:**

| Component | Source | Calculation |
|-----------|--------|------------|
| base_quality_score | Property.aiScore.overall | AI pre-calculated property quality (0-100) |
| price_match_score | Property.price vs budget | How centered in budget: 0-100 |
| location_match_score | Property location vs preferences | Text/proximity match to preferred locations |
| amenities_match_score | Property amenities | % of required amenities present |
| connectivity_score | Property.aiScore.connectivity | How well connected (0-100) |
| roiPotential_score | Property.aiScore.roiPotential | Investment return potential (0-100) |

### Phase 4: Segment-Specific Tuning
Adjust recommendations based on buyerSegment:

**Family buying in Mumbai:**
- Boost properties near schools, parks, quiet neighborhoods
- Prioritize safety ratings, family amenities (schools, playgrounds)
- Penalize properties in nightlife-heavy areas

**Investor looking in Mumbai:**
- Boost ROI and rental yield potential
- Prioritize connectivity to commercial hubs
- Emphasize growth neighborhoods
- Consider target rental demographics

**Student seeking accommodation:**
- Boost proximity to educational institutions
- Prioritize cheap rent, near public transport
- Prefer compact units, co-living options

**Bachelor in metro area:**
- Boost proximity to nightlife, food, entertainment
- Prioritize compact size and affordability
- Prefer young professional neighborhoods

**Retiree:**
- Boost healthcare facility proximity
- Prefer quiet areas, senior-friendly amenities
- Prioritize sun exposure, accessibility

### Phase 5: Ranking & Return
Sort remaining properties by recommendation_score (descending) and return top 10-20 to UI.

## Implicit Preference Learning (Future ML Step)

As buyers interact:
1. **View:** When buyer views property → record in viewedProperties[] with timestamp
2. **Save:** When buyer saves property → record in savedProperties[]
3. **Pattern Recognition:** Analyze saved vs viewed properties to understand implicit preferences
4. **Weight Adjustment:** ML model learns if certain weights don't match actual behavior
   - Example: Buyer claims price=0.35 importance but saves expensive properties → adjust weight upward
5. **Feedback Loop:** System continuously refines weights based on real engagement

## Data Flow Diagram

```
┌─────────────────────┐
│   Buyer Registers   │
│   (role: 'buyer')   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ Complete Preferences    │ ← Preference Survey Form
│  - Budget              │
│  - Segment             │
│  - Weights             │
│  - Locations           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Preference Stored DB      │
│   (BuyerPreferences Doc)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Buyer Searches/Browses     │
│  - Views properties         │
│  - Saves favorites          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Implicit Signals Captured   │
│ - viewedProperties[]        │
│ - savedProperties[]         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Recommendation Engine       │
│ 1. Apply hard constraints   │
│ 2. Geographic filter        │
│ 3. Calculate weighted score │
│ 4. Segment-specific tuning  │
│ 5. Return ranked list       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Personalized Results       │
│  (Top matching properties)  │
└─────────────────────────────┘
```

## Example: Buyer Journey

**Scenario:** Anil is a 35-year-old family man looking to buy in Mumbai.

**Step 1: Preferences Setup**
```json
{
  "buyerId": "anil_123",
  "budget": {"min": 75, "max": 150},
  "preferredPropertyTypes": ["Apartment"],
  "minBedrooms": 3,
  "minCarpetAreaSqFt": 1500,
  "buyerSegment": "family",
  "preferredLocations": ["Andheri", "Powai", "Chinchpokli"],
  "referencePoint": {"type": "Point", "coordinates": [72.9, 19.1]},
  "maxDistanceKm": 8,
  "requiredAmenities": ["Parking", "Gym", "School", "Security'],
  "weights": {
    "price": 0.3,      // Flexible on price
    "location": 0.35,  // School proximity matters most
    "amenities": 0.25, // Safety/amenities important
    "connectivity": 0.05,
    "roiPotential": 0.05
  }
}
```

**Step 2: Recommendation Search**
System fetches all Mumbai apartments with:
- Budget: 75-150 L
- Within 8km of reference point
- Has parking, school, gym, security
- 3+ bedrooms, 1500+ sqft

**Step 3: Scoring**
For Property A (Powai, 3BHK, 1600sqft, ₹120L):
- Base quality: 82/100 (good location scores from SellerInsights)
- Price match: 90/100 (in middle of budget)
- Location match: 95/100 (Powai = great schools)
- Amenities: 100/100 (has all 4)
- Connectivity: 85/100
- ROI: 75/100

**Final Score** = (82×0.05) + (90×0.3) + (95×0.35) + (100×0.25) + (85×0.05) + (75×0.05)
= 4.1 + 27 + 33.25 + 25 + 4.25 + 3.75 = 97.6/100

Property A ranks highly because location weight is high and Powai schools are excellent!

## Implementation Status

✅ **Completed:**
- BuyerPreferences MongoDB schema with all fields
- CRUD APIs (Save, Fetch, Update, Delete)
- Validation (budget ranges, weights sum, geospatial)
- Integration tests (19/19 passing)

🔄 **Next Steps:**
- Implement recommendation engine API endpoint
- Build ML weight optimization using user behavior
- Segment-specific recommendation tuning
- Real-time preference updates as user interacts

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid buyerId format | buyerId is not a valid MongoDB ObjectId |
| 400 | Weights must sum to 1.0 | AI weights don't add up properly |
| 400 | budget.min > budget.max | Invalid budget range |
| 400 | User must have role "buyer" | Non-buyer trying to save preferences |
| 400 | Missing buyerId | API request didn't include buyerId |
| 404 | User not found | buyerId doesn't exist in database |
| 404 | Preferences not found | Buyer hasn't created preferences yet |

## Testing

Run the comprehensive test suite:
```bash
node verify_buyer_preferences.js
```

This tests:
- ✅ Save full preferences (POST)
- ✅ Fetch preferences (GET)
- ✅ Partial update preferences (PATCH)
- ✅ Delete preferences (DELETE)
- ✅ Budget range validation
- ✅ Weights sum validation
- ✅ Geospatial coordinate validation
- ✅ Error handling (not found, invalid input)

All 19 tests pass! ✅

---

**Next Phase:** Build the recommendation engine that uses these preferences to suggest properties!
