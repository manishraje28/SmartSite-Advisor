const { callGroqAgent } = require('./groqClient');
const Property = require('../models/Property');
const { enhancePropertyWithLivability } = require('../services/nearbyAmenitiesService');

/**
 * GeoSpatial & Environmental Health Agent
 *
 * Every number in the output (distances, AQI, geoScore) comes from the real
 * Google Places / Distance Matrix and OpenWeatherMap integrations. The LLM is
 * only used to turn those facts into a plain-English verdict — it never
 * supplies a distance or an AQI value itself.
 */

const formatPlace = (entry) => {
  if (!entry || entry.distanceValue == null || entry.distanceValue >= 999999) return 'Not available';
  return `${entry.name}: ${entry.distanceText} (${entry.durationText} drive)`;
};

const average = (values) => {
  const real = values.filter((v) => typeof v === 'number');
  return real.length ? Math.round(real.reduce((a, b) => a + b, 0) / real.length) : null;
};

const loadProperty = async (property) => {
  if (property?.location?.coordinates?.length === 2) return property;
  if (property?._id) return Property.findById(property._id).lean();
  return null;
};

const factsVerdict = ({ commuteEstimates, aqiIndex, aqiCategory }) => {
  const parts = [`Nearest metro/transit: ${commuteEstimates.nearestMetro}.`];
  parts.push(`Nearest school: ${commuteEstimates.nearestSchool}.`);
  parts.push(`Nearest hospital: ${commuteEstimates.nearestHospital}.`);
  if (aqiIndex != null) parts.push(`Current air quality: AQI ${aqiIndex}${aqiCategory ? ` (${aqiCategory})` : ''}.`);
  return parts.join(' ');
};

class GeoSpatialAgent {
  static async evaluateLocation(inputProperty) {
    const property = await loadProperty(inputProperty);
    if (!property) {
      return {
        geoScore: null,
        aqiIndex: null,
        aqiCategory: null,
        commuteEstimates: {},
        neighborhoodVerdict: 'No coordinates are available for this property, so its location could not be audited.',
        connectivityHighlights: [],
      };
    }

    const enhanced = await enhancePropertyWithLivability(property);
    const amenities = enhanced.realAmenities || {};
    const env = enhanced.environmentScore || {};

    const commuteEstimates = {
      nearestMetro: formatPlace(amenities.transit?.top?.[0]),
      supermarket: formatPlace(amenities.supermarkets?.top?.[0]),
      nearestMall: formatPlace(amenities.malls?.top?.[0]),
      nearestSchool: formatPlace(amenities.schools?.top?.[0]),
      nearestHospital: formatPlace(amenities.hospitals?.top?.[0]),
    };

    const facts = {
      geoScore: average([enhanced.livabilityScore, enhanced.connectivityScore, env.overall]),
      aqiIndex: env.aqi ?? null,
      aqiCategory: env.aqiLabel ?? null,
      commuteEstimates,
    };

    const systemPrompt = `You are the 'GeoSpatial & Environmental Health Agent' for a real-estate app.
You are given REAL, measured location facts for one property. Write a short plain-English verdict on its livability and 2-3 connectivity highlights.
Only use the facts given. Never invent a distance, travel time, place name or AQI value, and never contradict the facts. If a fact says "Not available", don't guess it.

Return valid JSON only:
{
  "neighborhoodVerdict": string,
  "connectivityHighlights": string[]
}`;

    const userPrompt = `Property: ${property.title || 'Unnamed property'}
Address: ${[property.location?.address, property.location?.city].filter(Boolean).join(', ')}
Measured facts: ${JSON.stringify(facts)}`;

    try {
      const rawResponse = await callGroqAgent({ systemPrompt, userPrompt, temperature: 0.3, maxTokens: 500 });
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const { neighborhoodVerdict, connectivityHighlights } = JSON.parse(jsonMatch[0]);
        return {
          ...facts,
          neighborhoodVerdict: neighborhoodVerdict || factsVerdict(facts),
          connectivityHighlights: Array.isArray(connectivityHighlights) ? connectivityHighlights : [],
        };
      }
    } catch (error) {
      console.error('GeoSpatialAgent Error:', error.message);
    }

    return { ...facts, neighborhoodVerdict: factsVerdict(facts), connectivityHighlights: [] };
  }
}

module.exports = GeoSpatialAgent;
