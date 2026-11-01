const crypto = require('crypto');
const Property = require('../models/Property');
const User = require('../models/User');
const SellerInsights = require('../models/SellerInsights');
const RealEstateScraperAgent = require('./RealEstateScraperAgent');
const { scoringPropertyAsync } = require('../services/propertyService');

const SYNC_AGENT_EMAIL = 'syncagent@smartsite.com';

/**
 * The system account that owns scraped listings. Its password is random and never
 * stored anywhere, so nobody can sign in as it and edit or delete those listings.
 */
async function getSyncAgentUser() {
  const existing = await User.findOne({ email: SYNC_AGENT_EMAIL });
  if (existing) return existing;
  return User.create({
    name: 'SmartSite Portal Sync Agent',
    email: SYNC_AGENT_EMAIL,
    password: crypto.randomBytes(24).toString('hex'),
    role: 'seller',
    phone: '+91 98765 00000',
    isVerified: true,
  });
}

/**
 * One-off fix for data created before scraped listings had their own owner: they
 * were assigned to the first seller account, i.e. the public demo seller. The demo
 * seller keeps only its seeded sample listings (matched by title from autoSeed);
 * every other listing it owns, and that listing's SellerInsights, moves to the
 * sync agent. Idempotent.
 */
async function reassignScrapedListingsFromDemoSeller() {
  const { sampleTitles } = require('../utils/autoSeed');
  const demoSeller = await User.findOne({ email: 'seller@smartsite.com' });
  if (!demoSeller) return;
  const scrapedIds = await Property.distinct('_id', { seller: demoSeller._id, title: { $nin: sampleTitles } });
  if (!scrapedIds.length) return;
  const syncAgent = await getSyncAgentUser();
  await Property.updateMany({ _id: { $in: scrapedIds } }, { $set: { seller: syncAgent._id } });
  await SellerInsights.updateMany({ property: { $in: scrapedIds } }, { $set: { seller: syncAgent._id } });
  console.log(`🔐 Moved ${scrapedIds.length} scraped listings from the demo seller to the sync agent account.`);
}

/**
 * PortalSyncManager
 * Manages database upserts, price verification timestamps, and conflict resolution
 * for scraped real estate listings across Mumbai, Thane, and Navi Mumbai.
 */
class PortalSyncManager {
  /**
   * Harvests and auto-syncs live property data for a given region into MongoDB.
   */
  static async harvestAndSyncRegion({ city = 'Mumbai', locality = '', limit = 300, maxPages = 10 } = {}) {
    try {
      console.log(`🔄 PortalSyncManager: Syncing database with live portal data for [${city}]...`);
      const scrapedListings = await RealEstateScraperAgent.scrapeListings({ city, locality, limit, maxPages });

      const syncedDocs = [];

      for (const item of scrapedListings) {
        // Find existing property by sourceUrl or matching title & city
        let existing = await Property.findOne({
          $or: [
            { sourceUrl: item.sourceUrl },
            { title: item.title, 'location.city': item.city }
          ]
        });

        const now = new Date();

        if (existing) {
          // Detect price changes and push to price history
          let priceChanged = false;
          if (existing.price !== item.price) {
            existing.priceHistory = existing.priceHistory || [];
            existing.priceHistory.push({
              oldPrice: existing.price,
              newPrice: item.price,
              updatedAt: now
            });
            existing.price = item.price;
            priceChanged = true;
          }

          existing.verifiedLive = item.verifiedLive !== false;
          existing.lastSyncedAt = now;
          existing.sourcePortal = item.sourcePortal || existing.sourcePortal;

          await existing.save();

          // Re-score when the price moved (it's a scoring input) or the property
          // was never successfully scored in the first place — non-blocking, same
          // as the real scoring path new properties go through on creation.
          if (priceChanged || existing.aiScore?.overall == null) {
            scoringPropertyAsync(existing).catch((err) => {
              console.error(`[PortalSyncManager] Re-scoring failed for ${existing._id}:`, err.message);
            });
          }

          syncedDocs.push({ property: existing, action: priceChanged ? 'PRICE_UPDATED' : 'SYNCED' });
        } else {
          // Scraped listings belong to a dedicated system account, never to a real
          // (or public demo) seller who could then edit or delete them.
          const sellerUser = await getSyncAgentUser();

          // Insert fresh scraped listing into MongoDB
          const loc = item.location || { address: `${item.locality}, ${item.city}`, city: item.city, state: 'Maharashtra', lat: 19.0760, lng: 72.8777 };
          if (!loc.coordinates || loc.coordinates.length < 2) {
            loc.coordinates = [loc.lng || 72.8777, loc.lat || 19.0760];
          }

          const newDoc = new Property({
            seller: sellerUser._id,
            title: item.title,
            description: item.description,
            propertyType: item.propertyType || 'Apartment',
            listingType: item.listingType || 'Sale',
            price: item.price,
            location: loc,
            specifications: item.specifications || { bedrooms: 2, bathrooms: 2, carpetArea: 900 },
            amenities: item.amenities || ['Security', 'Lift', 'Power Backup'],
            images: item.images || ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80'],
            // aiScore/environmentScore are intentionally left unset here — they used to be
            // hardcoded to { overall: 88 } / { overall: 85, aqi: 45 } for every single scraped
            // property, regardless of actual location or amenities. Real scores come from the
            // same scoringPropertyAsync pipeline manually-created properties go through, below.
            sourcePortal: item.sourcePortal || 'Housing.com',
            sourceUrl: item.sourceUrl,
            verifiedLive: item.verifiedLive !== false,
            lastSyncedAt: now,
            status: 'available'
          });

          await newDoc.save();

          scoringPropertyAsync(newDoc).catch((err) => {
            console.error(`[PortalSyncManager] Scoring failed for ${newDoc._id}:`, err.message);
          });

          syncedDocs.push({ property: newDoc, action: 'CREATED' });
        }
      }

      console.log(`✅ PortalSyncManager: Successfully processed ${syncedDocs.length} live properties for ${city}.`);
      return { success: true, count: syncedDocs.length, results: syncedDocs };
    } catch (error) {
      console.error("PortalSyncManager Error:", error);
      throw error;
    }
  }

  /**
   * Forces an immediate live verification sync on a single property ID.
   * Only actually marks a property verifiedLive if it has a real sourceUrl from a
   * genuine scrape — otherwise this would let any property (including a seller's own
   * manually-listed one, never touched by any portal) be stamped "Verified Live".
   */
  static async forceSinglePropertySync(propertyId) {
    const prop = await Property.findById(propertyId);
    if (!prop) throw new Error("Property not found");

    if (!prop.sourceUrl) {
      return {
        success: false,
        property: prop,
        message: 'This property has no source portal URL to verify against — it was not scraped from a live listing.'
      };
    }

    prop.verifiedLive = true;
    prop.lastSyncedAt = new Date();
    await prop.save();

    return {
      success: true,
      property: prop,
      message: `Successfully verified live with ${prop.sourcePortal}!`
    };
  }
}

PortalSyncManager.reassignScrapedListingsFromDemoSeller = reassignScrapedListingsFromDemoSeller;

module.exports = PortalSyncManager;
