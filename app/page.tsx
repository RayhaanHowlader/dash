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
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import dynamic from 'next/dynamic';

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
  ArcElement
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

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<VehicleStats>({
    sxl: 0,
    mxl: 0,
    trailer: 0,
    carCarrier: 0,
    doubleDecker: 0,
    feet17: 0,
    localvehicle: 0,
    active: 0,
    maintenance: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThreeD, setShowThreeD] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vehicles/stats');
        const result = await response.json();
        
        if (result.status === 'success') {
          setStats(result.data);
        } else {
          setError(result.message || 'Network Issue');
        }
      } catch (err) {
        setError('Network Issue');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const doughnutData = {
    labels: ['SXL', 'MXL', 'Trailer', 'Car Carrier', 'Double Decker', '17 Feet', 'Local Vehicle'],
    datasets: [
      {
        data: [
          stats.sxl,
          stats.mxl,
          stats.trailer,
          stats.carCarrier,
          stats.doubleDecker,
          stats.feet17,
          stats.localvehicle
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
          stats.active,
          stats.maintenance,
          stats.total - (stats.active + stats.maintenance)
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
      <div className={`flex-1 p-5 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 flex justify-between items-center">
         
            <div className="flex items-center gap-4">
              {/* 3D View Toggle Button */}
              <button
                onClick={toggleThreeD}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all group relative"
                aria-label="Toggle 3D Dashboard View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                <span>3D View</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Experience an interactive 3D globe visualization
                </div>
              </button>
            <LogoutButton />
            </div>
          </div>         
        </div>
      </div>
    </div>
  );
} 