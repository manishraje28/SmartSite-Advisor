/**
 * BuyerPreferences.js
 * Stores a buyer's personalized search criteria and priorities.
 *
 * Design Decisions:
 * 1. Separate from User — preferences are updated frequently and independently
 *    of core auth data (name, email, password). Keeping them separate prevents
 *    large User documents and allows the AI engine to fetch just preferences.
 *
 * 2. `weights` object — this is the key AI personalization input.
 *    Buyers implicitly or explicitly express what matters most to them.
 *    The recommendation engine uses these weights to rank properties.
 *    All weights sum to 1.0 (enforced at validation layer, not schema level).
 *
 * 3. `preferredLocations` as an array — buyers in India often search across
 *    multiple areas simultaneously (e.g., ['Bandra', 'Andheri', 'Powai']).
 *
 * 4. Relationship: One-to-One with User (userId is unique indexed).
 *    Created automatically when a buyer completes onboarding.
 */

const mongoose = require('mongoose');

// ── Sub-schema: Budget Range ───────────────────────────────────────────────
const budgetRangeSchema = new mongoose.Schema(
  {
    min: {
      type: Number,
      min: [0, 'Budget minimum cannot be negative'],
      default: 0,
    },
    max: {
      type: Number,
      min: [0, 'Budget maximum cannot be negative'],
      default: null,
    },
  },
  { _id: false }
);

// ── Sub-schema: AI Personalization Weights ────────────────────────────────
/**
 * These weights are fed into the recommendation scoring engine.
 * They represent how much each factor influences the buyer's decision.
 * Range: 0.0 (irrelevant) to 1.0 (most important).
 *
 * Example: A budget-conscious buyer: { price: 0.5, location: 0.3, amenities: 0.2 }
 * Example: A luxury investor:        { roiPotential: 0.5, amenities: 0.3, price: 0.2 }
 */
const weightsSchema = new mongoose.Schema(
  {
    price: { type: Number, min: 0, max: 1, default: 0.35 },
    location: { type: Number, min: 0, max: 1, default: 0.30 },
    amenities: { type: Number, min: 0, max: 1, default: 0.20 },
    connectivity: { type: Number, min: 0, max: 1, default: 0.10 },
    roiPotential: { type: Number, min: 0, max: 1, default: 0.05 },
  },
  { _id: false }
);

// ── Main BuyerPreferences Schema ──────────────────────────────────────────
const buyerPreferencesSchema = new mongoose.Schema(
  {
    // ── Relationship ─────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'BuyerPreferences must be linked to a user'],
      unique: true,         // One preferences document per buyer
    },

    // ── Property Type Preferences ─────────────────────────────────────────
    preferredPropertyTypes: {
      type: [String],
      enum: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Shop', 'Farmhouse', 'Studio'],
      default: [],
    },

    listingPreference: {
      type: String,
      enum: ['Sale', 'Rent', 'Lease', 'Any'],
      default: 'Any',
    },

    // ── Budget ────────────────────────────────────────────────────────────
    budget: {
      type: budgetRangeSchema,
      default: {},
    },

    // ── Location Preferences ──────────────────────────────────────────────
    /**
     * Array of city/neighborhood names.
     * Matched against Property.location.city or address during recommendation.
     * Kept as strings (not ObjectIds) for flexibility — no Location collection needed.
     */
    preferredLocations: {
      type: [String],
      default: [],
    },

    /**
     * Max distance from a reference point (in km).
     * Used together with a `referencePoint` for geospatial filtering.
     * Example: "Within 5km of my office in Powai"
     */
    maxDistanceKm: {
      type: Number,
      min: 0,
      default: null,
    },

    referencePoint: {
      // GeoJSON Point — the buyer's office, school, or anchor location
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],       // [longitude, latitude]
        default: null,
      },
    },

    // ── Size & Specifications ─────────────────────────────────────────────
    minBedrooms: { type: Number, min: 0, default: null },

    minCarpetAreaSqFt: { type: Number, min: 0, default: null },

    furnishingPreference: {
      type: [String],
      enum: ['Unfurnished', 'Semi-Furnished', 'Fully-Furnished', 'Any'],
      default: ['Any'],
    },

    // ── Amenities Must-Haves ──────────────────────────────────────────────
    /**
     * Amenities that the buyer REQUIRES (hard filter — not just nice-to-have).
     * Properties missing these will be excluded from recommendations.
     */
    requiredAmenities: {
      type: [String],
      default: [],
    },

    // ── Buyer Segment ─────────────────────────────────────────────────────
    /**
     * Helps the AI understand intent and target seller insights accordingly.
     * 'investor' → prioritizes ROI, rental yield
     * 'family'   → prioritizes schools, safety, space
     * 'student'  → prioritizes proximity to institutions, rent range
     * 'bachelor' → compact, affordable, near transport
     */
    buyerSegment: {
      type: String,
      enum: ['family', 'investor', 'student', 'bachelor', 'retiree'],
      default: null,
    },

    // ── AI Personalization Weights ────────────────────────────────────────
    weights: {
      type: weightsSchema,
      default: {},
    },

    // ── Onboarding Status ─────────────────────────────────────────────────
    isComplete: {
      type: Boolean,
      default: false,       // Set to true after buyer completes the preference survey
    },

    // ── Interaction History (for implicit preference learning) ────────────
    savedProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],

    viewedProperties: [
      {
        property: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Property',
        },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────

/**
 * user: Already unique (enforces one-to-one).
 * Compound index for AI engine queries: find all investors with a budget in range.
 */
buyerPreferencesSchema.index({ buyerSegment: 1, 'budget.min': 1, 'budget.max': 1 });

/**
 * Geospatial index on referencePoint for proximity-based queries.
 * sparse: true — only indexes documents where referencePoint.coordinates exists.
 */
buyerPreferencesSchema.index(
  { 'referencePoint': '2dsphere' },
  { sparse: true }
);

const BuyerPreferences = mongoose.model('BuyerPreferences', buyerPreferencesSchema);

module.exports = BuyerPreferences;
