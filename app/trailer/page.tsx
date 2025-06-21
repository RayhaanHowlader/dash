'use client';
import React, { useEffect, useState, useRef } from 'react';
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
import BranchAvailabilityLineChart from '../../components/BranchAvailabilityLineChart';
import BarChart from '../../components/BarChart';

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

interface VehicleDocument {
  vehicleNumber: string;
  pucExpiry: string | null;
  permitExpiry: string | null;
  fitnessExpiry: string | null;
}

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
});

// Helper function to get vehicle place based on status and trips
const getVehiclePlace = (vehicle: Vehicle, status: string, trips: { [key: string]: Trip[] }) => {
  const allTrips = trips[vehicle.vehicleNumber] || [];
  const latestTrip = allTrips[0];

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
    return vehicle.waypoint?.name || '-';
  } else if (status === 'at-pickup') {
    return latestTrip?.origin?.name || '-';
  } else if (status === 'off-duty') {
    return latestTrip?.intermediatePoints?.[0]?.offDuty?.area?.name || '-';
  } else if (status === 'maintenance') {
    return latestTrip?.intermediatePoints?.[0]?.maintenance?.serviceStation?.name || '-';
  } else if (status === 'enroute-for-pickup') {
    return latestTrip?.origin?.name || '-';
  } else {
    return vehicle.waypoint?.name || '-';
  }
};

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

