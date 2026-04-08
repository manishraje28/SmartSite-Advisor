import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching data from API
 * @param {string} url - API endpoint (or null to skip fetching)
 * @param {object} options - Axios request options (params, etc)
 * @param {array} dependencies - Dependencies for useEffect
 * @returns {object} - { data, loading, error, refetch }
 */
export const useFetch = (url, options = {}, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    // Skip fetch if url is not provided
    if (!url) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(url, options);
      setData(response.data.data || response.data); // Handle both API response formats
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies.length > 0 ? dependencies : [url]);

  const refetch = async () => {
    await fetchData();
  };

  return { data, loading, error, refetch };
};

export default useFetch;
