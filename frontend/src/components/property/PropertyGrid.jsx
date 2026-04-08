import React from 'react';
import PropertyCard from './PropertyCard';

export default function PropertyGrid({ properties, loading, error, onCompare, selectedIds }) {
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button className="btn-primary">Try Again</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="property-grid">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="card h-96 bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No properties found</p>
        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="property-grid">
      {properties.map(property => (
        <PropertyCard
          key={property._id}
          property={property}
          onCompare={onCompare}
          isSelected={selectedIds.includes(property._id)}
        />
      ))}
    </div>
  );
}
