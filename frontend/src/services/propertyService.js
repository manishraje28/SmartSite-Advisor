import api from './api';

const propertyService = {
  getAllProperties: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response.data;
  },

  getPropertyById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (propertyData) => {
    const response = await api.post('/properties', propertyData);
    return response.data;
  },

  updateProperty: async (id, propertyData) => {
    const response = await api.patch(`/properties/${id}`, propertyData);
    return response.data;
  },

  deleteProperty: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  searchProperties: async (query) => {
    const response = await api.get('/properties/search', { params: { q: query } });
    return response.data;
  },

  getProperties: async (ids) => {
    try {
      const responses = await Promise.all(
        ids.map(id => api.get(`/properties/${id}`))
      );
      return responses.map(r => r.data.data || r.data);
    } catch (error) {
      throw error;
    }
  },
};

export default propertyService;
