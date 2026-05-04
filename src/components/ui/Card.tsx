interface CardProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', borderColor = 'border-gray-800', hoverable = false }: CardProps) {
  return (
    <div
      className={`bg-arena-gray rounded-xl p-5 border transition-all duration-200 ${borderColor} ${
        hoverable ? 'hover:border-gray-600 hover:shadow-lg hover:shadow-black/20' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
