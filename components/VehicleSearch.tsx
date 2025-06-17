import React from 'react';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  currentTripStatus: string;
  createdAt: string;
  updatedAt: string;
  haltingHours?: number;
}

interface VehicleSearchProps {
  vehicles: Vehicle[];
  onSearch: (filteredVehicles: Vehicle[]) => void;
}

export default function VehicleSearch({ vehicles, onSearch }: VehicleSearchProps) {
  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      onSearch(vehicles);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = vehicles.filter((vehicle: Vehicle) => {
      const vehicleNumber = vehicle.vehicleNumber?.toLowerCase() || '';
      const vehicleType = vehicle.vehicleType?.toLowerCase() || '';
      const currentTripStatus = vehicle.currentTripStatus?.toLowerCase() || '';
      
      return (
        vehicleNumber.includes(searchQuery) ||
        vehicleType.includes(searchQuery) ||
        currentTripStatus.includes(searchQuery)
      );
    });
    onSearch(filtered);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search by number, type, or status..."
        onChange={(e) => handleSearch(e.target.value)}
        className="bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />
      <svg
        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
} 