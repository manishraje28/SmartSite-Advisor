# Seller Insights & Dashboard - Complete Documentation

## Overview
Seller Insights is the core of SmartSite's seller dashboard, providing AI-generated analytics about property listings. It bridges the gap between raw property data and actionable insights, helping sellers understand demand, optimize pricing, and improve their listings.

## What Are Seller Insights?

Seller Insights are AI-generated analytics documents that sellers view to understand their property performance. Each property has ONE SellerInsights document that contains:

### Performance Metrics
- **AI Quality Score:** Overall property rating (0-100) and component scores
- **Engagement Stats:** Views, saves, inquiries with weekly trends
- **Demand Level:** Assessment of market demand (very_low to very_high)
- **Conversion Rate:** Views to inquiries ratio

### Market Intelligence
- **Optimal Price Range:** AI-recommended min/max price
- **Price vs Market:** Is your price below/at/above market rate?
- **Buyer Segmentation:** Which profiles (family, investor, etc.) are interested
- **Rent vs Sell:** Strategic recommendation (sell, rent, or hold)

### Actionable Recommendations
- **Improvement Suggestions:** Prioritized list of actions to take
  - Examples: "Lower price by ₹5L", "Add gym to attract families", "Improve photos"
  - Each suggestion shows impact (expected % improvement in inquiry rate)
  - Sellers can mark as "resolved" when they take action

### AI Analysis Tracking
- **Score History:** How the property score has changed over time
- **Analysis Timestamp:** When the AI last analyzed this property
- **Analysis Version:** Which AI model version created these insights

## API Endpoints

### 1. List All Insights (Paginated)
**Endpoint:** `GET /api/seller/insights?sellerId=...&page=1&limit=10&sort=score`

**Purpose:** Get a dashboard view of all your property insights with pagination.

