import React from 'react';
import { formatPrice } from '../../utils/formatters';

export default function ComparisonCard({ property }) {
  const score = property.aiScore?.overall || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <h3 className="text-lg font-semibold line-clamp-2">{property.title}</h3>
        <p className="text-sm text-blue-100 mt-1">{property.location?.address}</p>
      </div>

      {/* Score */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">{score}</div>
          <div className="text-xs text-gray-600">Overall Score</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Price */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-600 mb-1">Price</div>
          <div className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</div>
          {property.pricePerSqFt && (
            <div className="text-xs text-gray-600 mt-1">₹{property.pricePerSqFt}/sqft</div>
          )}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-xs text-gray-600">Type</div>
            <div className="font-semibold">{property.propertyType}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-xs text-gray-600">Listing</div>
            <div className="font-semibold">{property.listingType}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-xs text-gray-600">BHK</div>
            <div className="font-semibold">{property.specifications?.bedrooms || '-'}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-xs text-gray-600">Bathrooms</div>
            <div className="font-semibold">{property.specifications?.bathrooms || '-'}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded col-span-2">
            <div className="text-xs text-gray-600">Area</div>
            <div className="font-semibold">{property.specifications?.carpetArea || '-'} sqft</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded border border-green-200">
          <div className="text-xs font-semibold text-gray-900 mb-2">Score Breakdown</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Location</span>
              <span className="font-semibold text-green-600">{property.aiScore?.locationScore || '--'}/100</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Connectivity</span>
              <span className="font-semibold text-green-600">{property.aiScore?.connectivityScore || '--'}/100</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Amenities</span>
              <span className="font-semibold text-green-600">{property.aiScore?.amenitiesScore || '--'}/100</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">ROI Potential</span>
              <span className="font-semibold text-green-600">{property.aiScore?.roiPotential || '--'}/100</span>
            </div>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-900 mb-2">Amenities</div>
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 5).map((amenity, idx) => (
                <span key={idx} className="badge-success text-xs">
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 5 && (
                <span className="badge-primary text-xs">
                  +{property.amenities.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{property.views || 0}</div>
            <div className="text-xs text-gray-600">Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{property.saves || 0}</div>
            <div className="text-xs text-gray-600">Saves</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{property.inquiries || 0}</div>
            <div className="text-xs text-gray-600">Inquiries</div>
          </div>
        </div>

        {/* Action */}
        <button className="w-full btn-primary">
          Contact Seller
        </button>
      </div>
    </div>
  );
}
