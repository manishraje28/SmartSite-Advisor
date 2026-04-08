import Button from '../common/Button';
import Badge from '../common/Badge';

export default function RecommendationCard({
  property,
  score,
  reasons = [],
  onViewDetails,
  onCompare
}) {
  return (
    <div className="card-lg bg-gradient-accent border-2 border-orange-500">
      {/* Best Choice Badge */}
      <div className="mb-6">
        <Badge variant="accent" icon="🏆">
          Best Choice
        </Badge>
      </div>

      {/* Property Info */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {property?.title}
      </h3>
      <p className="text-gray-700 mb-6">
        {property?.location?.address}
      </p>

      {/* Price & Rating */}
      <div className="flex items-baseline gap-4 mb-8">
        <div className="text-4xl font-bold text-orange-600">
          ₹{property?.price ? (property.price / 10000000).toFixed(2) : 'N/A'}Cr
        </div>
        <div>
          <div className="text-2xl text-primary-600">⭐⭐⭐⭐⭐</div>
          <div className="text-lg font-bold text-primary-600">
            {score}/100
          </div>
        </div>
      </div>

      {/* Why Section */}
      <div className="mb-8">
        <h4 className="font-bold text-gray-900 mb-3 uppercase text-xs">
          Why We Chose This
        </h4>
        <div className="space-y-2">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-lg leading-none">✓</span>
              <span className="text-gray-700">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={onViewDetails}
          className="flex-1"
        >
          View Details
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onCompare}
          className="flex-1"
        >
          Compare
        </Button>
      </div>
    </div>
  );
}
