const axios = require('axios');
const { getGoogleAirQuality } = require('./googleAirQualityService');

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY || process.env.OPEN_WEATHER_MAP_API_KEY;
const OPENWEATHERMAP_BASE_URL = process.env.OPENWEATHERMAP_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const CACHE_TTL_MS = Number(process.env.OPENWEATHERMAP_CACHE_TTL_MS || 30 * 60 * 1000);

const environmentCache = new Map();

const AQI_LABELS = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const roundCoordinate = (value) => Number.parseFloat(Number(value).toFixed(3));
const getAqiLabel = (aqi) => AQI_LABELS[aqi] || 'Unknown';

const mapAqiToScore = (aqi) => {
  if (!aqi) return 55;
  if (aqi <= 1) return 100;
  if (aqi <= 2) return 82;
  if (aqi <= 3) return 60;
  if (aqi <= 4) return 35;
  return 15;
};

// Google Air Quality API's India-local index uses the CPCB National AQI scale
// (0-500, higher = worse) — a different scale from OpenWeatherMap's 1-5 index above,
// so it needs its own bucket mapping to a 0-100 "clean air" score.
const mapCpcbAqiToScore = (aqi) => {
  if (aqi === null || aqi === undefined) return 55;
  if (aqi <= 50) return 100;   // Good
  if (aqi <= 100) return 85;   // Satisfactory
  if (aqi <= 200) return 60;   // Moderate
  if (aqi <= 300) return 35;   // Poor
  if (aqi <= 400) return 15;   // Very Poor
  return 5;                    // Severe
};

const mapPm25Score = (pm25) => {
  if (pm25 === null || pm25 === undefined) return 55;
  if (pm25 <= 12) return 100;
  if (pm25 <= 35) return 75;
  if (pm25 <= 55) return 50;
  if (pm25 <= 150) return 25;
  return 10;
};

const mapPm10Score = (pm10) => {
  if (pm10 === null || pm10 === undefined) return 55;
  if (pm10 <= 50) return 100;
  if (pm10 <= 100) return 75;
  if (pm10 <= 150) return 50;
  if (pm10 <= 250) return 25;
  return 10;
};

const scoreTemperature = (temp) => {
  if (temp === null || temp === undefined) return 55;
  if (temp >= 20 && temp <= 28) return 100;
  if (temp >= 16 && temp <= 32) return 82;
  if (temp >= 12 && temp <= 36) return 60;
  return 35;
};

const scoreHumidity = (humidity) => {
  if (humidity === null || humidity === undefined) return 55;
  if (humidity >= 35 && humidity <= 65) return 100;
  if (humidity >= 25 && humidity <= 75) return 80;
  if (humidity >= 15 && humidity <= 85) return 55;
  return 35;
};

const scoreWind = (windSpeed) => {
  if (windSpeed === null || windSpeed === undefined) return 55;
  if (windSpeed >= 1 && windSpeed <= 18) return 100;
  if (windSpeed <= 24) return 80;
  if (windSpeed <= 32) return 55;
  return 35;
};

const scoreVisibility = (visibilityKm) => {
  if (visibilityKm === null || visibilityKm === undefined) return 55;
  if (visibilityKm >= 10) return 100;
  if (visibilityKm >= 7) return 82;
  if (visibilityKm >= 4) return 60;
  return 35;
};

const getForecastAqiAverage = (forecastList = []) => {
  const samples = forecastList.slice(0, 24).map((item) => Number(item?.main?.aqi)).filter(Boolean);
  if (samples.length === 0) return null;
  const total = samples.reduce((sum, value) => sum + value, 0);
  return total / samples.length;
};

const getTrendLabel = (delta) => {
  if (delta >= 0.6) return 'Improving';
  if (delta <= -0.6) return 'Worsening';
  return 'Stable';
};

const buildSummary = ({ aqi, aqiLabel, weather, forecastTrend }) => {
  const parts = [];

  if (aqi) {
    parts.push(`AQI is ${aqiLabel} (${aqi}).`);
  } else {
    parts.push('AQI data is unavailable right now.');
  }

  if (weather?.temp !== null && weather?.temp !== undefined) {
    parts.push(`Current temperature is ${weather.temp}°C with ${weather.humidity ?? 'n/a'}% humidity.`);
  }

  if (forecastTrend) {
    parts.push(`The 24h trend looks ${forecastTrend.toLowerCase()}.`);
  }

  return parts.join(' ');
};

