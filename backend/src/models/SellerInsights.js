/**
 * SellerInsights.js
 * AI-generated analytics document for each property listing.
 *
 * Design Decisions:
 * 1. Separate from Property — insight data grows over time (demand trends,
 *    AI updates, suggestion history). Embedding in Property would cause
 *    document bloat and slow down buyer-facing property listing queries.
 *
 * 2. Written by system/AI — sellers can only READ this data.
 *    The AI service will UPSERT this document whenever it analyzes a property.
 *
 * 3. `improvementSuggestions` as array of objects — each suggestion has a type,
 *    message, priority, and resolved flag, enabling a task-list style UI.
 *
 * 4. `demandStats` tracks engagement counters with a `lastUpdated` timestamp
 *    so the AI knows when to refresh scores.
 *
 * 5. `buyerSegmentMatch` — maps buyer types to match probability.
 *    Sellers can see "Your property appeals most to investors (72%)"
 *
 * Relationship: One-to-One with Property (propertyId is unique indexed).
 */

const mongoose = require('mongoose');

// ── Sub-schema: Improvement Suggestion ────────────────────────────────────
const improvementSuggestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['pricing', 'amenity', 'targeting', 'imagery', 'description', 'legal'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    impact: {
      // Expected % improvement in inquiry rate if implemented
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    isResolved: {
      type: Boolean,
      default: false,     // Seller can mark suggestions as acted upon
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }           // These need IDs so sellers can mark specific ones as resolved
);

// ── Sub-schema: Demand Statistics ─────────────────────────────────────────
/**
 * Tracks real engagement data — used to compute demand trends in the UI.
 * These are totals (incremented by the API when a buyer views/saves/inquires).
 * The AI uses these numbers to estimate demand probability.
 */
const demandStatsSchema = new mongoose.Schema(
  {
    totalViews: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    totalSaves: { type: Number, default: 0 },
    totalInquiries: { type: Number, default: 0 },

    // Weekly snapshots for trend charts (last 8 weeks)
    weeklyTrend: [
      {
        week: { type: String },         // ISO week string, e.g. "2025-W12"
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
      },
    ],

    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Sub-schema: Buyer Segment Match ───────────────────────────────────────
/**
 * Output from the AI buyer-property matching analysis.
 * Tells the seller which buyer types are most likely to be interested.
 *
 * Example: { family: 65, investor: 72, student: 20, bachelor: 35, retiree: 45 }
 * Values are match probability percentages (0–100).
 */
const buyerSegmentMatchSchema = new mongoose.Schema(
  {
    family: { type: Number, min: 0, max: 100, default: null },
    investor: { type: Number, min: 0, max: 100, default: null },
    student: { type: Number, min: 0, max: 100, default: null },
    bachelor: { type: Number, min: 0, max: 100, default: null },
    retiree: { type: Number, min: 0, max: 100, default: null },
    generatedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Sub-schema: Market Comparison ─────────────────────────────────────────
/**
 * Contextualizes the property within the local market.
 * How does this property compare to similar ones in the same area?
 */
const marketComparisonSchema = new mongoose.Schema(
  {
    avgAreaPrice: { type: Number, default: null },         // Average price/sqft in the area
    priceVsMarket: {
      type: String,
      enum: ['below', 'at', 'above'],
      default: null,
    },
    percentageDiff: { type: Number, default: null },       // e.g., 12.5 → 12.5% above market
    comparableCount: { type: Number, default: null },      // How many comps were used
    lastAnalyzedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Main SellerInsights Schema ─────────────────────────────────────────────
const sellerInsightsSchema = new mongoose.Schema(
  {
    // ── Relationships ────────────────────────────────────────────────────
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'SellerInsights must be linked to a property'],
      unique: true,         // One insights document per property (one-to-one)
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'SellerInsights must be linked to a seller'],
      index: true,          // "Show all insights for my listings" query
    },

    // ── AI Property Score ─────────────────────────────────────────────────
    /**
     * Same structure as Property.aiScore — mirrored here for the seller dashboard.
     * Includes score history so sellers can see improvement over time.
     */
    currentScore: {
      overall: { type: Number, min: 0, max: 100, default: null },
      locationScore: { type: Number, min: 0, max: 100, default: null },
      connectivityScore: { type: Number, min: 0, max: 100, default: null },
      amenitiesScore: { type: Number, min: 0, max: 100, default: null },
      roiPotential: { type: Number, min: 0, max: 100, default: null },
    },

    scoreHistory: [
      {
        score: { type: Number },
        recordedAt: { type: Date, default: Date.now },
        reason: { type: String },   // What triggered the rescore (e.g., "price updated")
      },
    ],

    // ── AI Pricing Intelligence ───────────────────────────────────────────
    optimalPriceRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },

    rentVsSellRecommendation: {
      type: String,
      enum: ['sell', 'rent', 'hold', null],
      default: null,
    },

    rentVsSellReasoning: {
      type: String,
      default: null,
    },

    // ── Demand & Engagement ───────────────────────────────────────────────
    demandStats: {
      type: demandStatsSchema,
      default: {},
    },

    demandLevel: {
      type: String,
      enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
      default: null,
    },

    // ── Buyer Segment Analysis ────────────────────────────────────────────
    buyerSegmentMatch: {
      type: buyerSegmentMatchSchema,
      default: {},
    },

    topTargetSegment: {
      type: String,
      enum: ['family', 'investor', 'student', 'bachelor', 'retiree', null],
      default: null,
    },

    // ── Market Analysis ───────────────────────────────────────────────────
    marketComparison: {
      type: marketComparisonSchema,
      default: {},
    },

    // ── Improvement Suggestions ───────────────────────────────────────────
    improvementSuggestions: {
      type: [improvementSuggestionSchema],
      default: [],
    },

    // ── System Metadata ───────────────────────────────────────────────────
    lastAiAnalysisAt: {
      type: Date,
      default: null,       // When was the last full AI analysis run?
    },

    analysisVersion: {
      type: String,
      default: null,       // AI model version used — for reproducibility
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────

/**
 * Seller dashboard: "show all insights for my properties"
 * Also useful: sort by overall score to show best-performing listing first.
 */
sellerInsightsSchema.index({ seller: 1, 'currentScore.overall': -1 });

/**
 * AI re-analysis scheduler: "find all insights not analyzed in the last 24h"
 */
sellerInsightsSchema.index({ lastAiAnalysisAt: 1 });

/**
 * Demand monitoring: find high-demand properties across the platform.
 */
sellerInsightsSchema.index({ demandLevel: 1 });

const SellerInsights = mongoose.model('SellerInsights', sellerInsightsSchema);

module.exports = SellerInsights;
