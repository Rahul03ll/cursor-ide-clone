import React from 'react';

interface LoadingAnimationProps {
  text?: string;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  text = 'Loading preview...', 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-primary animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-r-4 border-l-4 border-secondary animate-spin animate-reverse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-t-4 border-primary animate-ping opacity-75"></div>
        </div>
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{text}</p>
      )}
    </div>
  );
};

export default LoadingAnimation;