const buildRecommendations = ({ airQualityScore, comfortScore, trendLabel }) => {
  const recommendations = [];

  if (airQualityScore >= 80 && comfortScore >= 75) {
    recommendations.push('Good for outdoor activity and balcony use.');
  }

  if (airQualityScore < 50) {
    recommendations.push('Air quality is weak, so long outdoor stays may be uncomfortable.');
  }

  if (comfortScore < 50) {
    recommendations.push('Weather comfort is below average for extended outdoor use.');
  }

  if (trendLabel === 'Worsening') {
    recommendations.push('Air quality is expected to worsen in the next 24 hours.');
  }

  return recommendations;
};

const scoreEnvironment = ({ googleAqi, owmCurrentAqi, owmPollutionComponents, weatherData, forecastAqiAvg }) => {
  // Google's India-local (CPCB) AQI is preferred when available — it's the scale
  // Indian users actually recognize, and comes with real pollutant concentrations.
  // OpenWeatherMap's air_pollution endpoint (1-5 scale) is the fallback.
  const usingGoogle = !!googleAqi;

  const headlineAqi = usingGoogle ? googleAqi.aqi : owmCurrentAqi;
  const aqiLabel = usingGoogle ? googleAqi.aqiLabel : getAqiLabel(owmCurrentAqi);
  const pollutants = usingGoogle
    ? googleAqi.pollutants
    : (owmPollutionComponents
      ? {
          co: owmPollutionComponents.co ?? null,
          no: owmPollutionComponents.no ?? null,
          no2: owmPollutionComponents.no2 ?? null,
          o3: owmPollutionComponents.o3 ?? null,
          so2: owmPollutionComponents.so2 ?? null,
          pm2_5: owmPollutionComponents.pm2_5 ?? null,
          pm10: owmPollutionComponents.pm10 ?? null,
          nh3: owmPollutionComponents.nh3 ?? null,
        }
      : null);

  const airQualityScore = usingGoogle ? mapCpcbAqiToScore(googleAqi.aqi) : mapAqiToScore(owmCurrentAqi);
  const pollutantExposureScore = Math.round((mapPm25Score(pollutants?.pm2_5) + mapPm10Score(pollutants?.pm10)) / 2);

  const temp = weatherData?.main?.temp ?? null;
  const humidity = weatherData?.main?.humidity ?? null;
  const windSpeed = weatherData?.wind?.speed ?? null;
  const visibilityKm = weatherData?.visibility ? weatherData.visibility / 1000 : null;
  const rainMm = weatherData?.rain?.['1h'] ?? weatherData?.rain?.['3h'] ?? 0;

  const temperatureScore = scoreTemperature(temp);
  const humidityScore = scoreHumidity(humidity);
  const windScore = scoreWind(windSpeed);
  const visibilityScore = scoreVisibility(visibilityKm);

  const comfortScore = Math.round((temperatureScore + humidityScore + windScore + visibilityScore) / 4 - (rainMm > 5 ? 15 : rainMm > 1 ? 8 : 0));
  // Trend stays scale-consistent by always comparing OpenWeatherMap's own current
  // vs. forecast AQI (both 1-5) — independent of which source supplies the headline
  // `aqi` number above, since Google's CPCB scale and OWM's 1-5 scale can't be
  // diffed against each other directly.
  const trendDelta = (owmCurrentAqi || forecastAqiAvg) ? (owmCurrentAqi || forecastAqiAvg) - (forecastAqiAvg || owmCurrentAqi) : 0;
  const trendScore = clamp(Math.round(50 + trendDelta * 20));
  const trendLabel = getTrendLabel(trendDelta);

  const overall = Math.round(
    (airQualityScore * 0.35) +
    (pollutantExposureScore * 0.20) +
    (comfortScore * 0.25) +
    (trendScore * 0.20)
  );

  const summary = buildSummary({
    aqi: headlineAqi,
    aqiLabel,
    weather: temp !== null ? { temp, humidity } : null,
    forecastTrend: trendLabel,
  });

  const recommendations = buildRecommendations({ airQualityScore, comfortScore, trendLabel });

  return {
    overall: clamp(overall),
    aqi: headlineAqi || null,
    aqiLabel,
    airQualityScore,
    pollutantExposureScore,
    comfortScore: clamp(comfortScore),
    trendScore,
    trendLabel,
    pollutants,
    weather: weatherData
      ? {
          temp: weatherData.main?.temp ?? null,
          feelsLike: weatherData.main?.feels_like ?? null,
          humidity: weatherData.main?.humidity ?? null,
          windSpeed: weatherData.wind?.speed ?? null,
          visibilityKm: visibilityKm ?? null,
          description: weatherData.weather?.[0]?.description ?? null,
          clouds: weatherData.clouds?.all ?? null,
          rainMm,
        }
      : null,
    forecast: {
      avgAqi24h: forecastAqiAvg ?? null,
      trend: trendLabel,
    },
    summary,
    recommendations,
    source: usingGoogle ? 'Google Air Quality API + OpenWeatherMap' : 'OpenWeatherMap',
    lastUpdated: new Date().toISOString(),
  };
};