**Query Parameters:**
- `sellerId` (required) - Your User ID
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `sort` (optional) - Sort field:
  - `score` (default): Sort by AI score high-to-low
  - `demand`: Sort by demand level
  - `updated`: Sort by most recently updated

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Insights retrieved successfully",
  "data": {
    "insights": [
      {
        "_id": "...",
        "property": { "title": "3BHK Flat", "price": 120, "views": 45, ... },
        "currentScore": { "overall": 78, "locationScore": 85, ... },
        "demandLevel": "moderate",
        "demandStats": { "totalViews": 45, "totalSaves": 8, "totalInquiries": 3 },
        "optimalPriceRange": { "min": 115, "max": 130 },
        "buyerSegmentMatch": { "family": 72, "investor": 45, ... },
        "improvementSuggestions": [{ "type": "pricing", "priority": "high", ... }]
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### 2. Get Single Property Insight
**Endpoint:** `GET /api/seller/insights/:propertyId?sellerId=...`

**Purpose:** View complete insights for one property.

**Response:** 200 OK (full SellerInsights document with all fields)

### 3. Mark Suggestion as Resolved
**Endpoint:** `PATCH /api/seller/insights/:propertyId/suggestions/:suggestionId/resolve`

**Purpose:** Track that you've acted on an improvement suggestion.

**Request Body:**
```json
{
  "sellerId": "YOUR_USER_ID"
}
```

**Response:** 200 OK
- Sets `suggestion.isResolved = true`
- Records `suggestion.resolvedAt = Date.now()`
- Helps AI understand which suggestions actually improve performance

### 4. Get Aggregated Analytics
**Endpoint:** `GET /api/seller/analytics?sellerId=...`

**Purpose:** See combined stats across all your properties.

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "totalViews": 245,
    "totalSaves": 28,
    "totalInquiries": 12,
    "averageScore": 76.5,
    "propertiesCount": 3,
    "suggestionsResolved": 4,
    "conversionRate": "4.90%"
  }
}
```

## How Seller Insights Connect to the Pricing Engine

### Phase 1: Property Creation → Initial Analysis
When a seller creates a property:
```
1. Property document created in MongoDB
2. AI system triggers initial analysis:
   - Extract location, bedrooms, amenities, price
   - Query comparable properties in area
   - Rate property quality (location score, amenities score)
   - Generate initial AI quality score (0-100)
3. Create SellerInsights document with:
   - currentScore (calculated from components)
   - optimalPriceRange (based on comparables)
   - buyerSegmentMatch (which profiles might like this)
   - demandStats (starts at 0 views/saves)
4. Generate initial improvement suggestions
```

### Phase 2: Buyer Engagement → Demand Tracking
As buyers interact with property:
```
✓ Buyer views property
  → Property.views += 1
  → API updates demandStats in SellerInsights

✓ Buyer saves/favorites property
  → Property.saves += 1
  → System updates engagement signal

✓ Buyer submits inquiry
  → Property.inquiries += 1
  → Track current demand level
```

System continuously aggregates engagement:
```javascript
SellerInsights.demandStats = {
  totalViews: 45,
  uniqueViews: 38,       // Deduped visits
  totalSaves: 8,         // Strong interest signal
  totalInquiries: 3,     // Hard conversion signal
  weeklyTrend: [
    {week: "2025-W12", views: 20, inquiries: 1},
    {week: "2025-W13", views: 25, inquiries: 2}
  ]
}
```

### Phase 3: AI Re-analysis → Price Recommendations
**Triggered by:** Scheduler (daily/weekly) or when seller updates property

**AI Logic:**
```
FOR EACH property in database:

  // 1. Calculate demand metrics
  views = demandStats.totalViews
  inquiries = demandStats.totalInquiries
  conversionRate = inquiries / views  // If views > 0

  // 2. Compare to market
  comparables = find(properties in same location with similar specs)
  marketAvgPrice = avg(comparables.price)
  pricePercentageDiff = ((property.price - marketAvgPrice) / marketAvgPrice) * 100

  // 3. Generate pricing recommendation
  IF conversionRate < 2% AND pricePercentageDiff > 5%:
    suggestion = "Price is above market. Reduce by ₹{amount} to increase inquiry rate"
    priority = "high"
    impact = 25  // Estimated 25% improvement in inquiries

  IF demandLevel == "high" AND pricePercentageDiff < -10%:
    suggestion = "Property is attracting lots of interest. Could price higher"
    priority = "medium"
    impact = 10  // Price increase won't hurt demand

  // 4. Analyze buyer segments
  queriedBySegments = analyze(buyer preferences for viewers)
  topSegment = find_max(queriedBySegments)

  // 5. Generate feature suggestions
  IF topSegment == "family" AND !hasAmenity("school"):
    suggestion = "Add school proximity info to attract more families"
    priority = "medium"
    impact = 18

  // 6. Update SellerInsights
  SellerInsights.optimalPriceRange = {min, max}
  SellerInsights.currentScore = {overall, components}
  SellerInsights.scoreHistory.push({score, reason: "weekly analysis"})
  SellerInsights.buyerSegmentMatch = {segments}
  SellerInsights.improvementSuggestions = [newly generated suggestions]
  SellerInsights.lastAiAnalysisAt = now()
```

### Phase 4: Seller Dashboard Display
Seller views dashboard showing:
```
PROPERTY: Modern 3BHK in Powai
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Listing Price: ₹1,20,00,000
Recommended Range: ₹1,15,00,000 - ₹1,30,00,000
Price vs Market: 4% ABOVE market average

AI Quality Score: 78/100
├─ Location: 85/100 ✅ Excellent
├─ Connectivity: 72/100 ✅ Good
└─ Amenities: 80/100 ✅ Great

Buyer Interest: 245 views, 28 saves, 12 inquiries
Conversion Rate: 4.9%
Demand Level: MODERATE

Most Interested: Families (72%), Retirees (55%)

IMPROVEMENT SUGGESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[HIGH] Reduce price to ₹1.15Cr → +25% inquiry rate
[MED]  Add school proximity details → +18% family interest
[MED]  Improve kitchen photos → +12% view-to-save conversion
```

### Phase 5: Seller Takes Action → Pricing Feedback Loop
```
1. Seller sees: "Price is 4% above market, reduce to ₹1.15Cr for more inquiries"
2. Seller clicks: "Apply Recommendation" button
3. System updates: Property.price = 1,15,00,000
4. AI detects price change, re-triggers analysis
5. New SellerInsights generated:
   - optimalPriceRange updated
   - demandProbability recalculated
   - scoreHistory records this change
6. Seller notifications: "Price change detected! New analysis: demand +8%"
```

### Phase 6: Long-term Learning → Pricing Precision
System learns from multiple feedback loops:
```
Track over time:
- Which suggestions sellers acted on
- Which actions actually improved inquiry rates
- Property type + location patterns

Example ML insights:
- "For Apartments in Powai: Adding gym → +30% family inquiries"
- "Studio units sell 15% faster when priced below ₹50L"
- "Investors respond to properties with ROI > 8% estimate"

Result:
- Price recommendations become more accurate
- Suggestions become more targeted
- AI learns seller behavior patterns
```

## Key Data Structures

### SellerInsights Document structure:
```javascript
{
  _id: ObjectId,

  // Relationships
  property: ObjectId,    // Reference to Property
  seller: ObjectId,      // Reference to User (seller)

  // Performance
  currentScore: {
    overall: 78,           // Composite score
    locationScore: 85,
    connectivityScore: 72,
    amenitiesScore: 80,
    roiPotential: 65       // For investor segment
  },
  scoreHistory: [
    {score: 75, recordedAt: Date, reason: "price updated"}
  ],

  // Pricing Intelligence
  optimalPriceRange: {min: 115L, max: 130L},
  rentVsSellRecommendation: "sell",
  rentVsSellReasoning: "Strong buyer demand...",
  marketComparison: {
    avgAreaPrice: 125,
    priceVsMarket: "below",     // below|at|above
    percentageDiff: -4,          // -4%
    comparableCount: 8
  },

  // Engagement Tracking
  demandStats: {
    totalViews: 245,
    uniqueViews: 210,
    totalSaves: 28,
    totalInquiries: 12,
    weeklyTrend: [
      {week: "2025-W12", views: 100, inquiries: 4},
      {week: "2025-W13", views: 145, inquiries: 8}
    ],
    lastUpdated: Date
  },
  demandLevel: "moderate",  // very_low|low|moderate|high|very_high

  // Buyer Segmentation
  buyerSegmentMatch: {
    family: 72,
    investor: 45,
    student: 20,
    bachelor: 35,
    retiree: 55
  },
  topTargetSegment: "family",

  // Actionable Suggestions
  improvementSuggestions: [
    {
      type: "pricing",         // pricing|amenity|targeting|imagery|description|legal
      priority: "high",        // high|medium|low
      message: "Reduce price to compete",
      impact: 25,              // Expected % improvement
      isResolved: false,       // Seller can mark as done
      resolvedAt: null,        // When seller acted
      generatedAt: Date,       // When AI created it
      _id: ObjectId            // Unique ID
    }
  ],

  // System Metadata
  lastAiAnalysisAt: Date,
  analysisVersion: "1.0",     // For model reproducibility
  createdAt: Date,
  updatedAt: Date
}
```

## Seller Workflow Example

**Day 1: Initial Listing**
```
Seller creates: 3BHK apartment, ₹1.2Cr, Powai
System generates initial SellerInsights with score 72
Receives 2 suggestions about location details
```

**Days 2-7: Market Testing**
```
Views ramp up: 0 → 120
Saves: 0 → 15
Inquiries: 0 → 4

Conversion rate: 4/120 = 3.3% (good!)
```

**Day 8: AI Re-analysis**
```
- Price is 2% ABOVE market average
- But: High inquiry rate (3.3%) = Demand IS strong
- AI suggests: Price is actually undervalued, could increase to ₹1.25Cr
- Generates new suggestion: "Strong demand—increase price by ₹5L and still maintain interest"
```

**Day 9: Seller Action**
```
Seller reviews and applies: "Reduce photos to professional quality" suggestion
Updates property description

System re-analyzes automatically (triggered by update)
New score: 76 (up from 72)
Suggestion marked resolved
```

**Week 2: Continuous Learning**
```
- Views: 250 total
- Saves: 35 total
- Inquiries: 14 total (5.6% conversion—excellent!)

AI learns: "This property style + price point = strong family appeal"
Updates buyerSegmentMatch: family now 78%
New suggestion: "Add family-specific amenities to docs to attract more"
```

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid sellerId format | sellerId not a valid ObjectId |
| 400 | Limit must be 1-100 | Page, limit, or sort invalid |
| 403 | User must be role "seller" | Buyer/admin trying to access |
| 404 | No insights found | Seller has no properties or insights |
| 404 | Property not found | propertyId doesn't exist |
| 403 | You don't have access | Trying to access another seller's property |

## Testing

Run the comprehensive test suite:
```bash
node verify_seller_insights.js
```

Tests cover:
- ✅ List all insights with pagination
- ✅ Single property detail view
- ✅ Suggestion resolution
- ✅ Aggregated analytics
- ✅ Authorization checks (sellers only)
- ✅ Parameter validation
- ✅ Error handling

## Future Enhancements

### Short-term
1. **Automated Price Adjustments** - Sellers can auto-apply price recommendations
2. **Email Notifications** - Alert sellers when new suggestions are generated
3. **A/B Testing** - Test different prices/descriptions and track performance
4. **Comparative Analysis** - Compare your property to similar listings

### Medium-term
1. **ML Price Optimization** - Machine learning to find optimal price per property
2. **Dynamic Suggestions** - Personalized suggestions based on buyer behavior
3. **Marketing Tools** - Help sellers understand which segments to target
4. **Performance Benchmarking** - Compare your metrics to similar properties

### Long-term
1. **Predictive Analytics** - Forecast when property will sell
2. **Buyer Journey Tracking** - See how interested buyers interact with property
3. **Recommendation Feedback** - Train AI on which seller actions worked best
4. **Multi-listing Intelligence** - Portfolio management across multiple properties

---

## Implementation Notes

**Files:**
- `/src/services/sellerInsightsService.js` - Business logic (queries, aggregations)
- `/src/controllers/sellerController.js` - HTTP handling
- `/src/routes/sellerRoutes.js` - Endpoint definitions
- `/src/utils/sellerValidator.js` - Validation logic
- `/src/models/SellerInsights.js` - Database schema (no changes needed)
- `verify_seller_insights.js` - Integration tests (13+ passing tests ✅)

**Database Indexes:**
- `{seller: 1, 'currentScore.overall': -1}` - Dashboard queries
- `{lastAiAnalysisAt: 1}` - AI scheduler finding stale records
- `{demandLevel: 1}` - Platform trending analysis

**Security:**
- Sellers can only access their OWN property insights
- Cross-seller data access automatically denied (403)
- Insights are READ-ONLY (AI writes, sellers read)
- Only suggestion resolution is seller-writable action

---

**Next Phase:** Build the recommendation engine that uses buyer preferences + seller insights to surface matching properties!
