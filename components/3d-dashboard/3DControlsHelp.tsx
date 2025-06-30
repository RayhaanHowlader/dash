'use client';
import React, { useState } from 'react';

const ThreeDControlsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHelp = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="absolute top-20 right-4 z-50">
      {/* Help Button */}
      <button
        onClick={toggleHelp}
        className="bg-[#1e293b] p-3 rounded-full shadow-lg border border-[#334155] hover:bg-[#334155] text-white"
        aria-label="3D controls help"
        title="View 3D controls"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Help Content */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e293b] rounded-lg shadow-xl border border-[#334155] p-4 text-white text-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">3D Visualization Controls</h3>
            <button onClick={toggleHelp} className="text-gray-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-10 text-center mr-2">⏱️</div>
              <p>The visualization plays automatically</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 text-center mr-2">🌍</div>
              <p>Watch as the view zooms into India</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 text-center mr-2">📍</div>
              <p>Red pins show branch locations</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 text-center mr-2">📊</div>
              <p>3D charts display performance metrics</p>
            </div>
            <div className="flex items-center">
              <div className="w-10 text-center mr-2">↩️</div>
              <p>Use back button to return to dashboard</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDControlsHelp; 