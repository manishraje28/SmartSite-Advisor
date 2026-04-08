import React, { useState } from 'react';
import { formatPrice } from '../../utils/formatters';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Shop'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Recently Listed' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-aiScore.overall', label: 'Score: High to Low' }
];

export default function PropertyFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minPrice: 0,
    maxPrice: 100000000,
    sort: 'createdAt'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      city: '',
      propertyType: '',
      minPrice: 0,
      maxPrice: 100000000,
      sort: 'createdAt'
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  return (
    <div className="card-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Search Filters</h3>
        <button
          onClick={handleReset}
          className="text-orange-600 hover:text-primary-600 font-semibold text-sm transition flex items-center gap-1"
        >
          🔄 Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="e.g., Mumbai"
            className="input-base w-full"
          />
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Property Type
          </label>
          <select
            name="propertyType"
            value={filters.propertyType}
            onChange={handleChange}
            className="input-base w-full"
          >
            <option value="">All Types</option>
            {PROPERTY_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Min Price
          </label>
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder="0"
            className="input-base w-full"
          />
          <p className="text-xs text-gray-600 mt-1">{formatPrice(filters.minPrice)}</p>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Max Price
          </label>
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder="100000000"
            className="input-base w-full"
          />
          <p className="text-xs text-gray-600 mt-1">{formatPrice(filters.maxPrice)}</p>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Sort By
          </label>
          <select
            name="sort"
            value={filters.sort}
            onChange={handleChange}
            className="input-base w-full"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
