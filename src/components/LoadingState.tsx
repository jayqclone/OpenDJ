import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Generating your playlist' }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-spotify border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute top-2 left-2 w-16 h-16 border-4 border-t-apple border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-medium mb-2">{message}</h2>
      <p className="text-light-200 text-center max-w-md">
        Our AI is analyzing your prompt and curating the perfect selection of tracks...
      </p>
      
      <div className="mt-8 flex space-x-2 loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default LoadingState;