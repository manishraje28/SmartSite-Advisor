import api from './api';

const buyerService = {
  getPreferences: async (buyerId) => {
    if (!buyerId) {
      throw new Error('buyerId is required to fetch preferences');
    }
    const response = await api.get('/buyer/preferences', {
      params: { buyerId },
    });
    return response.data;
  },

  savePreferences: async (preferencesData) => {
    const response = await api.post('/buyer/preferences', preferencesData);
    return response.data;
  },

  updatePreferences: async (preferencesData) => {
    const response = await api.patch('/buyer/preferences', preferencesData);
    return response.data;
  },

  getRecommendations: async (buyerId, limit = 10, offset = 0) => {
    const response = await api.get('/buyer/recommendations', {
      params: { buyerId, limit, offset },
    });
    return response.data;
  },

  saveProperty: async (buyerId, propertyId) => {
    const response = await api.post(`/buyer/saved/${propertyId}`, { buyerId });
    return response.data;
  },

  unsaveProperty: async (buyerId, propertyId) => {
    const response = await api.delete(`/buyer/saved/${propertyId}`, {
      params: { buyerId },
    });
    return response.data;
  },

  getSavedProperties: async (buyerId) => {
    const response = await api.get('/buyer/saved', { params: { buyerId } });
    return response.data;
  },
};

export default buyerService;
