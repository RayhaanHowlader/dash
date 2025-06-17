'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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
  feet17: number;
  doubleDecker: number;
  localvehicle:number;
}

export default function VehicleCharts({ stats }: { stats: VehicleStats }) {
  const barData = {
    labels: ['SXL', 'MXL', 'Trailer', 'Car Carrier', '17 Feet', 'Double Decker','Local Vehicle'],
    datasets: [
      {
        label: 'Number of Vehicles',
        data: [stats.sxl, stats.mxl, stats.trailer, stats.carCarrier, stats.feet17, stats.doubleDecker,stats.localvehicle],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: ['SXL', 'MXL', 'Trailer', 'Car Carrier', '17 Feet', 'Double Decker','Local Vehicle'],
    datasets: [
      {
        data: [stats.sxl, stats.mxl, stats.trailer, stats.carCarrier, stats.feet17, stats.doubleDecker,stats.localvehicle],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(255,168,52,0.4)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255,13,74,1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Vehicle Distribution',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Vehicle Distribution (Bar Chart)</h2>
        <Bar data={barData} options={options} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Vehicle Distribution (Pie Chart)</h2>
        <Pie data={pieData} options={options} />
      </div>
    </div>
  );
} 