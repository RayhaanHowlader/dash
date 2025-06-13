import React from 'react';
import ClipLoader from 'react-spinners/ClipLoader';

function Loading() {
  return (
    <div className="">
      <div className="">
        <div className="">
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 opacity-20 blur"></div>
          <div className="relative rounded-lg bg-[#1f2123] p-8 shadow-xl">
            <ClipLoader color="#dc2626" size={40} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loading; 