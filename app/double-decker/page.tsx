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
import { fadeIn, staggerContainer, slideIn } from '../../utils/motion';
import Logo from '../../components/Logo';
import { IBM_Plex_Sans, Montserrat } from 'next/font/google';
import VehicleDetailsModal from '../../components/VehicleDetailsModal';

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

const LoadingBar = ({ progress }: { progress: number }) => (
  <div className="fixed top-0 left-0 right-0 h-1 z-50">
    <div 
      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" 
      style={{ 
        width: `${progress}%`, 
        transition: 'width 0.3s ease-in-out',
        boxShadow: '0 0 10px rgba(78, 84, 200, 0.7)'
      }}
    />
  </div>
);

const ibmPlexSans = IBM_Plex_Sans({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap'
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});

export default function DoubleDeckerPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [latestRemark, setLatestRemark] = useState<string | null>(null);
  const [latestRemarkUserName, setLatestRemarkUserName] = useState<string | null>(null);
  const [latestRemarkUserRole, setLatestRemarkUserRole] = useState<string | null>(null);
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
  const [refreshing, setRefreshing] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [trips, setTrips] = useState<{ [key: string]: Trip[] }>({});
  const [tableFontSize, setTableFontSize] = useState(14);
  const [tableRowHeight, setTableRowHeight] = useState(32);
  const [placeFilter, setPlaceFilter] = useState('');
  const [vehicleDocuments, setVehicleDocuments] = useState<{ [key: string]: any }>({});

  const fetchVehicles = async (isRefresh = false) => {
      try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadProgress(10);
        const response = await fetch('/api/vehicles?group=LINE_DD');
        const result = await response.json();
      setLoadProgress(30);
        if (result.status === 'success') {
          const vehicleData = result.data.vehicles || [];
        if (vehicleData.length === 0) {
          setVehicles([]);
          setFilteredVehicles([]);
          setLoading(false);
          setRefreshing(false);
          setLoadProgress(100);
          return;
        }
        const vehicleNumbers = vehicleData.map((v: Vehicle) => v.vehicleNumber);
        setLoadProgress(40);
        try {
          const documentsResponse = await fetch('/vehicle_documents.json');
          const documentsData = await documentsResponse.json();
          if (documentsData) {
            const documentsMap = documentsData.reduce((acc: { [key: string]: any }, doc: any) => {
              acc[doc.vehicleNumber] = doc;
              return acc;
            }, {});
            setVehicleDocuments(documentsMap);
          }
        } catch (e) {
          setVehicleDocuments({});
        }
        const chunkArray = <T,>(arr: T[], size: number): T[][] => {
          return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
          );
        };
        const vehicleChunks = chunkArray(vehicleNumbers, 50);
        const haltingResults = await Promise.all(
          vehicleChunks.map(chunk =>
            fetch(`/api/halting-hours/batch?vnames=${chunk.join(',')}`)
              .then(resp => resp.json())
          )
        );
        setLoadProgress(70);
        const tripResults = await Promise.all(
          vehicleChunks.map(chunk =>
            fetch(`/api/trip/batch?vehicleNumbers=${chunk.join(',')}`)
              .then(resp => resp.json())
          )
        );
        setLoadProgress(80);
        const haltingResult = {
          status: 'success',
          data: haltingResults.reduce((acc, result) => {
            return result.status === 'success' ? { ...acc, ...result.data } : acc;
          }, {})
        };
        const tripResult = {
          status: 'success',
          data: tripResults.reduce((acc, result) => {
            return result.status === 'success' ? { ...acc, ...result.data } : acc;
          }, {})
        };
        setLoadProgress(90);
        const waypointsMap = haltingResult.status === 'success' ? haltingResult.data : {};
        const tripsMap = tripResult.status === 'success' ? tripResult.data : {};
        setTrips(tripsMap);
        const vehiclesWithData = vehicleData.map((vehicle: Vehicle) => {
          const waypoint = waypointsMap[vehicle.vehicleNumber];
          const vehicleTrips = tripsMap[vehicle.vehicleNumber] || [];
          const latestTrip = vehicleTrips[0] || null;
                return {
                  ...vehicle,
            haltingHours: waypoint?.haltingHours || 0,
            waypoint: waypoint,
                  currentTripId: latestTrip?._id
                };
        });
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
        setLoadProgress(100);
        } else {
          setError(result.message || 'Failed to fetch vehicles');
        }
      } catch (err) {
        setError('An error occurred while fetching vehicles');
        console.error(err);
      } finally {
        setLoading(false);
      setRefreshing(false);
      setTimeout(() => setLoadProgress(0), 500);
      }
    };

  useEffect(() => {
    fetchVehicles();
    const refreshInterval = setInterval(() => {
      fetchVehicles(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    let filtered = vehicles;
    if (dateFilter) {
      filtered = filtered.filter(v => new Date(v.updatedAt) >= dateFilter);
    }
    setFilteredVehicles(filtered);
  }, [dateFilter, vehicles]);

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

  const handleViewDetails = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLatestRemark(null); // Clear previous remark
    try {
      const response = await fetch(`/api/fleet-remarks?fleetId=${vehicle._id}`);
      const result = await response.json();
      if (result.status === 'success' && result.data.remark) {
        setLatestRemark(result.data.remark);
        setLatestRemarkUserName(result.data.userName);
        setLatestRemarkUserRole(result.data.userRole);
      } else {
        setLatestRemark('No remark available.');
        setLatestRemarkUserName(null);
        setLatestRemarkUserRole(null);
      }
    } catch (error) {
      console.error('Error fetching remark:', error);
      setLatestRemark('Failed to load remark.');
      setLatestRemarkUserName(null);
      setLatestRemarkUserRole(null);
    }
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
      <div className="absolute right-0 mt-2 w-48 bg-[#2d2d2d] rounded-lg shadow-xl border border-gray-700 z-10">
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
            className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            In Maintenance
          </button>
          <button
            onClick={() => onFilter('halting')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
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

  const getDocumentStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) {
      return { status: 'danger', icon: '✗' };
    }
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) {
      return { status: 'danger', icon: '✗' };
    } else if (daysUntilExpiry <= 10) {
      return { status: 'warning', icon: '⚠️' };
    } else {
      return { status: 'success', icon: '✓' };
    }
  };

  const getStatusIndicator = (vehicleNumber: string, type: string, vehicleDocuments: { [key: string]: any }) => {
    const document = vehicleDocuments[vehicleNumber];
    if (!document) {
      return { status: 'danger', icon: '✗' };
    }
    switch (type) {
      case 'PUC':
        return getDocumentStatus(document.pucExpiry);
      case 'NP':
        return getDocumentStatus(document.permitExpiry);
      case 'FIT':
        return getDocumentStatus(document.fitnessExpiry);
      default:
        return { status: 'danger', icon: '✗' };
    }
  };

  const sortVehiclesByHaltingHours = (vehiclesToSort: Vehicle[]) => {
    return [...vehiclesToSort].sort((a, b) => {
      const aHours = a.waypoint?.haltingHours || 0;
      const bHours = b.waypoint?.haltingHours || 0;
      const getColorPriority = (hours: number) => {
        if (hours >= 24) return 3;
        if (hours >= 12) return 2;
        return 1;
      };
      const aPriority = getColorPriority(aHours);
      const bPriority = getColorPriority(bHours);
      if (aPriority !== bPriority) return bPriority - aPriority;
      return bHours - aHours;
    });
  };

  const renderVehicleTable = (status: string, title: string, vehicles: Vehicle[], rowHeight: number, fontSize: number) => {
    const isAvailableTable = status === 'available';
    const sortedVehicles = sortVehiclesByHaltingHours(vehicles);
    return (
      <div className="glass-card mb-6 overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)' }}>
        <div className="glass-header p-4 flex items-center gap-3">
          <div className="bg-[rgba(255,255,255,0.15)] text-white font-bold h-10 w-10 flex items-center justify-center rounded-full">
            {sortedVehicles.length}
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        </div>
        <div className="overflow-x-auto w-full" style={{
          maxWidth: '100%',
          overflowY: 'hidden',
          background: 'rgba(30, 30, 47, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}>
          <table className="dashboard-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="col-vehicle-number">VEHICLE NUMBER</th>
                <th className="col-type">TYPE</th>
                <th className="col-place">PLACE</th>
                  {status === 'in-transit' && (
                  <th className="col-place">DESTINATION</th>
                  )}
                <th className="col-halt-hrs">HALT HRS</th>
                {!isAvailableTable && (
                  <th className="col-halt-hrs">PKMS</th>
                )}
                <th className="col-status text-center">PUC</th>
                <th className="col-status text-center">NP</th>
                <th className="col-status text-center">FIT</th>
              </tr>
            </thead>
            <tbody>
              {sortedVehicles.map((vehicle) => {
                const allTrips = trips[vehicle.vehicleNumber] || [];
                const latestTrip = allTrips[0];
                const trip = latestTrip;
                const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
                const R = 6371;
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
                const pucStatus = getStatusIndicator(vehicle.vehicleNumber, 'PUC', vehicleDocuments);
                const npStatus = getStatusIndicator(vehicle.vehicleNumber, 'NP', vehicleDocuments);
                const fitStatus = getStatusIndicator(vehicle.vehicleNumber, 'FIT', vehicleDocuments);
                const hours = vehicle.waypoint?.haltingHours || 0;
                let haltHoursClass = 'halt-hours-low';
                if (hours >= 24) {
                  haltHoursClass = 'halt-hours-high blink-bg';
                } else if (hours >= 12) {
                  haltHoursClass = 'halt-hours-medium';
                }
                return (
                  <tr 
                    key={vehicle._id} 
                    className="hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-200 cursor-pointer"
                    onClick={() => handleViewDetails(vehicle)}
                  >
                    <td className="col-vehicle-number font-medium text-white">{vehicle.vehicleNumber}</td>
                    <td className="col-type">{vehicle.vehicleType}</td>
                    <td className="col-place truncate">
                      {vehicle.waypoint?.name || '-'}
                      </td>
                      {status === 'in-transit' && (
                      <td className="col-place truncate">
                          {(() => {
                            const inTransitTrip = allTrips.find(t => t.status === 'in-transit');
                            return inTransitTrip?.destination?.name || '-';
                          })()}
                        </td>
                      )}
                    <td className="col-halt-hrs">
                      <span className={`status-badge ${haltHoursClass}`} style={{
                        backdropFilter: 'blur(8px)',
                        background: hours >= 24 
                          ? 'rgba(252, 66, 74, 0.3)' 
                          : hours >= 12 
                            ? 'rgba(255, 171, 0, 0.3)' 
                            : 'rgba(0, 210, 91, 0.3)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                        display: 'inline-block'
                      }}>
                          {(() => {
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
                      <td className="col-halt-hrs">{pendingDistance}</td>
                    )}
                    <td className="col-status text-center">
                      <div className="flex justify-center">
                        <span className={`status-circle status-circle-${pucStatus.status} inline-flex items-center justify-center`}>
                          {pucStatus.icon}
                      </span>
                      </div>
                    </td>
                    <td className="col-status text-center">
                      <div className="flex justify-center">
                        <span className={`status-circle status-circle-${npStatus.status} inline-flex items-center justify-center`}>
                          {npStatus.icon}
                      </span>
                      </div>
                    </td>
                    <td className="col-status text-center">
                      <div className="flex justify-center">
                        <span className={`status-circle status-circle-${fitStatus.status} inline-flex items-center justify-center`}>
                          {fitStatus.icon}
                      </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading || refreshing) {
    return (
      <div className={`min-h-screen w-full bg-[var(--bg-primary)] ${ibmPlexSans.variable} ${montserrat.variable}`} style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(78, 84, 200, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(252, 66, 74, 0.15) 0%, transparent 40%),
          var(--bg-primary)
        `
      }}>
        {(loading || refreshing) && <LoadingBar progress={loadProgress} />}
        <style jsx global>{`
          @keyframes blink-bg {
            0%, 100% { 
              background-color: rgba(252, 66, 74, 0.4);
              box-shadow: 0 0 15px rgba(252, 66, 74, 0.6);
            }
            50% { 
              background-color: rgba(252, 66, 74, 0.2);
              box-shadow: 0 0 5px rgba(252, 66, 74, 0.3);
            }
          }
          .blink-bg {
            animation: blink-bg 1.5s ease-in-out infinite;
            border: 1px solid rgba(255, 255, 255, 0.15);
          }
          .glass-card {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 5px 15px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .glass-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2);
          }
          .dashboard-table tr {
            transition: all 0.2s ease;
          }
          .dashboard-table tr:hover {
            transform: translateY(-1px);
          }
          .status-circle-success {
            animation: subtle-pulse 3s infinite;
          }
          @keyframes subtle-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}</style>
        <div className="dashboard-container" style={{ maxWidth: '100vw', overflowX: 'hidden', position: 'relative' }}>
          <header className="header-container" style={{
            background: 'rgba(30, 30, 47, 0.35)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center">
                <Logo />
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white tracking-wide">DOUBLE DECKER VEHICLE</h1>
                  <p className="text-gray-400 text-sm">Monitor and manage your DOUBLE DECKER VEHICLE fleet operations</p>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-white font-bold text-2xl">APML CONTROL24 X7</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <div className="search-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by place..."
                    value={placeFilter}
                    onChange={(e) => setPlaceFilter(e.target.value)}
                    className="search-input"
                    style={{ 
                      backdropFilter: 'blur(12px)', 
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => fetchVehicles(true)}
                  disabled={refreshing}
                  className="btn-secondary w-full md:w-auto"
                >
                  <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleExport(vehicles, 'Double Decker Vehicles')}
                  className="btn-primary btn-glow w-full md:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All Data (CSV)
                </Button>
              </div>
            </div>
          </header>
          <div className="relative w-full">
            <button 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-[rgba(30,30,47,0.6)] hover:bg-[rgba(42,42,94,0.7)] text-white p-2 rounded-r-lg backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
              onClick={() => {
                const container = document.querySelector('.content-grid');
                if (container) {
                  container.scrollBy({ left: -350, behavior: 'smooth' });
                }
              }}
              style={{
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-[rgba(30,30,47,0.6)] hover:bg-[rgba(42,42,94,0.7)] text-white p-2 rounded-l-lg backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
              onClick={() => {
                const container = document.querySelector('.content-grid');
                if (container) {
                  container.scrollBy({ left: 350, behavior: 'smooth' });
                }
              }}
              style={{
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="horizontal-scroll-fix">
              <div className="content-grid" style={{
                paddingTop: '10px',
                paddingBottom: '20px',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: '20px',
                overflowX: 'auto',
                overflowY: 'hidden',
                width: 'max-content',
                minWidth: '100%',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                msOverflowStyle: '-ms-autohiding-scrollbar',
                cursor: 'grab'
              }}>
                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300" style={{ flex: '0 0 950px', minWidth: '950px', marginRight: '20px' }}>
                  {renderVehicleTable(
                    'available',
                    'Available Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'available'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'at-unloading',
                    'At Unloading Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'at-unloading'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'in-transit',
                    'In Transit Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'in-transit'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'empty-movement',
                    'Empty Movement Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'empty-movement'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'off-duty',
                    'Off Duty Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'off-duty'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'at-pickup',
                    'At Pickup Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'at-pickup'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'enroute-for-pickup',
                    'Enroute for Pickup',
                    filteredVehicles.filter(v => v.currentTripStatus === 'enroute-for-pickup'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>

                <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                  {renderVehicleTable(
                    'maintenance',
                    'Maintenance Vehicles',
                    filteredVehicles.filter(v => v.currentTripStatus === 'maintenance'),
                    tableRowHeight,
                    tableFontSize
                  )}
                </div>
              </div>
            </div>
          </div>
          {selectedVehicle && (
            <VehicleDetailsModal
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
              remark={latestRemark}
              userName={latestRemarkUserName}
              userRole={latestRemarkUserRole}
            />
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-black">
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-xl text-red-400">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-[var(--bg-primary)] ${ibmPlexSans.variable} ${montserrat.variable}`} style={{
      background: `
        radial-gradient(circle at 20% 20%, rgba(78, 84, 200, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(252, 66, 74, 0.15) 0%, transparent 40%),
        var(--bg-primary)
      `
    }}>
      {(loading || refreshing) && <LoadingBar progress={loadProgress} />}
      <style jsx global>{`
        @keyframes blink-bg {
          0%, 100% { 
            background-color: rgba(252, 66, 74, 0.4);
            box-shadow: 0 0 15px rgba(252, 66, 74, 0.6);
          }
          50% { 
            background-color: rgba(252, 66, 74, 0.2);
            box-shadow: 0 0 5px rgba(252, 66, 74, 0.3);
          }
        }
        .blink-bg {
          animation: blink-bg 1.5s ease-in-out infinite;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .glass-card {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 5px 15px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .dashboard-table tr {
          transition: all 0.2s ease;
        }
        .dashboard-table tr:hover {
          transform: translateY(-1px);
        }
        .status-circle-success {
          animation: subtle-pulse 3s infinite;
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .content-grid::-webkit-scrollbar {
          height: 8px !important;
        }

        .content-grid::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 10px !important;
        }

        .content-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 10px !important;
        }

        .content-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }

        .content-grid:active {
          cursor: grabbing !important;
        }

        @media (max-width: 768px) {
          .content-grid::-webkit-scrollbar {
            height: 4px !important;
          }
        }
      `}</style>
      <div className="dashboard-container" style={{ maxWidth: '100vw', overflowX: 'hidden', position: 'relative' }}>
        <header className="header-container" style={{
          background: 'rgba(30, 30, 47, 0.35)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center">
                <Logo />
                <div className="ml-4">
                <h1 className="text-3xl font-bold text-white tracking-wide">DOUBLE DECKER VEHICLE</h1>
                <p className="text-gray-400 text-sm">Monitor and manage your DOUBLE DECKER VEHICLE fleet operations</p>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-white font-bold text-2xl">APML CONTROL24 X7</span>
              </div>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <div className="search-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Filter by place..."
                  value={placeFilter}
                  onChange={(e) => setPlaceFilter(e.target.value)}
                  className="search-input"
                  style={{ 
                    backdropFilter: 'blur(12px)', 
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => fetchVehicles(true)}
                disabled={refreshing}
                className="btn-secondary w-full md:w-auto"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleExport(vehicles, 'Double Decker Vehicles')}
                className="btn-primary btn-glow w-full md:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All Data (CSV)
              </Button>
            </div>
          </div>
        </header>
        <div className="relative w-full">
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-[rgba(30,30,47,0.6)] hover:bg-[rgba(42,42,94,0.7)] text-white p-2 rounded-r-lg backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
            onClick={() => {
              const container = document.querySelector('.content-grid');
              if (container) {
                container.scrollBy({ left: -350, behavior: 'smooth' });
              }
            }}
            style={{
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-[rgba(30,30,47,0.6)] hover:bg-[rgba(42,42,94,0.7)] text-white p-2 rounded-l-lg backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
            onClick={() => {
              const container = document.querySelector('.content-grid');
              if (container) {
                container.scrollBy({ left: 350, behavior: 'smooth' });
              }
            }}
            style={{
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="horizontal-scroll-fix">
            <div className="content-grid" style={{
              paddingTop: '10px',
              paddingBottom: '20px',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              gap: '20px',
              overflowX: 'auto',
              overflowY: 'hidden',
              width: 'max-content',
              minWidth: '100%',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              msOverflowStyle: '-ms-autohiding-scrollbar',
              cursor: 'grab'
            }}>
              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300" style={{ flex: '0 0 950px', minWidth: '950px', marginRight: '20px' }}>
                {renderVehicleTable(
                  'available',
                  'Available Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'available'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'at-unloading',
                  'At Unloading Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'at-unloading'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'in-transit',
                  'In Transit Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'in-transit'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'empty-movement',
                  'Empty Movement Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'empty-movement'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'off-duty',
                  'Off Duty Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'off-duty'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'at-pickup',
                  'At Pickup Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'at-pickup'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'enroute-for-pickup',
                  'Enroute for Pickup',
                  filteredVehicles.filter(v => v.currentTripStatus === 'enroute-for-pickup'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>

              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
                {renderVehicleTable(
                  'maintenance',
                  'Maintenance Vehicles',
                  filteredVehicles.filter(v => v.currentTripStatus === 'maintenance'),
                  tableRowHeight,
                  tableFontSize
                )}
              </div>
            </div>
          </div>
        </div>
        {selectedVehicle && (
          <VehicleDetailsModal
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
            remark={latestRemark}
            userName={latestRemarkUserName}
            userRole={latestRemarkUserRole}
          />
        )}
      </div>
    </div>
  );
} 