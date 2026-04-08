import { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, type = 'text', placeholder, helperText, disabled = false, className = '', ...props }, ref) => {
    return (
      <div className="mb-6">
        {label && (
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-base ${error ? 'border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''} ${className}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
