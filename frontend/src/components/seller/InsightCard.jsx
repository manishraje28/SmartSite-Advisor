import React, { useState } from 'react';
import { formatPrice, getScoreBadgeClass, getDemandLevelText, getDemandLevelColor } from '../../utils/formatters';
import SuggestionItem from './SuggestionItem';

export default function InsightCard({ insight, onResolveSuggestion, resolvingId }) {
  const [expanded, setExpanded] = useState(false);
  const score = insight.currentScore?.overall || 0;
  const topSuggestions = insight.improvementSuggestions?.slice(0, 2) || [];

  return (
    <div className="card hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <h3 className="text-lg font-semibold line-clamp-2">
          {insight.property?.title}
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          {insight.property?.location?.address}
        </p>
      </div>

      {/* Main Info */}
      <div className="p-4">
        {/* Score & Demand Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Score */}
          <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded border border-green-200">
            <div className="text-xs text-gray-600 mb-1">Overall Score</div>
            <div className="text-3xl font-bold text-green-600">{score}</div>
            <div className="text-xs text-gray-600">/100</div>
          </div>

          {/* Demand */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Demand</div>
            <div className={`text-sm font-semibold px-2 py-1 rounded inline-block ${getDemandLevelColor(insight.demandLevel)}`}>
              {getDemandLevelText(insight.demandLevel)}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-xs font-semibold text-gray-900 mb-2">Score Breakdown</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-semibold text-blue-600">{insight.currentScore?.locationScore || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Connectivity:</span>
              <span className="font-semibold text-blue-600">{insight.currentScore?.connectivityScore || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amenities:</span>
              <span className="font-semibold text-blue-600">{insight.currentScore?.amenitiesScore || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ROI:</span>
              <span className="font-semibold text-blue-600">{insight.currentScore?.roiPotential || '--'}</span>
            </div>
          </div>
        </div>

        {/* Demand Stats */}
        {insight.demandStats && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs font-semibold text-gray-900 mb-2">Engagement</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-semibold text-blue-600">{insight.demandStats.totalViews || 0}</div>
                <div className="text-gray-600">Views</div>
              </div>
              <div>
                <div className="font-semibold text-blue-600">{insight.demandStats.totalSaves || 0}</div>
                <div className="text-gray-600">Saves</div>
              </div>
              <div>
                <div className="font-semibold text-blue-600">{insight.demandStats.totalInquiries || 0}</div>
                <div className="text-gray-600">Inquiries</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Suggestions */}
        {topSuggestions.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-900 mb-2">Top Suggestions</div>
            {topSuggestions.map((suggestion) => (
              <div key={suggestion._id} className="text-xs bg-yellow-50 border-l-4 border-yellow-500 p-2 mb-2">
                <div className="font-semibold text-yellow-900 mb-1">{suggestion.message}</div>
                {suggestion.impact && (
                  <div className="text-yellow-700">Expected impact: +{suggestion.impact}%</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pricing Recommendation */}
        {insight.optimalPriceRange && (
          <div className="mb-4 p-3 bg-purple-50 rounded border border-purple-200">
            <div className="text-xs font-semibold text-gray-900 mb-2">Price Recommendation</div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Optimal Range:</span>
              <span className="font-semibold text-purple-600">
                {formatPrice(insight.optimalPriceRange.min * 100000)} - {formatPrice(insight.optimalPriceRange.max * 100000)}
              </span>
            </div>
            {insight.rentVsSellRecommendation && (
              <div className="text-xs text-purple-700">
                Recommendation: <strong>{insight.rentVsSellRecommendation.toUpperCase()}</strong>
              </div>
            )}
          </div>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border-t border-gray-200 mt-4"
        >
          {expanded ? '▼ Hide Details' : '▶ View Full Insights'}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* Buyer Segment Match */}
            {insight.buyerSegmentMatch && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-900 mb-2">Buyer Segment Match</div>
                <div className="space-y-1 text-xs">
                  {['family', 'investor', 'student', 'bachelor', 'retiree'].map((segment) => (
                    <div key={segment} className="flex justify-between">
                      <span className="capitalize text-gray-600">{segment}:</span>
                      <span className="font-semibold">{insight.buyerSegmentMatch[segment] || 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Suggestions */}
            {insight.improvementSuggestions && insight.improvementSuggestions.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-900 mb-2">All Suggestions ({insight.improvementSuggestions.length})</div>
                {insight.improvementSuggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion._id}
                    suggestion={suggestion}
                    onResolve={() => onResolveSuggestion(insight.property._id, suggestion._id)}
                    isResolving={resolvingId === suggestion._id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
