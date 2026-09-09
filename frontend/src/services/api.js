import axios from 'axios';

const RAW_API_BASE =
  import.meta.env.VITE_APP_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api';

const API_BASE = RAW_API_BASE.replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Don't redirect here — let AuthContext handle it
    }
    return Promise.reject(error);
  }
);

// ── Auth API ────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  getMe: () => api.get('/auth/me'),
};

// ── Property API ────────────────────────────
export const propertyAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  saveProperty: (id) => api.post(`/properties/${id}/save`),
};

// ── Buyer API ───────────────────────────────
export const buyerAPI = {
  getPreferences: (buyerId) => api.get('/buyer/preferences', { params: { buyerId } }),
  savePreferences: (data) => api.post('/buyer/preferences', data),
  updatePreferences: (data) => api.patch('/buyer/preferences', data),
  getMatches: (params) => api.get('/buyer/matches', { params }),
  compareProperties: (data) => api.post('/buyer/compare', data),
  explainComparison: (data) => api.post('/buyer/explain', data),
};

// ── Seller API ──────────────────────────────
export const sellerAPI = {
  getInsights: (params) => api.get('/seller/insights', { params }),
  getPropertyInsight: (propertyId, sellerId) => api.get(`/seller/insights/${propertyId}`, { params: { sellerId } }),
  resolveSuggestion: (propertyId, suggestionId, sellerId) =>
    api.patch(`/seller/insights/${propertyId}/suggestions/${suggestionId}/resolve`, { sellerId }),
  getAnalytics: (sellerId) => api.get('/seller/analytics', { params: { sellerId } }),
};

// ── Agentic AI Swarm API ─────────────────────
export const agentAPI = {
  profileBuyer: (data) => api.post('/agents/profile', data),
  evaluateValuation: (data) => api.post('/agents/valuation', data),
  evaluateGeoSpatial: (data) => api.post('/agents/geospatial', data),
  strategizeNegotiation: (data) => api.post('/agents/negotiate', data),
  evaluateUpgrade: (data) => api.post('/agents/upgrade', data),
  runDebate: (data) => api.post('/agents/debate', data),
  harvestListings: (data) => api.post('/agents/scrape/search', data),
  syncSingleProperty: (propertyId) => api.post(`/agents/scrape/sync/${propertyId}`),
};

export default api;
