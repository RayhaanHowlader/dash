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
import Lottie from 'lottie-react';
import movingTruckAnimation from '../public/animations/moving-truck.json'; // Place your Lottie JSON here
import truckAnimate from '../public/animations/truck-animate.json'; // New truck animation for before the header

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
  const [haltingTop10, setHaltingTop10] = useState<any[]>([]);
  const [haltingBranch, setHaltingBranch] = useState<any[]>([]);
  const [haltingLoading, setHaltingLoading] = useState(false);
  const [selectedHaltingGroup, setSelectedHaltingGroup] = useState<string>('LINE_SXL');
  const [haltingGroupData, setHaltingGroupData] = useState<{ [key: string]: { totalHalting: number; vehicles: any[] } }>({});
  const [haltingGroupTop10, setHaltingGroupTop10] = useState<any[]>([]);

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

  // --- Fetch all vehicles and halting hours for new charts ---
  useEffect(() => {
    async function fetchHaltingData() {
      setHaltingLoading(true);
      try {
        // Get all vehicles from all groups
        const groupKeys = vehicleGroupMap.map(g => g.key);
        let allVehicles: any[] = [];
        for (const group of groupKeys) {
          const res = await fetch(`/api/vehicles?group=${group}`);
          const result = await res.json();
          if (result.status === 'success' && result.data?.vehicles) {
            allVehicles = allVehicles.concat(result.data.vehicles); // DO NOT filter by available
          }
        }
        const vehicleNumbers = allVehicles.map(v => v.vehicleNumber);
        // Chunk for batch API
        const chunkArray = (arr: string[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
        const vehicleChunks = chunkArray(vehicleNumbers, 50);
        // Fetch halting hours for all vehicles
        const haltingResults = await Promise.all(
          vehicleChunks.map(chunk =>
            fetch(`/api/halting-hours/batch?vnames=${chunk.join(',')}`).then(resp => resp.json())
          )
        );
        const waypointsMap = haltingResults.reduce((acc, result) => {
          return result.status === 'success' ? { ...acc, ...result.data } : acc;
        }, {});
        // Top 10 vehicles by halting hours (all vehicles)
        const haltingArr = Object.values(waypointsMap).map((w: any) => ({
          branch: w.vname,
          count: w.haltingHours || 0,
          vehicles: [{ vehicleNumber: w.vname, haltingHours: w.haltingHours || 0 }]
        }));
        const top10 = haltingArr.sort((a, b) => b.count - a.count).slice(0, 10);
        setHaltingTop10(top10);
        // Branch-wise halting vehicles (all vehicles)
        const branchMap: Record<string, { count: number; vehicles: { vehicleNumber: string; haltingHours: number }[] }> = {};
        Object.values(waypointsMap).forEach((w: any) => {
          const branch = w.name || '-';
          if (!branchMap[branch]) branchMap[branch] = { count: 0, vehicles: [] };
          branchMap[branch].count += 1;
          branchMap[branch].vehicles.push({ vehicleNumber: w.vname, haltingHours: w.haltingHours || 0 });
        });
        const branchArr = Object.entries(branchMap).map(([branch, { count, vehicles }]) => ({ branch, count, vehicles }));
        setHaltingBranch(branchArr);
      } catch (e) {
        setHaltingTop10([]);
        setHaltingBranch([]);
      } finally {
        setHaltingLoading(false);
      }
    }
    fetchHaltingData();
  }, []);

  // --- Compute halting hours by group for pie chart ---
  useEffect(() => {
    // Fetch all vehicles from all groups and their halting hours (already done in haltingTop10/haltingBranch)
    async function computeHaltingGroupData() {
      // Get all vehicles from all groups
      const groupKeys = vehicleGroupMap.map(g => g.key);
      let allVehicles: any[] = [];
      for (const group of groupKeys) {
        const res = await fetch(`/api/vehicles?group=${group}`);
        const result = await res.json();
        if (result.status === 'success' && result.data?.vehicles) {
          allVehicles = allVehicles.concat(result.data.vehicles.map((v: any) => ({ ...v, vehicleGroup: group })));
        }
      }
      const vehicleNumbers = allVehicles.map(v => v.vehicleNumber);
      // Chunk for batch API
      const chunkArray = (arr: string[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
      const vehicleChunks = chunkArray(vehicleNumbers, 50);
      // Fetch halting hours for all vehicles
      const haltingResults = await Promise.all(
        vehicleChunks.map(chunk =>
          fetch(`/api/halting-hours/batch?vnames=${chunk.join(',')}`).then(resp => resp.json())
        )
      );
      const waypointsMap = haltingResults.reduce((acc, result) => {
        return result.status === 'success' ? { ...acc, ...result.data } : acc;
      }, {});
      // Group by vehicleGroup
      const groupData: { [key: string]: { totalHalting: number; vehicles: any[] } } = {};
      allVehicles.forEach(v => {
        const h = waypointsMap[v.vehicleNumber]?.haltingHours || 0;
        if (!groupData[v.vehicleGroup]) groupData[v.vehicleGroup] = { totalHalting: 0, vehicles: [] };
        groupData[v.vehicleGroup].totalHalting += h;
        groupData[v.vehicleGroup].vehicles.push({ ...v, haltingHours: h });
      });
      setHaltingGroupData(groupData);
      // Set top 10 for default group
      if (groupData[selectedHaltingGroup]) {
        const top10 = groupData[selectedHaltingGroup].vehicles
          .sort((a, b) => b.haltingHours - a.haltingHours)
          .slice(0, 10)
          .map(v => ({ branch: v.vehicleNumber, count: v.haltingHours, vehicles: [{ vehicleNumber: v.vehicleNumber, haltingHours: v.haltingHours }] }));
        setHaltingGroupTop10(top10);
      }
    }
    computeHaltingGroupData();
  }, []);

  // Update top 10 when selectedHaltingGroup changes
  useEffect(() => {
    if (haltingGroupData[selectedHaltingGroup]) {
      const top10 = haltingGroupData[selectedHaltingGroup].vehicles
        .sort((a, b) => b.haltingHours - a.haltingHours)
        .slice(0, 10)
        .map(v => ({ branch: v.vehicleNumber, count: v.haltingHours, vehicles: [{ vehicleNumber: v.vehicleNumber, haltingHours: v.haltingHours }] }));
      setHaltingGroupTop10(top10);
    }
  }, [selectedHaltingGroup, haltingGroupData]);

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
    <div className="flex h-screen bg-gradient-to-br from-[#23272F] via-[#1a1c2e] to-[#0a0c1a] relative overflow-hidden">
      {/* Subtle purple gradient overlay for interactivity */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(168,85,247,0.18) 0%, transparent 70%)' }} />
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`flex-1 p-5 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'} slide-down-fade-in`} style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-7xl mx-auto" style={{ marginLeft: 0, paddingLeft: 0 }}>
          {/* Header Section with moving truck animation before the text */}
          <div className="mb-10 ml-[270px] flex justify-center items-center relative">
            <div className="flex items-center" style={{ height: 100 }}>
              <Lottie animationData={truckAnimate} loop={true} style={{ width: 160, height: 200, filter: 'brightness(0) invert(1)' }} />
            </div>
            <h1 className="text-4xl font-bold text-white text-center ">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Vehicle</span> Fleet Dashboard
            </h1>
            {/* Remove or comment out the right-side animation if present */}
            {/* <div className="ml-6 flex items-center" style={{ height: 60 }}>
              <Lottie animationData={movingTruckAnimation} loop={true} style={{ width: 90, height: 200 }} />
            </div> */}
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
                  <BarChartOnly data={barChartData} pageName={selectedVehicleType} logoUrl="/logo.png"/>
                )
              )}
            </div>
          </div>
          {/* --- Top 10 Halting Vehicles Bar Chart --- */}
          <div className="w-full flex flex-col items-center mb-12">
            <div className="flex flex-col md:flex-row w-full justify-center items-start gap-8 mt-12">
              {/* Halting Hours Pie Chart */}
              <div className="flex-1" style={{ maxWidth: '480px', minWidth: '320px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginRight: 180 }}>
                <Pie3DChart
                  data={vehicleGroupMap.map(g => haltingGroupData[g.key]?.totalHalting || 0)}
                  labels={vehicleGroupMap.map(g => g.label)}
                  onSegmentClick={index => {
                    const groupKeys = vehicleGroupMap.map(g => g.key);
                    setSelectedHaltingGroup(groupKeys[index]);
                  }}
                />
                <div style={{ marginTop: 16, color: '#fff', fontWeight: 'bold', fontSize: 20 }}>
                  {`Total Halting Hours: ${haltingGroupData[selectedHaltingGroup]?.totalHalting || 0}`}
                </div>
              </div>
              {/* Top 10 Halting Vehicles Bar Chart for selected group */}
              <div className="flex-1" style={{ minWidth: 0, width: '100%', maxWidth: '900px', display: 'flex', alignItems: 'center', justifyContent: 'center',marginLeft: 100}}>
                <BarChartOnly
                  data={haltingGroupTop10}
                  title={`TOP 10 HALTING - ${vehicleGroupMap.find(g => g.key === selectedHaltingGroup)?.label || selectedHaltingGroup}`}
                  logoUrl="/logo.png"
                  barColor="#3b82f6"
                  yAxisLabel="Halting Hours"
                  chartWidth={1050}
                  chartMinWidth={1050}
                />
              </div>
            </div>
          </div>
          {/* --- Branch-wise Halting Vehicles Bar Chart --- */}
        
        </div>
      </div>
    </div>
  );
} 