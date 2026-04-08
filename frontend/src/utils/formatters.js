/**
 * Format price to Indian Rupee format
 * ₹95,00,000 or ₹1.5Cr
 */
export const formatPrice = (price) => {
  if (!price) return '₹0';

  const crore = 10000000;
  const lakh = 100000;

  if (price >= crore) {
    const cr = (price / crore).toFixed(2);
    return `₹${cr}Cr`;
  } else if (price >= lakh) {
    const lk = (price / lakh).toFixed(2);
    return `₹${lk}L`;
  } else {
    return `₹${price.toLocaleString('en-IN')}`;
  }
};

/**
 * Get score badge color based on value
 */
export const getScoreBadgeClass = (score) => {
  if (score >= 80) return 'score-excellent'; // Green
  if (score >= 70) return 'score-good';       // Blue
  if (score >= 60) return 'score-fair';       // Yellow
  return 'score-low';                         // Red
};

/**
 * Get demand level text
 */
export const getDemandLevelText = (level) => {
  const levels = {
    'very_low': 'Very Low',
    'low': 'Low',
    'moderate': 'Moderate',
    'high': 'High',
    'very_high': 'Very High'
  };
  return levels[level] || level;
};

/**
 * Get demand level color
 */
export const getDemandLevelColor = (level) => {
  const colors = {
    'very_low': 'text-red-600 bg-red-100',
    'low': 'text-orange-600 bg-orange-100',
    'moderate': 'text-yellow-600 bg-yellow-100',
    'high': 'text-green-600 bg-green-100',
    'very_high': 'text-green-700 bg-green-200'
  };
  return colors[level] || 'text-gray-600 bg-gray-100';
};

/**
 * Format suggestion priority badge
 */
export const getSuggestionPriorityClass = (priority) => {
  const priorities = {
    'high': 'badge-danger',   // Red
    'medium': 'badge-warning', // Yellow
    'low': 'badge-success'     // Green
  };
  return priorities[priority] || 'badge-primary';
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, length = 100) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Format property type
 */
export const formatPropertyType = (type) => {
  return type || 'N/A';
};

/**
 * Format listing type
 */
export const formatListingType = (type) => {
  return type || 'N/A';
};
