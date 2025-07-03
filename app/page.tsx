'use client';
import React, { useEffect, useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import Sidebar from '../components/Sidebar';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import dynamic from 'next/dynamic';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import Pie3DChart from '../components/Pie3DChart';
import BarChartOnly from '../components/BarChartOnly';
import { useRouter } from 'next/navigation';
import { Typewriter } from 'react-simple-typewriter';

// Dynamically import the 3D dashboard component with no SSR
const ThreeDDashboard = dynamic(
  () => import('@/components/3d-dashboard/ThreeDDashboard'),
  { ssr: false }
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface VehicleStats {
  sxl: number;
  mxl: number;
  trailer: number;
  carCarrier: number;
  doubleDecker: number;
  feet17: number;
  localvehicle: number;
  active: number;
  maintenance: number;
  total: number;
}

// Mapping from backend group keys to display labels and pie order (update to match API keys)
const vehicleGroupMap = [
  { key: 'LINE_SXL', label: 'SXL' },
  { key: 'LINE_MXL', label: 'MXL' },
  { key: 'LINE_TRAILER', label: 'Trailer' },
  { key: 'LINE_CAR', label: 'Car Carrier' },
  { key: 'LINE_DD', label: '' },
  { key: 'LINE_17FEET', label: '17 Feet' },
  // { key: 'LOCAL_VEHICLE', label: 'Local Vehicle' },
];

// Add getVehiclePlace function (copy from SXL/local-vehicle page)
function getVehiclePlace(vehicle: any, status: string, trips: Record<string, any[]>): string {
  const allTrips = trips[vehicle.vehicleNumber] || [];
  const latestTrip = allTrips[0];
  // Helper to get maintenance place from intermediatePoints
  const getMaintenancePlace = (tripObj: any): string | null => {
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
  const getOffDutyAreaName = (tripObj: any): string | null => {
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
      const recentCompleteTrip = allTrips.find((t: any) => t.status === 'complete');
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
    return vehicle.waypoint?.name;
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

export default function Home() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availableCounts, setAvailableCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThreeD, setShowThreeD] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('LINE_SXL');
  const [branchDataLoading, setBranchDataLoading] = useState(true);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [barLoading, setBarLoading] = useState(false);

  // Client-side auth check (fallback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = document.cookie.split('; ').find(row => row.startsWith('isAuthenticated='))?.split('=')[1];
      if (isAuthenticated !== 'true') {
        router.replace('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchAvailable = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/vehicles/available');
        const result = await res.json();
        if (result.status === 'success') {
          setAvailableCounts(result.data);
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailable();
  }, []);

  // Prepare pie chart data from API
  const pieLabels = vehicleGroupMap.map(g => g.label);
  const pieData = vehicleGroupMap.map(g => availableCounts[g.key] || 0);

  // Fetch branch-wise data for selected group
  useEffect(() => {
    if (!selectedVehicleType) return;
    setBarLoading(true);
    setBarChartData([]);
    fetch(`/api/vehicles?group=${selectedVehicleType}`)
      .then(res => res.json())
      .then(async result => {
        type Vehicle = { vehicleNumber: string; haltingHours?: number; place?: string; branch?: string; currentTripStatus?: string; };
        const vehicles: Vehicle[] = result.data?.vehicles || [];
        if (!vehicles || vehicles.length === 0) {
          setBarChartData([]);
          return;
        }
        // Only consider available vehicles
        const availableVehicles = vehicles.filter((v: Vehicle) => v.currentTripStatus === 'available');
        const vehicleNumbers = availableVehicles.map(v => v.vehicleNumber);
        // Helper to chunk array
        const chunkArray = (arr: string[], size: number) =>
          Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
          );
        const vehicleChunks = chunkArray(vehicleNumbers, 50);
        // Fetch waypoints
        const haltingResults = await Promise.all(
          vehicleChunks.map(chunk =>
            fetch(`/api/halting-hours/batch?vnames=${chunk.join(',')}`).then(resp => resp.json())
          )
        );
        const waypointsMap = haltingResults.reduce((acc, result) => {
          return result.status === 'success' ? { ...acc, ...result.data } : acc;
        }, {});
        // Fetch trips
        const tripResults = await Promise.all(
          vehicleChunks.map(chunk =>
            fetch(`/api/trip/batch?vehicleNumbers=${chunk.join(',')}`).then(resp => resp.json())
          )
        );
        const tripsMap = tripResults.reduce((acc, result) => {
          return result.status === 'success' ? { ...acc, ...result.data } : acc;
        }, {});
        // Attach waypoint/trip data to vehicles
        const vehiclesWithData = availableVehicles.map(vehicle => {
          const waypoint = waypointsMap[vehicle.vehicleNumber];
          const vehicleTrips = tripsMap[vehicle.vehicleNumber] || [];
          return {
            ...vehicle,
            haltingHours: waypoint?.haltingHours || 0,
            waypoint: waypoint,
            trips: vehicleTrips,
          };
        });
        // Use getVehiclePlace to get branch name
        const branchMap: Record<string, { count: number; vehicles: { vehicleNumber: string; haltingHours: number }[] }> = {};
        vehiclesWithData.forEach(vehicle => {
          const branch = getVehiclePlace(vehicle, 'available', tripsMap) || '-';
          if (!branchMap[branch]) {
            branchMap[branch] = { count: 0, vehicles: [] };
          }
          branchMap[branch].count += 1;
          branchMap[branch].vehicles.push({
            vehicleNumber: vehicle.vehicleNumber,
            haltingHours: vehicle.haltingHours || 0,
          });
        });
        const branchChartData = Object.entries(branchMap).map(([branch, { count, vehicles }]) => ({ branch, count, vehicles }));
        setBarChartData(branchChartData);
      })
      .catch(() => setBarChartData([]))
      .finally(() => setBarLoading(false));
  }, [selectedVehicleType]);

  const doughnutData = {
    labels: ['SXL', 'MXL', 'Trailer', 'Car Carrier', 'DD', '17 Feet', 'Local Vehicle'],
    datasets: [
      {
        data: [
          pieData[0],
          pieData[1],
          pieData[2],
          pieData[3],
          pieData[4],
          pieData[5],
          pieData[6]
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#6366f1',
          '#14b8a6'
        ],
        borderColor: ['#1e293b'],
        borderWidth: 2,
      },
    ],
  };

  const statusData = {
    labels: ['Active', 'Maintenance', 'Available'],
    datasets: [
      {
        label: 'Vehicle Status',
        data: [
          pieData[0] + pieData[1] + pieData[2] + pieData[3] + pieData[4] + pieData[5] + pieData[6],
          pieData[0] + pieData[1] + pieData[2] + pieData[3] + pieData[4] + pieData[5] + pieData[6],
          pieData[0] + pieData[1] + pieData[2] + pieData[3] + pieData[4] + pieData[5] + pieData[6]
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
        borderColor: '#1e293b',
        borderWidth: 1,
      },
    ],
  };

  const toggleThreeD = () => {
    setShowThreeD(!showThreeD);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <main className={`flex-1 p-4 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <div className="flex items-center justify-center h-full">
            <div className="text-xl text-white">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <main className={`flex-1 p-4 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <div className="flex items-center justify-center h-full">
            <div className="text-xl text-red-500">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  // If 3D view is active, show the ThreeDDashboard
  if (showThreeD) {
    return (
      <div className="flex h-screen bg-[#1a1c1e]">
        <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
        <div className={`flex-1 relative transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          {/* 3D Dashboard View */}
          <div className="absolute inset-0">
            <ThreeDDashboard />
          </div>
          
          {/* Back button */}
          <button 
            onClick={toggleThreeD}
            className="absolute top-4 right-4 z-50 bg-[#1e293b] p-3 rounded-full shadow-lg border border-[#334155] hover:bg-[#334155]"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1a1c1e]">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`flex-1 p-5 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'} slide-down-fade-in`}>
        <div className="max-w-7xl mx-auto" style={{ marginLeft: 0, paddingLeft: 0 }}>
          {/* Header Section */}
          <div className="mb-10 ml-[270px] flex justify-center items-center">
            <h1 className="text-4xl font-bold text-white text-center ">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Vehicle</span> Fleet Dashboard
            </h1>
          </div>

          {/* Main Dashboard Content - Show Pie and Bar chart side by side */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6 w-full items-stretch">
            {/* Pie Chart on the left */}
            <div className="flex-1 lg:w-2/5" style={{ maxWidth: '480px', minWidth: '320px', width: '100%', margin: '0', marginLeft: 0, paddingLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'column' }}>
              {/* Typewriter effect for total vehicles */}
              {selectedVehicleType && (
                <div style={{ marginBottom: 24, fontSize: 28, fontWeight: 'bold', color: '#fff', minHeight: 40 }}>
                  <Typewriter
                    key={selectedVehicleType + (availableCounts[selectedVehicleType] || 0)}
                    words={[`Total ${vehicleGroupMap.find(g => g.key === selectedVehicleType)?.label || selectedVehicleType} Vehicles : ${availableCounts[selectedVehicleType] || 0}`]}
                    loop={1}
                    cursor
                    cursorStyle="|"
                    typeSpeed={60}
                    deleteSpeed={40}
                    delaySpeed={1500}
                  />
                </div>
              )}
              <Pie3DChart
                data={pieData}
                labels={pieLabels}
                onSegmentClick={(index) => {
                  const vehicleTypes = vehicleGroupMap.map(g => g.key);
                  setSelectedVehicleType(vehicleTypes[index]);
                }}
              />
            </div>
            {/* Bar Chart on the right */}
            <div className="flex-1 lg:w-3/5" style={{ minWidth: '0', width: '100%', maxWidth: '1200px', margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',marginLeft: "250px", paddingLeft: 0 }}>
              {selectedVehicleType && (
                barLoading ? (
                  <div className="flex items-center justify-center h-40 text-white">Loading branch data...</div>
                ) : (
                  <BarChartOnly data={barChartData} pageName={selectedVehicleType} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 