import React from 'react';
import ClipLoader from 'react-spinners/ClipLoader';

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center ">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 opacity-20 blur"></div>
          <div className="relative rounded-lg p-8 shadow-xl">
            <ClipLoader color="#dc2626" size={40} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loading; 