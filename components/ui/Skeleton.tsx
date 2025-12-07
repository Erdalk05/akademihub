'use client';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  animate = true
}) => {
  const baseClasses = 'bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const skeletonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${animate ? 'animate-pulse' : ''}
    ${className}
  `.trim();

  return (
    <div className={skeletonClasses} style={{ width, height }} />
  );
};

// Önceden tanımlanmış skeleton bileşenleri
export const SkeletonCard: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <Skeleton height="1.5rem" width="60%" className="mb-4" />
    <Skeleton height="2rem" width="40%" className="mb-2" />
    <Skeleton height="1rem" width="80%" />
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <Skeleton height="1.5rem" width="30%" className="mb-6" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4 mb-4">
        <Skeleton height="1rem" width="20%" />
        <Skeleton height="1rem" width="30%" />
        <Skeleton height="1rem" width="25%" />
        <Skeleton height="1rem" width="25%" />
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <Skeleton height="1.5rem" width="40%" className="mb-6" />
    <div className="flex items-end space-x-2 h-64">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={`${Math.random() * 200 + 100}px`} width="60px" />
      ))}
    </div>
  </div>
);

export default Skeleton;