const normalizeCoordinates = (input) => {
  const coordinates = Array.isArray(input)
    ? input
    : input?.location?.coordinates || input?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = coordinates;
  if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return null;
  }

  return [Number(lat), Number(lng)];
};

const fetchWeatherPayload = async (lat, lng) => {
  const requestConfig = {
    timeout: 4000,
    params: {
      lat,
      lon: lng,
      appid: OPENWEATHERMAP_API_KEY,
    },
  };

  // Google Air Quality API is fetched alongside OpenWeatherMap regardless — it's
  // the preferred AQI source, with OpenWeatherMap's air_pollution endpoint kept as
  // a same-call fallback (and as the scale-consistent input for the trend calc).
  const [weatherResult, pollutionResult, forecastResult, googleAqiResult] = await Promise.allSettled([
    OPENWEATHERMAP_API_KEY
      ? axios.get(`${OPENWEATHERMAP_BASE_URL}/weather`, { ...requestConfig, params: { ...requestConfig.params, units: 'metric' } })
      : Promise.resolve(null),
    OPENWEATHERMAP_API_KEY
      ? axios.get(`${OPENWEATHERMAP_BASE_URL}/air_pollution`, requestConfig)
      : Promise.resolve(null),
    OPENWEATHERMAP_API_KEY
      ? axios.get(`${OPENWEATHERMAP_BASE_URL}/air_pollution/forecast`, requestConfig)
      : Promise.resolve(null),
    getGoogleAirQuality(lat, lng),
  ]);

  const weatherData = weatherResult.status === 'fulfilled' ? weatherResult.value?.data ?? null : null;
  const pollutionData = pollutionResult.status === 'fulfilled' ? pollutionResult.value?.data ?? null : null;
  const forecastData = forecastResult.status === 'fulfilled' ? forecastResult.value?.data ?? null : null;
  const googleAqi = googleAqiResult.status === 'fulfilled' ? googleAqiResult.value : null;

  const owmCurrentAqi = pollutionData?.list?.[0]?.main?.aqi ?? null;
  const owmPollutionComponents = pollutionData?.list?.[0]?.components || null;
  const forecastAqiAvg = getForecastAqiAverage(forecastData?.list || []);

  if (!weatherData && !pollutionData && !forecastData && !googleAqi) {
    return null;
  }

  return scoreEnvironment({
    googleAqi,
    owmCurrentAqi,
    owmPollutionComponents,
    weatherData,
    forecastAqiAvg,
  });
};

async function getEnvironmentalInsights(input) {
  if (!OPENWEATHERMAP_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
    console.warn('[Weather] Neither OPENWEATHERMAP_API_KEY nor GOOGLE_MAPS_API_KEY is configured. Skipping environmental scoring.');
    return null;
  }

  const coordinates = normalizeCoordinates(input);
  if (!coordinates) {
    return null;
  }

  const [lat, lng] = coordinates;
  const cacheKey = `${roundCoordinate(lat)},${roundCoordinate(lng)}`;
  const cached = environmentCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const data = await fetchWeatherPayload(lat, lng);
    if (!data) {
      return null;
    }

    environmentCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return data;
  } catch (error) {
    console.error('[Weather] Failed to fetch environmental insights:', error.message);
    return null;
  }
}

module.exports = {
  getEnvironmentalInsights,
};