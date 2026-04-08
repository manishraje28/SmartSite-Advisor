export default function Badge({ children, variant = 'primary', className = '', icon = null }) {
  const variants = {
    primary: 'badge-primary',
    accent: 'badge-accent',
    emphasis: 'badge-emphasis',
    success: 'badge-success',
    danger: 'badge-danger',
  };

  return (
    <span className={`badge-base ${variants[variant]} ${className}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}
