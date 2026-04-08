import React from 'react';

export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  if (startPage > 1) {
    pages.push(
      <button
        key="1"
        onClick={() => onPageChange(1)}
        className="px-3 py-2 rounded-lg text-primary-600 font-semibold hover:bg-gray-100 transition"
      >
        1
      </button>
    );
    if (startPage > 2) {
      pages.push(<span key="dots1" className="px-2 text-gray-600">...</span>);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`px-3 py-2 rounded-lg font-semibold transition ${
          page === i
            ? 'bg-orange-500 text-white shadow-lg'
            : 'text-orange-600 hover:bg-gray-100'
        }`}
      >
        {i}
      </button>
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(<span key="dots2" className="px-2 text-gray-600">...</span>);
    }
    pages.push(
      <button
        key={totalPages}
        onClick={() => onPageChange(totalPages)}
        className="px-3 py-2 rounded-lg text-primary-600 font-semibold hover:bg-gray-100 transition"
      >
        {totalPages}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 my-12">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          page === 1
            ? 'text-gray-500 cursor-not-allowed opacity-50'
            : 'text-orange-600 hover:bg-gray-100'
        }`}
      >
        ← Previous
      </button>

      <div className="flex gap-2 flex-wrap justify-center">
        {pages}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          page === totalPages
            ? 'text-gray-500 cursor-not-allowed opacity-50'
            : 'text-orange-600 hover:bg-gray-100'
        }`}
      >
        Next →
      </button>

      <div className="ml-6 text-sm text-gray-600 font-semibold whitespace-nowrap">
        Page <span className="text-gray-900 font-bold">{page}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
      </div>
    </div>
  );
}
