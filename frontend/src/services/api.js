import axios from 'axios';

const API_BASE = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:3001/api';

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
  getMe: () => api.get('/auth/me'),
};

// ── Property API ────────────────────────────
export const propertyAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
};

// ── Buyer API ───────────────────────────────
export const buyerAPI = {
  getPreferences: (buyerId) => api.get('/buyer/preferences', { params: { buyerId } }),
  savePreferences: (data) => api.post('/buyer/preferences', data),
  updatePreferences: (data) => api.patch('/buyer/preferences', data),
  getMatches: (params) => api.get('/buyer/matches', { params }),
  compareProperties: (data) => api.post('/buyer/compare', data),
};

// ── Seller API ──────────────────────────────
export const sellerAPI = {
  getInsights: (params) => api.get('/seller/insights', { params }),
  getPropertyInsight: (propertyId, sellerId) => api.get(`/seller/insights/${propertyId}`, { params: { sellerId } }),
  resolveSuggestion: (propertyId, suggestionId, sellerId) =>
    api.patch(`/seller/insights/${propertyId}/suggestions/${suggestionId}/resolve`, { sellerId }),
  getAnalytics: (sellerId) => api.get('/seller/analytics', { params: { sellerId } }),
};

export default api;
