export default function FeatureCard({ icon, title, description, highlighted = false }) {
  return (
    <div
      className={`card-base p-8 text-center transition-all duration-300 ${
        highlighted ? 'bg-gradient-accent border-2 border-orange-500' : ''
      }`}
    >
      {icon && (
        <div className="text-5xl mb-6 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-700 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