export default function TrailerPage() {
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
  const [refreshing, setRefreshing] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [trips, setTrips] = useState<{ [key: string]: Trip[] }>({});
  const [tableFontSize, setTableFontSize] = useState(20);
  const [tableRowHeight, setTableRowHeight] = useState(32);
  const [vehicleDocuments, setVehicleDocuments] = useState<{ [key: string]: VehicleDocument }>({});
  const [placeFilter, setPlaceFilter] = useState('');
  const [latestRemark, setLatestRemark] = useState<string | null>(null);
  const [latestRemarkUserName, setLatestRemarkUserName] = useState<string | null>(null);
  const [latestRemarkUserRole, setLatestRemarkUserRole] = useState<string | null>(null);
  const chartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);

  const fetchVehicles = async (isRefresh = false) => {
      try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadProgress(10);
        const response = await fetch('/api/vehicles?group=LINE_TRAILER');
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

        // Read vehicle documents from JSON file
        const documentsResponse = await fetch('/vehicle_documents.json');
        const documentsData = await documentsResponse.json();
        if (documentsData) {
          const documentsMap = documentsData.reduce((acc: { [key: string]: VehicleDocument }, doc: VehicleDocument) => {
            acc[doc.vehicleNumber] = doc;
            return acc;
          }, {});
          setVehicleDocuments(documentsMap);
        }

        // Helper function to chunk array to avoid URL length limitations
        const chunkArray = <T,>(arr: T[], size: number): T[][] => {
          return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
          );
        };

        const vehicleChunks = chunkArray(vehicleNumbers, 50);

        // Process all chunks for halting hours
        const haltingResults = await Promise.all(
          vehicleChunks.map(chunk => 
            fetch(`/api/halting-hours/batch?vnames=${chunk.join(',')}`)
              .then(resp => resp.json())
          )
        );

        // Process all chunks for trips
        const tripResults = await Promise.all(
          vehicleChunks.map(chunk => 
            fetch(`/api/trip/batch?vehicleNumbers=${chunk.join(',')}`)
              .then(resp => resp.json())
          )
        );

        setLoadProgress(70);

        // Combine results from all chunks
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

        setLoadProgress(80);

        // Process halting hours data
        const waypointsMap = haltingResult.status === 'success' ? haltingResult.data : {};
        
        // Process trip data
        const tripsMap = tripResult.status === 'success' ? tripResult.data : {};
        setTrips(tripsMap);

        // Combine all data
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

        setLoadProgress(90);
          
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

        setLoadProgress(100);
        } else {
          setError(result.message || 'Network Issue');
        }
      } catch (err) {
        setError('An error occurred while fetching vehicles');
        console.error(err);
      } finally {
        setLoading(false);
      setRefreshing(false);
      }
    };

  useEffect(() => {
    fetchVehicles();
    const refreshInterval = setInterval(() => {
      fetchVehicles(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Memoized filtering for place and date
  const memoizedFilteredVehicles = React.useMemo(() => {
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
    return filtered;
  }, [dateFilter, vehicles, placeFilter, trips]);

  useEffect(() => {
    setFilteredVehicles(memoizedFilteredVehicles);
  }, [memoizedFilteredVehicles]);

  // Loading bar component
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

  const getStatusIndicator = (vehicleNumber: string, type: string, vehicleDocuments: { [key: string]: VehicleDocument }) => {
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
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return bHours - aHours;
    });
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

  const renderVehicleTable = (status: string, title: string, vehicles: Vehicle[], rowHeight: number, fontSize: number) => {
    const isAvailableTable = status === 'available';
    const sortedVehicles = sortVehiclesByHaltingHours(vehicles);

    return (
      <div className="glass-card mb-6 overflow-hidden">
        <div className="glass-header p-4 flex items-center gap-3">
          <div className="bg-[rgba(255,255,255,0.15)] text-white font-bold h-10 w-10 flex items-center justify-center rounded-full">
            {sortedVehicles.length}
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="dashboard-table" style={{ width: '100%', fontSize: fontSize + 'px' }}>
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
                const R = 6371; // Earth's radius in km

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
                    onClick={() => handleViewDetails(vehicle)} 
                    className="hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-200 cursor-pointer"
                  >
                    <td className="col-vehicle-number font-medium text-white">{vehicle.vehicleNumber}</td>
                    <td className="col-type">{vehicle.vehicleType}</td>
                    <td className="col-place truncate">
                      {getVehiclePlace(vehicle, status, trips)}
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

  // Calculate available vehicles per branch (place) for BarChart
  const availableVehicles = filteredVehicles.filter(v => v.currentTripStatus === 'available');
  const branchMap: Record<string, { count: number; vehicles: { vehicleNumber: string; haltingHours: number }[] }> = {};
  availableVehicles.forEach(vehicle => {
    const place = getVehiclePlace(vehicle, 'available', trips) || '-';
    if (!branchMap[place]) {
      branchMap[place] = { count: 0, vehicles: [] };
    }
    branchMap[place].count += 1;
    branchMap[place].vehicles.push({ vehicleNumber: vehicle.vehicleNumber, haltingHours: vehicle.haltingHours || 0 });
  });
  const barChartData = Object.entries(branchMap).map(([branch, { count, vehicles }]) => ({ branch, count, vehicles }));
  
  // Create data for branch availability line chart
  const branchChartData = Object.entries(branchMap).map(([branch, { count }]) => ({ branch, count }));

  const handleDownloadChart = () => {
    // Download line chart first
    if (chartRef.current) {
      const lineChart = chartRef.current;
      const lineChartCanvas = lineChart.canvas;
      
      // Download just the line chart image
      const lineChartLink = document.createElement('a');
      lineChartLink.download = `trailer_branch_chart_${new Date().toISOString().slice(0, 10)}.png`;
      lineChartLink.href = lineChartCanvas.toDataURL('image/png');
      lineChartLink.click();
    }
    
    // Download bar chart with tables
    if (barChartRef.current && barChartRef.current.chartRef.current) {
      const barChart = barChartRef.current.chartRef.current;
      const barChartCanvas = barChart.canvas;
      
      // Import html2canvas dynamically
      import('html2canvas').then((htmlCanvas) => {
        // Use html2canvas to capture the entire bar chart container with tables
        if (barChartRef.current && barChartRef.current.containerRef.current) {
          htmlCanvas.default(barChartRef.current.containerRef.current, {
            backgroundColor: '#1a1a2e',
            scale: 1.5, // Higher scale for better quality
            logging: false,
            allowTaint: true,
            useCORS: true,
            width: 1872, // Fixed width for consistency
            height: 2860 // Fixed height for consistency
          }).then((fullCanvas) => {
            // Convert to image and download
            const barChartLink = document.createElement('a');
            barChartLink.download = `trailer_bar_chart_with_tables_${new Date().toISOString().slice(0, 10)}.png`;
            barChartLink.href = fullCanvas.toDataURL('image/png');
            setTimeout(() => barChartLink.click(), 500); // Add small delay between downloads
          }).catch((err) => {
            console.error('Error rendering bar chart with tables:', err);
            
            // Fallback to just the bar chart if html2canvas fails
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1872;
            tempCanvas.height = 1200;
            const ctx = tempCanvas.getContext('2d');
            
            if (ctx) {
              // Fill background
              ctx.fillStyle = '#1a1a2e';
              ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              
              // Draw the chart
              ctx.drawImage(barChartCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
              
              // Convert to image and download
              const barChartLink = document.createElement('a');
              barChartLink.download = `trailer_bar_chart_${new Date().toISOString().slice(0, 10)}.png`;
              barChartLink.href = tempCanvas.toDataURL('image/png');
              setTimeout(() => barChartLink.click(), 500);
            }
          });
        }
      }).catch((err) => {
        console.error('Error importing html2canvas:', err);
        
        // Fallback if the import fails
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1872;
        tempCanvas.height = 1200;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
          // Fill background
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Draw the chart
          ctx.drawImage(barChartCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
          
          // Convert to image and download
          const barChartLink = document.createElement('a');
          barChartLink.download = `trailer_bar_chart_${new Date().toISOString().slice(0, 10)}.png`;
          barChartLink.href = tempCanvas.toDataURL('image/png');
          setTimeout(() => barChartLink.click(), 500);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <LoadingBar progress={loadProgress} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loading />
            {/* <p className="text-gray-400 mt-4">Loading vehicle data... {loadProgress}%</p> */}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-xl text-[var(--danger)]">{error}</div>
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
      {refreshing && <LoadingBar progress={loadProgress} />}
      <div className="dashboard-container" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
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
                <h1 className="text-3xl font-bold text-white tracking-wide">TRAILER VEHICLE</h1>
                <p className="text-gray-400 text-sm">Monitor and manage your TRAILER VEHICLE fleet operations</p>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-white font-bold text-2xl">APML CONTROL24 X7</span>
              </div>
            <button
              type="button"
              onClick={handleDownloadChart}
              className="ml-2 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
              title="Download chart as PNG"
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Charts
            </button>
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
                onClick={() => handleExport(vehicles, 'Trailer Vehicles')}
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
        {/* Hidden Bar Chart for download only */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1872px', height: 'auto', pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
          <BarChart ref={barChartRef} data={barChartData} logoUrl="/logo.png" pageName="Trailer" />
        </div>
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 900, height: 'auto', pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
          <BranchAvailabilityLineChart ref={chartRef} data={branchChartData} logoUrl="/logo.png" />
        </div>
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
              gap: '20px'
            }}>
              <div className="w-full overflow-hidden hover:translate-y-[-5px] transition-transform duration-300">
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