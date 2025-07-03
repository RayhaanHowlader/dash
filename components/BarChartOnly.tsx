import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Chart,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface VehicleInfo {
  vehicleNumber: string;
  haltingHours: number;
}

interface BarChartProps {
  data: { branch: string; count: number; vehicles: VehicleInfo[] }[];
  logoUrl?: string;
  pageName?: string;
}

const fontFamily = `'Inter', 'Roboto', 'IBM Plex Sans', 'Montserrat', 'sans-serif'`;

const BarChartOnly = forwardRef<{ chartRef: React.RefObject<ChartJS<'bar'>>, containerRef: React.RefObject<HTMLDivElement> }, BarChartProps>(({ data, logoUrl, pageName }, ref) => {
  const chartRef = useRef<ChartJS<'bar'> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    chartRef,
    containerRef
  }));

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [data]);

  const chartData: ChartData<'bar'> = {
    labels: data.map(d => d.branch),
    datasets: [
      {
        label: 'Available Vehicles',
        data: data.map(d => d.count),
        backgroundColor: '#4fc3f7',
        maxBarThickness: 100,
        categoryPercentage: 0.7,
        barPercentage: 1.0,
        hoverBackgroundColor: '#2196f3',
        borderSkipped: false,
        order: 1,
      },
    ],
  };

  const chartTitle = pageName ? `Available Vehicles by Branch - ${pageName.toUpperCase()}` : 'Available Vehicles by Branch';

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: chartTitle,
        color: '#fff',
        font: { size: 36, family: fontFamily, weight: 'bold' },
        padding: { top: 20, bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(30,30,47,0.95)',
        borderColor: '#00b4db',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 12,
        caretSize: 8,
        boxPadding: 8,
        displayColors: false,
        titleFont: { size: 18, family: fontFamily },
        bodyFont: { size: 18, family: fontFamily },
        callbacks: {
          label: (context: any) => `Available: ${context.parsed.y}`,
        },
      },
      datalabels: {
        display: false,
      },
    },
    layout: {
      padding: { top: 24, right: 16, bottom: 24, left: 16 },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Branch',
          color: '#fff',
          font: { size: 22, family: fontFamily },
        },
        ticks: {
          color: '#fff',
          font: { size: 18, family: fontFamily },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(255,255,255,0.07)'
        },
      },
      y: {
        title: {
          display: true,
          text: 'Available Vehicles',
          color: '#fff',
          font: { size: 22, family: fontFamily },
        },
        beginAtZero: true,
        ticks: {
          color: '#fff',
          font: { size: 18, family: fontFamily },
          precision: 0,
          stepSize: 1,
        },
        grid: {
          color: 'rgba(255,255,255,0.07)'
        },
        border: { display: false },
      },
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    onHover: (event: any, chartElement: any[]) => {
      if (event.native) {
        event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
      }
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    elements: {
      bar: {
        hoverBackgroundColor: '#0099c6',
        borderRadius: 12,
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto p-4 relative"
      style={{
        background: '#1a1a2e',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minHeight: 600,
        maxWidth: '100%',
        width: '1050px',
        minWidth: '1050px',
        marginBottom: 32,
      }}
    >
      <div className="relative" style={{ minHeight: 600, width: '1050px', minWidth: '1050px' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="absolute left-4 top-4 w-20 h-20 opacity-80 z-10" />
        )}
        <Bar ref={chartRef} data={chartData as any} options={options} height={600} width={1400} />
      </div>
    </div>
  );
});

export default BarChartOnly; 