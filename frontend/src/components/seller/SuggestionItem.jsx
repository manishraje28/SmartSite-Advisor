import React from 'react';
import { getSuggestionPriorityClass } from '../../utils/formatters';

export default function SuggestionItem({ suggestion, onResolve, isResolving }) {
  const getPriorityEmoji = (priority) => {
    const emojis = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return emojis[priority] || '⚪';
  };

  return (
    <div className={`p-3 rounded border-l-4 mb-2 ${
      suggestion.isResolved
        ? 'bg-gray-50 border-gray-400 opacity-60'
        : 'bg-blue-50 border-blue-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getPriorityEmoji(suggestion.priority)}</span>
            <span className={`badge text-xs  ${getSuggestionPriorityClass(suggestion.priority)}`}>
              {suggestion.priority.toUpperCase()}
            </span>
            <span className="text-xs text-gray-600">{suggestion.type}</span>
          </div>
          <p className="text-sm text-gray-800 mb-1">{suggestion.message}</p>
          {suggestion.impact && (
            <p className="text-xs text-green-600 font-semibold">
              Expected Impact: +{suggestion.impact}%
            </p>
          )}
          {suggestion.isResolved && (
            <p className="text-xs text-gray-500 mt-1">
              ✓ Resolved on {new Date(suggestion.resolvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {!suggestion.isResolved && (
          <button
            onClick={() => onResolve(suggestion._id)}
            disabled={isResolving}
            className="btn-primary text-xs px-2 py-1 ml-2 whitespace-nowrap"
          >
            {isResolving ? 'Resolving...' : 'Resolve'}
          </button>
        )}
      </div>
    </div>
  );
}
