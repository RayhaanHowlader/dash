'use client';

import React, { useEffect, useState } from 'react';
// import Sidebar from '../../components/Sidebar';
// import Card from '../../components/Card';
import Button from '../../components/Button';
import Table from '../../components/Table';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Loading from '../loading';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../components/Logo';
import * as XLSX from 'xlsx';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  currentTripStatus: string;
  currentTripId?: string;
  createdAt: string;
  updatedAt: string;
  haltingHours?: number;
  waypoint?: {
    dttime: string;
    haltingHours: number;
    vname: string;
    lat: number;
    lngt: number;
    name: string;
    fullAddress: string;
  };
  shouldBlink: boolean;
  timeUp: string;
}

interface Trip {
  _id: string;
  vehicleNumber: string;
  origin: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: string;
  intermediatePoints?: any[];
}

interface VehicleStats {
  total: number;
  available: number;
  inTransit: number;
  atUnloading: number;
  offDuty: number;
  emptyMovement: number;
  atPickup: number;
  enrouteForPickup: number;
}

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const VehicleDetailsModal = ({ vehicle, onClose }: VehicleDetailsModalProps) => {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-500 text-sm">Vehicle Number</h3>
                <p className="text-gray-900 text-lg font-medium">{vehicle.vehicleNumber}</p>
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Vehicle Type</h3>
                <p className="text-gray-900 text-lg font-medium">{vehicle.vehicleType}</p>
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Current Status</h3>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  vehicle.currentTripStatus === 'in-transit' 
                    ? 'bg-green-500/10 text-green-500' 
                    : vehicle.currentTripStatus === 'maintenance'
                      ? 'bg-red-500/10 text-red-500'
                      : vehicle.currentTripStatus === 'available'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {vehicle.currentTripStatus}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-500 text-sm">Created At</h3>
                <p className="text-gray-900 text-lg font-medium">
                  {new Date(vehicle.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Last Updated</h3>
                <p className="text-gray-900 text-lg font-medium">
                  {new Date(vehicle.updatedAt).toLocaleString()}
                </p>
              </div>
              {vehicle.haltingHours !== undefined && (
                <div>
                  <h3 className="text-gray-500 text-sm">Halting Hrs</h3>
                  <p className="text-gray-900 text-lg font-medium">
                    {vehicle.haltingHours} hours
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              variant="primary" 
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add blink animation style
<style jsx global>{`
@keyframes blink-bg {
  0%, 100% { background-color: #dc2626; }
  50% { background-color: #7f1d1d; }
}
.blink-bg {
  animation: blink-bg 1s steps(2, start) infinite;
}
`}</style>

export default function SXLPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<VehicleStats>({ 
    total: 0, 
    available: 0,
    inTransit: 0,
    atUnloading: 0,
    offDuty: 0,
    emptyMovement: 0,
    atPickup: 0,
    enrouteForPickup: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [trips, setTrips] = useState<{ [key: string]: Trip[] }>({});
  const [tableFontSize, setTableFontSize] = useState(14);
  const [tableRowHeight, setTableRowHeight] = useState(32);
  const [placeFilter, setPlaceFilter] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vehicles?group=LINE_SXL');
        const result = await response.json();
        
        if (result.status === 'success') {
          const vehicleData = result.data.vehicles || [];

          // Fetch halting hours and trip data for each vehicle
          const vehiclesWithData = await Promise.all(
            vehicleData.map(async (vehicle: Vehicle) => {
              try {
                const [haltingResponse, tripResponse] = await Promise.all([
                  fetch(`/api/halting-hours?vname=${vehicle.vehicleNumber}`),
                  fetch(`/api/trip?vehicleNumber=${vehicle.vehicleNumber}`)
                ]);
                
                const haltingResult = await haltingResponse.json();
                const tripResult = await tripResponse.json();
                
                const latestWaypoint = haltingResult.status === 'success' && haltingResult.data.waypoints.length > 0
                  ? haltingResult.data.waypoints[0]
                  : null;
                
                const tripsArr = tripResult.status === 'success' ? tripResult.data : [];
                if (tripsArr && tripsArr.length > 0) {
                  setTrips(prev => ({ ...prev, [vehicle.vehicleNumber]: tripsArr }));
                }
                const latestTrip = tripsArr[0] || null;
                return {
                  ...vehicle,
                  haltingHours: latestWaypoint?.haltingHours || 0,
                  waypoint: latestWaypoint,
                  currentTripId: latestTrip?._id
                };
              } catch (err) {
                console.error(`Error fetching data for vehicle ${vehicle.vehicleNumber}:`, err);
                return {
                  ...vehicle,
                  haltingHours: 0
                };
              }
            })
          );
          
          // Calculate stats
          const total = vehiclesWithData.length;
          const available = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'available').length;
          const inTransit = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'in-transit').length;
          const atUnloading = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'at-unloading').length;
          const offDuty = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'off-duty').length;
          const emptyMovement = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'empty-movement').length;
          const atPickup = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'at-pickup').length;
          const enrouteForPickup = vehiclesWithData.filter((v: Vehicle) => v.currentTripStatus === 'enroute-for-pickup').length;
          
          setVehicles(vehiclesWithData);
          setFilteredVehicles(vehiclesWithData);
          setStats({
            total,
            available,
            inTransit,
            atUnloading,
            offDuty,
            emptyMovement,
            atPickup,
            enrouteForPickup
          });
        } else {
          setError(result.message || 'Failed to fetch vehicles');
        }
      } catch (err) {
        setError('An error occurred while fetching vehicles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Helper to get the displayed place for a vehicle (same as in the table)
  function getVehiclePlace(vehicle: Vehicle, status: string, trips: { [key: string]: Trip[] }) {
    const allTrips = trips[vehicle.vehicleNumber] || [];
    const latestTrip = allTrips[0];
    const trip = latestTrip;
    // Helper to get maintenance place from intermediatePoints
    const getMaintenancePlace = (tripObj: any) => {
      if (!tripObj || !Array.isArray(tripObj.intermediatePoints)) return null;
      for (const point of tripObj.intermediatePoints) {
        if (
          point.maintenance &&
          point.maintenance.serviceStation &&
          point.maintenance.serviceStation.name
        ) {
          return point.maintenance.serviceStation.name;
        }
      }
      return null;
    };
    // Helper to get off duty area name from intermediatePoints
    const getOffDutyAreaName = (tripObj: any) => {
      if (!tripObj || !Array.isArray(tripObj.intermediatePoints)) return null;
      for (const point of tripObj.intermediatePoints) {
        if (
          point.offDuty &&
          point.offDuty.area &&
          point.offDuty.area.name
        ) {
          return point.offDuty.area.name;
        }
      }
      return null;
    };
    if (status === 'available') {
      if (latestTrip?.status === 'discarded') {
        const recentCompleteTrip = allTrips.find(t => t.status === 'complete');
        if (recentCompleteTrip?.destination?.name) {
          return recentCompleteTrip.destination.name;
        }
        const maintPlace = getMaintenancePlace(recentCompleteTrip);
        if (maintPlace) return maintPlace;
        const offDutyArea = getOffDutyAreaName(recentCompleteTrip);
        if (offDutyArea) return offDutyArea;
      }
      if (latestTrip?.destination?.name) {
        return latestTrip.destination.name;
      }
      const maintPlace = getMaintenancePlace(latestTrip);
      if (maintPlace) return maintPlace;
      const offDutyArea = getOffDutyAreaName(latestTrip);
      if (offDutyArea) return offDutyArea;
      return '-';
    } else if (status === 'in-transit') {
      return vehicle.waypoint?.name || '-';
    } else if (status === 'at-unloading') {
      return trip && trip.destination && trip.destination.name ? trip.destination.name : '-';
    } else if (status === 'at-pickup') {
      if (latestTrip?.origin?.name) {
        return latestTrip.origin.name;
      }
      return '-';
    } else if (status === 'off-duty') {
      if (latestTrip?.intermediatePoints?.[0]?.offDuty?.area?.name) {
        return latestTrip.intermediatePoints[0].offDuty.area.name;
      }
      return '-';
    } else if (status === 'maintenance') {
      if (latestTrip?.intermediatePoints?.[0]?.maintenance?.serviceStation?.name) {
        return latestTrip.intermediatePoints[0].maintenance.serviceStation.name;
      }
      return '-';
    } else if (status === 'enroute-for-pickup') {
      if (latestTrip?.origin?.name) {
        return latestTrip.origin.name;
      }
      return '-';
    } else {
      return vehicle.waypoint?.name || '-';
    }
  }

  // Update filteredVehicles to also filter by place (using the above logic for all statuses)
  useEffect(() => {
    let filtered = vehicles;
    if (dateFilter) {
      filtered = filtered.filter(v => new Date(v.updatedAt) >= dateFilter);
    }
    if (placeFilter.trim() !== '') {
      filtered = filtered.filter(v => {
        const place = getVehiclePlace(v, v.currentTripStatus, trips);
        return place && place.toLowerCase().includes(placeFilter.toLowerCase());
      });
    }
    setFilteredVehicles(filtered);
  }, [dateFilter, vehicles, placeFilter, trips]);

  useEffect(() => {
    // Dynamically adjust font size and row height to fit all rows in viewport
    const totalRows =
      filteredVehicles.filter(v => v.currentTripStatus === 'available').length +
      filteredVehicles.filter(v => v.currentTripStatus === 'in-transit').length +
      filteredVehicles.filter(v => v.currentTripStatus === 'empty-movement').length +
      filteredVehicles.filter(v => v.currentTripStatus === 'enroute-for-pickup').length +
      filteredVehicles.filter(v => v.currentTripStatus === 'at-unloading').length +
      filteredVehicles.filter(v => v.currentTripStatus === 'off-duty').length +
      filteredVehicles.filter(v => v.currentTripStatus === 'at-pickup').length;
    const headerHeight = 220; // px, estimate for header and paddings
    const availableHeight = window.innerHeight - headerHeight;
    let rowHeight = Math.floor(availableHeight / (totalRows || 1));
    let fontSize = Math.max(10, Math.floor(rowHeight * 0.5));
    rowHeight = Math.max(18, rowHeight); // minimum row height
    setTableFontSize(fontSize);
    setTableRowHeight(rowHeight);
  }, [filteredVehicles]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      const response = await fetch(`/api/vehicles?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        window.location.reload();
      } else {
        alert(result.message || 'Failed to delete vehicle');
      }
    } catch (err) {
      alert('An error occurred while deleting the vehicle');
      console.error(err);
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleExport = (data: Vehicle[], title: string) => {
    const headers = ['Vehicle Number', 'Type', 'Status', 'Last Updated', 'Halt Hrs'];
    const csvContent = [
      headers.join(','),
      ...data.map(vehicle => [
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.currentTripStatus,
        new Date(vehicle.updatedAt).toLocaleString(),
        vehicle.haltingHours || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    setShowFilterDropdown(false);
    
    let filteredData = vehicles;
    switch (filter) {
      case 'active':
        filteredData = vehicles.filter(v => v.currentTripStatus === 'in-transit' || v.currentTripStatus === 'available');
        break;
      case 'maintenance':
        filteredData = vehicles.filter(v => v.currentTripStatus === 'maintenance');
        break;
      case 'halting':
        filteredData = vehicles.filter(v => v.haltingHours && v.haltingHours > 0);
        break;
      case 'all':
      default:
        filteredData = vehicles;
    }
    
    setFilteredVehicles(filteredData);
  };

  const FilterDropdown = ({ onFilter }: { onFilter: (filter: string) => void }) => {
    return (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-300 z-10">
        <div className="py-1">
          {/* <button
            onClick={() => onFilter('all')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            All Vehicles
          </button> */}
          {/* <button
            onClick={() => onFilter('active')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            Active Vehicles
          </button> */}
          <button
            onClick={() => onFilter('maintenance')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900"
          >
            In Maintenance
          </button>
          <button
            onClick={() => onFilter('halting')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900"
          >
            Halting Vehicles
          </button>
        </div>
      </div>
    );
  };

  const statusIcons = {
    total: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    inTransit: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    available: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    maintenance: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const renderVehicleTable = (status: string, title: string, vehicles: Vehicle[], rowHeight: number, fontSize: number) => {
    const isAvailableTable = status === 'available';
    
    // Sort vehicles by halting status color and then by hours
    const sortedVehicles = [...vehicles].sort((a, b) => {
      const aHours = a.waypoint?.haltingHours || 0;
      const bHours = b.waypoint?.haltingHours || 0;
      
      // Get color priority (higher number = higher priority)
      const getColorPriority = (hours: number) => {
        if (hours >= 24) return 3; // Red - highest priority
        if (hours >= 12) return 2; // Yellow - medium priority
        return 1; // Green - lowest priority
      };
      
      const aPriority = getColorPriority(aHours);
      const bPriority = getColorPriority(bHours);
      
      // First sort by color priority (descending)
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // If same color priority, sort by hours (descending)
      return bHours - aHours;
    });

    // Function to generate static status with color based on vehicle number
    const getStaticStatus = (vehicleNumber: string) => {
      if (status === 'maintenance') {
        const statuses = [
          { color: '🔴' },
          { color: '🟡' },
          { color: '🟢' }
        ];
        return statuses[Math.floor(Math.random() * statuses.length)];
      } else {
        // Create a simple hash of the vehicle number
        const hash = vehicleNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Use the hash to determine if it's green (80%) or yellow (20%)
        return hash % 100 < 80 ? { color: '🟢' } : { color: '🟡' };
      }
    };

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 bg-blue-900 p-3 rounded-t-lg">
          <div className="bg-blue-700 text-white font-bold w-8 h-8 flex items-center justify-center rounded">
            {sortedVehicles.length}
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="bg-gray-900 rounded-b-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontSize: '14px' }}>
              <thead className="sticky top-0 z-10 bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300 font-medium border-b border-gray-800">VEHICLE NUMBER</th>
                  <th className="px-4 py-2 text-left text-gray-300 font-medium border-b border-gray-800">TYPE</th>
                  <th className="px-4 py-2 text-left text-gray-300 font-medium border-b border-gray-800">PLACE</th>
                  {status === 'in-transit' && (
                    <th className="px-4 py-2 text-left text-gray-300 font-medium border-b border-gray-800">DESTINATION</th>
                  )}
                  <th className="px-4 py-2 text-left text-gray-300 font-medium border-b border-gray-800">HALT HRS</th>
                  {!isAvailableTable && (
                    <th className="px-4 py-2 text-left text-gray-300 font-medium border-b border-gray-800">PKMS</th>
                  )}
                  <th className="px-4 py-2 text-center text-gray-300 font-medium border-b border-gray-800">IN</th>
                  <th className="px-4 py-2 text-center text-gray-300 font-medium border-b border-gray-800">SP</th>
                  <th className="px-4 py-2 text-center text-gray-300 font-medium border-b border-gray-800">NP</th>
                  <th className="px-4 py-2 text-center text-gray-300 font-medium border-b border-gray-800">PUC</th>
                  <th className="px-4 py-2 text-center text-gray-300 font-medium border-b border-gray-800">DLE</th>
                  <th className="px-4 py-2 text-center text-gray-300 font-medium border-b border-gray-800">FIT</th>
                </tr>
              </thead>
              <tbody>
                {sortedVehicles.map((vehicle) => {
                  // Get all trips for this vehicle
                  const allTrips = trips[vehicle.vehicleNumber] || [];
                  const latestTrip = allTrips[0];
                  const trip = latestTrip; // For compatibility with existing code
                  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
                  const R = 6371; // Earth's radius in km

                  // Calculate pending distance if we have both current location and destination
                  let pendingDistance = 'N/A';
                  if (!isAvailableTable) {
                    try {
                      let destLat = null;
                      let destLng = null;
                      if (trip?.destination) {
                        if ('latitude' in trip.destination && 'longitude' in trip.destination) {
                          destLat = (trip.destination as any).latitude;
                          destLng = (trip.destination as any).longitude;
                        } else if (trip.destination.coordinates?.lat != null && trip.destination.coordinates?.lng != null) {
                          destLat = trip.destination.coordinates.lat;
                          destLng = trip.destination.coordinates.lng;
                        }
                      }
                      if (
                        vehicle.waypoint?.lat != null &&
                        vehicle.waypoint?.lngt != null &&
                        destLat != null &&
                        destLng != null
                      ) {
                        const lat1 = toRadians(vehicle.waypoint.lat);
                        const lon1 = toRadians(vehicle.waypoint.lngt);
                        const lat2 = toRadians(destLat);
                        const lon2 = toRadians(destLng);

                        const dLat = lat2 - lat1;
                        const dLon = lon2 - lon1;

                        const a =
                          Math.sin(dLat / 2) ** 2 +
                          Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        pendingDistance = (R * c).toFixed(2) + ' km';
                      }
                    } catch (error) {
                      console.error('Error calculating distance:', error);
                      pendingDistance = 'N/A';
                    }
                  }

                  // Get static status for each column based on vehicle number
                  const inStatus = getStaticStatus(vehicle.vehicleNumber + 'IN');
                  const spStatus = getStaticStatus(vehicle.vehicleNumber + 'SP');
                  const npStatus = getStaticStatus(vehicle.vehicleNumber + 'NP');
                  const pucStatus = getStaticStatus(vehicle.vehicleNumber + 'PUC');
                  const dleStatus = getStaticStatus(vehicle.vehicleNumber + 'DLE');
                  const fitStatus = getStaticStatus(vehicle.vehicleNumber + 'FIT');

                  return (
                    <tr key={vehicle._id} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="px-4 py-3 text-gray-300">{vehicle.vehicleNumber}</td>
                      <td className="px-4 py-3 text-gray-300">{vehicle.vehicleType}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {(() => {
                          if (status === 'available') {
                            const allTrips = trips[vehicle.vehicleNumber] || [];
                            const latestTrip = allTrips[0];
                            if (latestTrip) {
                              // Debug log
                              console.log('Vehicle:', vehicle.vehicleNumber, 'Trips:', allTrips);
                            }
                            // Helper to get maintenance place from intermediatePoints
                            const getMaintenancePlace = (tripObj: any) => {
                              if (!tripObj || !Array.isArray(tripObj.intermediatePoints)) return null;
                              for (const point of tripObj.intermediatePoints) {
                                if (
                                  point.maintenance &&
                                  point.maintenance.serviceStation &&
                                  point.maintenance.serviceStation.name
                                ) {
                                  return point.maintenance.serviceStation.name;
                                }
                              }
                              return null;
                            };

                            // Helper to get off duty area name from intermediatePoints
                            const getOffDutyAreaName = (tripObj: any) => {
                              if (!tripObj || !Array.isArray(tripObj.intermediatePoints)) return null;
                              for (const point of tripObj.intermediatePoints) {
                                if (
                                  point.offDuty &&
                                  point.offDuty.area &&
                                  point.offDuty.area.name
                                ) {
                                  return point.offDuty.area.name;
                                }
                              }
                              return null;
                            };

                            if (latestTrip?.status === 'discarded') {
                              const recentCompleteTrip = allTrips.find(t => t.status === 'complete');
                              if (recentCompleteTrip?.destination?.name) {
                                return recentCompleteTrip.destination.name;
                              }
                              const maintPlace = getMaintenancePlace(recentCompleteTrip);
                              if (maintPlace) return maintPlace;
                              const offDutyArea = getOffDutyAreaName(recentCompleteTrip);
                              if (offDutyArea) return offDutyArea;
                            }
                            if (latestTrip?.destination?.name) {
                              return latestTrip.destination.name;
                            }
                            const maintPlace = getMaintenancePlace(latestTrip);
                            if (maintPlace) return maintPlace;
                            const offDutyArea = getOffDutyAreaName(latestTrip);
                            if (offDutyArea) return offDutyArea;
                            return '-';
                          } else if (status === 'in-transit') {
                            return vehicle.waypoint?.name || '-';
                          } else if (status === 'at-unloading') {
                            return trip && trip.destination && trip.destination.name ? trip.destination.name : '-';
                          } else if (status === 'at-pickup') {
                            const allTrips = trips[vehicle.vehicleNumber] || [];
                            const latestTrip = allTrips[0];
                            if (latestTrip?.origin?.name) {
                              return latestTrip.origin.name;
                            }
                            return '-';
                          } else if (status === 'off-duty') {
                            const allTrips = trips[vehicle.vehicleNumber] || [];
                            const latestTrip = allTrips[0];
                            if (latestTrip?.intermediatePoints?.[0]?.offDuty?.area?.name) {
                              return latestTrip.intermediatePoints[0].offDuty.area.name;
                            }
                            return '-';
                          } else if (status === 'maintenance') {
                            const allTrips = trips[vehicle.vehicleNumber] || [];
                            const latestTrip = allTrips[0];
                            if (latestTrip?.intermediatePoints?.[0]?.maintenance?.serviceStation?.name) {
                              return latestTrip.intermediatePoints[0].maintenance.serviceStation.name;
                            }
                            return '-';
                          } else if (status === 'enroute-for-pickup') {
                            const allTrips = trips[vehicle.vehicleNumber] || [];
                            const latestTrip = allTrips[0];
                            if (latestTrip?.origin?.name) {
                              return latestTrip.origin.name;
                            }
                            return '-';
                          } else {
                            return vehicle.waypoint?.name || '-';
                          }
                        })()}
                      </td>
                      {status === 'in-transit' && (
                        <td className="px-4 py-3 text-gray-300">
                          {(() => {
                            const allTrips = trips[vehicle.vehicleNumber] || [];
                            const inTransitTrip = allTrips.find(t => t.status === 'in-transit');
                            return inTransitTrip?.destination?.name || '-';
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-center min-w-[60px] text-white ${
                          vehicle.waypoint?.haltingHours && vehicle.waypoint.haltingHours >= 7
                            ? 'bg-red-600 blink-bg'
                            : 'bg-green-600'
                        }`}>
                          {(() => {
                            const hours = vehicle.waypoint?.haltingHours || 0;
                            const days = Math.floor(hours / 24);
                            const remainingHours = hours % 24;
                            if (days > 0) {
                              return `${days}d ${remainingHours}h`;
                            }
                            return `${hours}h`;
                          })()}
                        </span>
                      </td>
                      {!isAvailableTable && (
                        <td className="px-4 py-3 text-gray-300">{pendingDistance}</td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block w-3 h-3 rounded-full bg-green-500"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block w-3 h-3 rounded-full bg-green-500"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block w-3 h-3 rounded-full bg-green-500"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block w-3 h-3 rounded-full bg-green-500"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block w-3 h-3 rounded-full bg-green-500"></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block w-3 h-3 rounded-full bg-green-500"></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Excel export handler
  const handleDownloadExcel = () => {
    // Define the statuses and their display names
    const statusGroups = [
      { key: 'available', label: 'Available Vehicles' },
      { key: 'at-unloading', label: 'At Unloading Vehicles' },
      { key: 'in-transit', label: 'In Transit Vehicles' },
      { key: 'empty-movement', label: 'Empty Movement Vehicles' },
      { key: 'off-duty', label: 'Off Duty Vehicles' },
      { key: 'at-pickup', label: 'At Pickup Vehicles' },
      { key: 'enroute-for-pickup', label: 'Enroute for Pickup' },
      { key: 'maintenance', label: 'Maintenance Vehicles' },
    ];
    const allRows: Array<Array<string | number | undefined>> = [];
    statusGroups.forEach(group => {
      const groupVehicles = vehicles.filter(v => v.currentTripStatus === group.key);
      if (groupVehicles.length > 0) {
        // Add a header row for the group
        allRows.push([group.label]);
        // Add column headers - removed IN, SP, NP, PUC, DLE, FIT columns
        allRows.push([
          'VEHICLE NUMBER',
          'TYPE',
          'PLACE',
          ...(group.key === 'in-transit' ? ['DESTINATION'] : []),
          'HALT HRS',
          ...(group.key !== 'available' ? ['PKMS'] : []),
        ]);
        // Add data rows
        groupVehicles.forEach(vehicle => {
          const allTrips = trips[vehicle.vehicleNumber] || [];
          const latestTrip = allTrips[0];
          const trip = latestTrip;
          // Place logic
          const place = getVehiclePlace(vehicle, group.key, trips);
          // Destination logic
          let destination = '';
          if (group.key === 'in-transit') {
            destination = (() => {
              const inTransitTrip = allTrips.find(t => t.status === 'in-transit');
              return inTransitTrip?.destination?.name || '-';
            })();
          }
          // Pending distance logic
          let pendingDistance = '';
          if (group.key !== 'available') {
            try {
              let destLat = null;
              let destLng = null;
              if (trip?.destination) {
                if ('latitude' in trip.destination && 'longitude' in trip.destination) {
                  destLat = (trip.destination as any).latitude;
                  destLng = (trip.destination as any).longitude;
                } else if (trip.destination.coordinates?.lat != null && trip.destination.coordinates?.lng != null) {
                  destLat = trip.destination.coordinates.lat;
                  destLng = trip.destination.coordinates.lng;
                }
              }
              if (
                vehicle.waypoint?.lat != null &&
                vehicle.waypoint?.lngt != null &&
                destLat != null &&
                destLng != null
              ) {
                const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
                const R = 6371;
                const lat1 = toRadians(vehicle.waypoint.lat);
                const lon1 = toRadians(vehicle.waypoint.lngt);
                const lat2 = toRadians(destLat);
                const lon2 = toRadians(destLng);
                const dLat = lat2 - lat1;
                const dLon = lon2 - lon1;
                const a =
                  Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                pendingDistance = (R * c).toFixed(2) + ' km';
              }
            } catch (error) {
              pendingDistance = '';
            }
          }
          
          // Halt hours
          const hours = vehicle.waypoint?.haltingHours || 0;
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          const haltHrs = days > 0 ? `${days}d ${remainingHours}h` : `${hours}h`;
          
          // Row - removed IN, SP, NP, PUC, DLE, FIT columns
          allRows.push([
            vehicle.vehicleNumber,
            vehicle.vehicleType,
            place,
            ...(group.key === 'in-transit' ? [destination] : []),
            haltHrs,
            ...(group.key !== 'available' ? [pendingDistance] : []),
          ]);
        });
        // Add an empty row between groups
        allRows.push([]);
      }
    });
    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
    XLSX.writeFile(wb, `sxl_vehicles_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loading />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-white">
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-xl text-red-600">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900">
      <div className="flex bg-gray-900 min-h-screen">
        <main className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Logo />
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-white">SXL VEHICLE</h1>
                  <p className="text-gray-400">Monitor and manage your SXL VEHICLE fleet operations</p>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-white font-bold text-2xl">APML CONTROL24 X7</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by place..."
                    value={placeFilter}
                    onChange={(e) => setPlaceFilter(e.target.value)}
                    className="input-field"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleDownloadExcel}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All Data (Excel)
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-nowrap overflow-x-auto gap-4 items-start">
            <div className="flex-shrink-0 min-w-[500px]">{renderVehicleTable(
              'available',
              'Available Vehicles',
              filteredVehicles.filter(v => v.currentTripStatus === 'available'),
              tableRowHeight,
              tableFontSize
            )}</div>
            <div className="flex-shrink-0 min-w-[500px]">{renderVehicleTable(
              'at-unloading',
              'At Unloading Vehicles',
              filteredVehicles.filter(v => v.currentTripStatus === 'at-unloading'),
              tableRowHeight,
              tableFontSize
            )}</div>
            <div className="flex-shrink-0 min-w-[500px]">{renderVehicleTable(
              'in-transit',
              'In Transit Vehicles',
              filteredVehicles.filter(v => v.currentTripStatus === 'in-transit'),
              tableRowHeight,
              tableFontSize
            )}</div>
            <div className="flex-shrink-0 min-w-[500px] flex flex-col gap-4">
              <div>
                {renderVehicleTable(
                  'empty-movement',
                  'Empty Movement Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'empty-movement'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>
              <div>
                {renderVehicleTable(
                  'off-duty',
                  'Off Duty Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'off-duty'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>
            </div>
            <div className="flex-shrink-0 min-w-[500px] flex flex-col gap-4">
              <div>
                {renderVehicleTable(
                  'at-pickup',
                  'At Pickup Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'at-pickup'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>
              <div>
                {renderVehicleTable(
                  'enroute-for-pickup',
                  'Enroute for Pickup',
                  filteredVehicles.filter(v => v.currentTripStatus === 'enroute-for-pickup'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>
            </div>
            <div className="flex-shrink-0 min-w-[500px]">{renderVehicleTable(
              'maintenance',
              'Maintenance Vehicles',
              filteredVehicles.filter(v => v.currentTripStatus === 'maintenance'),
              tableRowHeight,
              tableFontSize
            )}</div>
          </div>
        </main>

        {selectedVehicle && (
          <VehicleDetailsModal 
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </div>
    </div>
  );
}