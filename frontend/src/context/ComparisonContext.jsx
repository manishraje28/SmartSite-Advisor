import React, { createContext, useState, useCallback, useEffect } from 'react';

export const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('comparisonProperties');
    if (saved) {
      try {
        setSelectedPropertyIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading comparison from localStorage:', e);
      }
    }
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem('comparisonProperties', JSON.stringify(selectedPropertyIds));
  }, [selectedPropertyIds]);

  const addToComparison = useCallback((propertyId) => {
    setSelectedPropertyIds(prev => {
      if (prev.length >= 4 || prev.includes(propertyId)) return prev;
      return [...prev, propertyId];
    });
  }, []);

  const removeFromComparison = useCallback((propertyId) => {
    setSelectedPropertyIds(prev => prev.filter(id => id !== propertyId));
  }, []);

  const clearComparison = useCallback(() => {
    setSelectedPropertyIds([]);
  }, []);

  const isSelected = useCallback((propertyId) => {
    return selectedPropertyIds.includes(propertyId);
  }, [selectedPropertyIds]);

  const value = {
    selectedPropertyIds,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isSelected,
    count: selectedPropertyIds.length,
    canAdd: selectedPropertyIds.length < 4
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = React.useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
};

export default ComparisonContext;
