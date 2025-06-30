'use client';
import React from 'react';

const FallbackGlobe = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      <div className="text-center p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4">3D Globe Unavailable</h2>
        <div className="mb-6 relative w-48 h-48 mx-auto rounded-full bg-blue-900 border-4 border-blue-700 overflow-hidden">
          {/* Simple CSS-based globe representation */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-900 opacity-70"></div>
          <div className="absolute inset-0">
            {/* Land masses */}
            <div className="absolute w-12 h-8 bg-green-700 rounded-full blur-sm" style={{ top: '30%', left: '20%' }}></div>
            <div className="absolute w-16 h-10 bg-green-700 rounded-full blur-sm" style={{ top: '25%', left: '60%' }}></div>
            <div className="absolute w-20 h-6 bg-green-700 rounded-full blur-sm" style={{ top: '60%', left: '40%' }}></div>
            <div className="absolute w-10 h-10 bg-green-700 rounded-full blur-sm" style={{ top: '70%', left: '70%' }}></div>
          </div>
          {/* Clouds */}
          <div className="absolute w-14 h-4 bg-white rounded-full blur-sm opacity-40" style={{ top: '20%', left: '30%' }}></div>
          <div className="absolute w-10 h-3 bg-white rounded-full blur-sm opacity-40" style={{ top: '40%', left: '65%' }}></div>
          <div className="absolute w-12 h-3 bg-white rounded-full blur-sm opacity-40" style={{ top: '65%', left: '25%' }}></div>
        </div>
        <p className="mb-4">
          Your browser or device doesn't support WebGL, which is required for the 3D globe visualization.
        </p>
        <p className="text-sm text-gray-400">
          Try using a modern browser like Chrome, Firefox, or Edge on a desktop computer.
        </p>
      </div>
    </div>
  );
};

export default FallbackGlobe; 