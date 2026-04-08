import React from 'react';
import { formatPrice, getScoreBadgeClass } from '../../utils/formatters';
import Button from '../common/Button';

export default function PropertyCard({ property, onCompare, isSelected }) {
  const score = property.aiScore?.overall || 0;
  const images = property.images?.[0] || '/property-placeholder.jpg';

  return (
    <div className="card-base overflow-hidden hover:shadow-lg transition-all group">
      {/* Image Container */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        <img
          src={images}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Score Badge */}
        <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-1">
          ⭐ {score}/100
        </div>

        {/* Selection Checkbox */}
        <label className="absolute top-4 left-4 flex items-center justify-center w-6 h-6 bg-white rounded border-2 cursor-pointer transition-all"
               style={{ borderColor: isSelected ? '#ff6b35' : '#ccc' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onCompare(property._id)}
            className="hidden"
          />
          {isSelected && <span className="text-orange-600 font-bold">✓</span>}
        </label>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title & Location */}
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition">
          {property.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-1">
          📍 {property.location?.address || 'Location not specified'}
        </p>

        {/* Price */}
        <div className="text-2xl font-bold text-orange-600 mb-4">
          {formatPrice(property.price)}
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-600 font-semibold mb-1">BHK</div>
            <div className="text-lg font-bold text-gray-900">{property.specifications?.bedrooms || '–'}</div>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">AREA</div>
            <div className="text-sm font-bold text-gray-900">{property.specifications?.carpetArea ? `${(property.specifications.carpetArea / 100).toFixed(0)}² ft` : '–'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 font-semibold mb-1">TYPE</div>
            <div className="text-sm font-bold text-gray-900 truncate">{property.propertyType}</div>
          </div>
        </div>

        {/* AI Score Breakdown */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-900 mb-2 uppercase">AI Score Breakdown</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-700">📍 Location</span>
              <span className="font-bold text-gray-900">{property.aiScore?.locationScore || '–'}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">🚗 Connectivity</span>
              <span className="font-bold text-gray-900">{property.aiScore?.connectivityScore || '–'}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">🏢 Amenities</span>
              <span className="font-bold text-gray-900">{property.aiScore?.amenitiesScore || '–'}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">📈 ROI Potential</span>
              <span className="font-bold text-gray-900">{property.aiScore?.roiPotential || '–'}/100</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-sm"
          >
            💬 Contact
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 text-sm"
          >
            👁️ Details
          </Button>
        </div>
      </div>
    </div>
  );
}
