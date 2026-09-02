/**
 * googleAirQualityService.js
 * Fetches real air quality data from Google's Air Quality API, preferring the
 * India-specific CPCB National AQI (0-500 scale, matching what Indian users
 * actually recognize) over Google's own Universal AQI index.
 *
 * This is used as the PREFERRED source for environmentScore.aqi in
 * openWeatherService.js — OpenWeatherMap's air_pollution endpoint (1-5 scale) is
 * kept as the fallback when this is unavailable (no key, request failure, etc).
 */

const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const AQI_URL = 'https://airquality.googleapis.com/v1/currentConditions:lookup';

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{aqi:number, aqiLabel:string, universalAqi:number|null, dominantPollutant:string|null, pollutants:object, source:string}|null>}
 */
async function getGoogleAirQuality(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const { data } = await axios.post(
      `${AQI_URL}?key=${GOOGLE_MAPS_API_KEY}`,
      {
        location: { latitude: lat, longitude: lng },
        extraComputations: ['LOCAL_AQI', 'POLLUTANT_CONCENTRATION'],
        languageCode: 'en',
      },
      { timeout: 4000 }
    );

    const indexes = data.indexes || [];
    // Prefer the local (India CPCB) index over Google's own Universal AQI —
    // it's the scale Indian users actually recognize and matches the
    // Property.environmentScore.aqi schema range (0-500).
    const localIndex = indexes.find((i) => i.code !== 'uaqi') || indexes[0];
    const universalIndex = indexes.find((i) => i.code === 'uaqi');
    if (!localIndex) return null;

    const pollutantsByCode = {};
    (data.pollutants || []).forEach((p) => {
      pollutantsByCode[p.code] = p.concentration?.value ?? null;
    });

    return {
      aqi: localIndex.aqi,
      aqiLabel: localIndex.category,
      universalAqi: universalIndex?.aqi ?? null,
      dominantPollutant: localIndex.dominantPollutant || null,
      pollutants: {
        co: pollutantsByCode.co ?? null,
        no: null, // Google doesn't report nitric oxide separately, only NO2
        no2: pollutantsByCode.no2 ?? null,
        o3: pollutantsByCode.o3 ?? null,
        so2: pollutantsByCode.so2 ?? null,
        pm2_5: pollutantsByCode.pm25 ?? null,
        pm10: pollutantsByCode.pm10 ?? null,
        nh3: pollutantsByCode.nh3 ?? null,
      },
      source: 'Google Air Quality API',
    };
  } catch (error) {
    console.warn('[GoogleAirQuality] Failed:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

module.exports = { getGoogleAirQuality };
