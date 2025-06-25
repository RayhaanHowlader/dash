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

  return (
    <div className="flex h-screen bg-[#1a1c1e]">
      <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <div className={`flex-1 p-5 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Vehicle Performance Dashboard</h1>
              <p className="text-gray-400 text-base">Real-time monitoring and analytics</p>
            </div>
            <LogoutButton />
          </div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg border border-[#334155] hover:border-[#3b82f6] transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Fleet</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg border border-[#334155] hover:border-[#10b981] transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Vehicles</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-[#10b981]/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg border border-[#334155] hover:border-[#f59e0b] transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">In Maintenance</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.maintenance}</p>
                </div>
                <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Vehicle Distribution Chart */}
            <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg border border-[#334155]">
              <h2 className="text-lg font-bold text-white mb-4">Vehicle Distribution</h2>
              <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-3">
                  <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e293b]">
                    Daily
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-lg hover:bg-[#334155] focus:outline-none">
                    Weekly
                  </button>
                </div>
              </div>
              <div className="relative h-[240px]">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: '#94a3b8',
                          font: {
                            size: 11,
                            weight: 'bold'
                          },
                          padding: 15
                        }
                      }
                    },
                    cutout: '65%'
                  }}
                />
              </div>
            </div>

            {/* Vehicle Status Overview */}
            <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg border border-[#334155]">
              <h2 className="text-lg font-bold text-white mb-4">Status Overview</h2>
              <div className="space-y-4">
                {/* Vehicle Details Table */}
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Vehicle Type</th>
                        <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Count</th>
                        <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">SXL</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.sxl}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">MXL</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.mxl}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">Trailer</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.trailer}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">Car Carrier</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.carCarrier}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">Double Decker</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.doubleDecker}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">17 Feet</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.feet17}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-xs font-medium text-white">Local Vehicle</td>
                        <td className="py-2 text-center text-xs text-gray-300">{stats.localvehicle}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 