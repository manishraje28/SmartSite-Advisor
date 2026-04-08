export default function Card({ children, className = '', variant = 'default', hover = true, ...props }) {
  const variants = {
    default: 'card',
    large: 'card-lg',
    accent: 'card bg-gradient-accent',
    flat: 'bg-gray-50 rounded-lg border border-gray-200 p-6',
  };

  return (
    <div
      className={`${variants[variant]} ${!hover ? 'hover:shadow-sm hover:translate-y-0' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
