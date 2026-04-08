import api from './api';

const sellerService = {
  getInsights: async (sellerId, options = {}) => {
    if (!sellerId) {
      throw new Error('sellerId is required to fetch insights');
    }
    const response = await api.get('/seller/insights', {
      params: { sellerId, ...options },
    });
    return response.data;
  },

  getPropertyInsight: async (propertyId, sellerId) => {
    if (!sellerId) {
      throw new Error('sellerId is required to fetch property insight');
    }
    if (!propertyId) {
      throw new Error('propertyId is required to fetch property insight');
    }
    const response = await api.get(`/seller/insights/${propertyId}`, {
      params: { sellerId },
    });
    return response.data;
  },

  resolveSuggestion: async (propertyId, suggestionId, sellerId) => {
    if (!sellerId) {
      throw new Error('sellerId is required to resolve suggestion');
    }
    if (!propertyId || !suggestionId) {
      throw new Error('propertyId and suggestionId are required');
    }
    const response = await api.patch(
      `/seller/insights/${propertyId}/suggestions/${suggestionId}/resolve`,
      { sellerId }
    );
    return response.data;
  },

  getAnalytics: async (sellerId) => {
    if (!sellerId) {
      throw new Error('sellerId is required to fetch analytics');
    }
    const response = await api.get('/seller/analytics', {
      params: { sellerId },
    });
    return response.data;
  },

  getMyProperties: async (sellerId) => {
    if (!sellerId) {
      throw new Error('sellerId is required to fetch properties');
    }
    const response = await api.get('/seller/properties', {
      params: { sellerId },
    });
    return response.data;
  },
};

export default sellerService;
