import Badge from '../common/Badge';

export default function MetricCard({ label, value, icon, indicator, indicatorText, className = '' }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase text-gray-700 tracking-wide mb-1">
            {label}
          </p>
          <div className="text-4xl font-bold text-primary-600">
            {value}
          </div>
        </div>
        {icon && (
          <div className="text-3xl">
            {icon}
          </div>
        )}
      </div>

      {indicator && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${indicator === 'positive' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
          <span className="text-xs text-gray-700 font-medium">
            {indicatorText}
          </span>
        </div>
      )}
    </div>
  );
}
