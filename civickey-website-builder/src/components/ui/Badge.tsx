interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}20`, color }
    : undefined;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        !color ? 'bg-gray-100 text-gray-700' : ''
      } ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
