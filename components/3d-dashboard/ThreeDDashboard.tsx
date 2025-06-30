'use client';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import FallbackGlobe from './FallbackGlobe';

// Import Three.js components dynamically to avoid SSR issues
const EarthGlobe = dynamic(() => import('./EarthGlobe'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Loading 3D Globe...</p>
      </div>
    </div>
  )
});

const ThreeDDashboard = () => {
  const [isClient, setIsClient] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Only render the 3D globe on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Check if WebGL is available
    try {
      const canvas = document.createElement('canvas');
      const isSupported = !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebGLSupported(isSupported);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading 3D Globe...</p>
        </div>
      </div>
    );
  }

  // Use fallback if WebGL is not supported
  if (!webGLSupported) {
    return <FallbackGlobe />;
  }

  return (
    <div className='w-full h-full'>
      <EarthGlobe />
    </div>
  );
};

export default ThreeDDashboard; 