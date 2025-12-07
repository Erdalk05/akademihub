'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Yükleniyor...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
      {/* Ana spinner */}
      <div className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
      
      {/* Yükleme metni */}
      <p className="mt-4 text-gray-600 font-medium animate-pulse">{text}</p>
      
      {/* AkademiHub logosu */}
      <div className="mt-8 flex items-center space-x-2 animate-fadeIn">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AH</span>
        </div>
        <span className="text-xl font-bold gradient-text">AkademiHub</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
