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

const gradientBarPlugin = {
  id: 'gradientBar',
  beforeDatasetsDraw: (chart: Chart<'bar'>) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;
    chart.data.datasets.forEach((dataset: any) => {
      if (dataset.type === 'line') return;
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, '#00b4db'); // Sky blue
      gradient.addColorStop(1, '#ffeb3b'); // Yellow
      dataset.backgroundColor = gradient;
    });
  },
};

const BarChart = forwardRef<{ chartRef: React.RefObject<ChartJS<'bar'>>, containerRef: React.RefObject<HTMLDivElement> }, BarChartProps>(({ data, logoUrl, pageName }, ref) => {
  // Only bar chart, no line/avg halt hours
  const chartRef = useRef<ChartJS<'bar'> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Expose refs to parent component
  useImperativeHandle(ref, () => ({
    chartRef,
    containerRef
  }));

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [data]);

  const downloadChart = () => {
    if (chartRef.current && containerRef.current) {
      // Get the chart canvas
      const canvas = chartRef.current.canvas;
      
      // Import html2canvas dynamically
      import('html2canvas').then(({ default: html2canvas }) => {
        // Use html2canvas to capture the entire container with tables
        if (containerRef.current) {
          html2canvas(containerRef.current, {
            backgroundColor: '#1a1a2e',
            scale: 1.5, // Higher scale for better quality
            logging: false,
            allowTaint: true,
            useCORS: true,
            width: 1872, // Fixed width for consistency
            height: 2860 // Fixed height for consistency
          }).then(fullCanvas => {
            // Convert to image and download
            const link = document.createElement('a');
            link.download = `${pageName || 'vehicle'}_chart_full_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = fullCanvas.toDataURL('image/png');
            link.click();
          }).catch(err => {
            console.error('Error rendering chart with tables:', err);
            
            // Fallback to just the chart if html2canvas fails
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1872;
            tempCanvas.height = 1200;
            const ctx = tempCanvas.getContext('2d');
            
            if (ctx) {
              // Fill background
              ctx.fillStyle = '#1a1a2e';
              ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              
              // Draw the chart
              ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
              
              // Convert to image and download
              const link = document.createElement('a');
              link.download = `${pageName || 'vehicle'}_chart_${new Date().toISOString().slice(0, 10)}.png`;
              link.href = tempCanvas.toDataURL('image/png');
              link.click();
            }
          });
        }
      }).catch(err => {
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
          ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          
          // Convert to image and download
          const link = document.createElement('a');
          link.download = `${pageName || 'vehicle'}_chart_${new Date().toISOString().slice(0, 10)}.png`;
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
        }
      });
    }
  };

  const chartData: ChartData<'bar'> = {
    labels: data.map(d => d.branch),
    datasets: [
      {
        label: 'Available Vehicles',
        data: data.map(d => d.count),
        backgroundColor: '#4fc3f7', // Lighter blue
        maxBarThickness: 100, // Even wider bars
        categoryPercentage: 0.7, // More space between groups
        barPercentage: 1.0, // Each bar is as wide as possible in its group
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
        minHeight: 800,
        maxWidth: '100%',
        width: '1872px',
        marginBottom: 32,
      }}
    >
      <div className="relative" style={{ minHeight: 800, width: '1872px' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="absolute left-4 top-4 w-20 h-20 opacity-80 z-10" />
        )}
        <Bar ref={chartRef} data={chartData as any} options={options} height={800} width={1872} />
      </div>
      {/* Split table into two columns: left and right */}
      <div className="mt-6 flex flex-row w-full gap-8">
        {/* Left table */}
        <div className="overflow-x-auto w-1/2">
          <table className="min-w-fit text-left border-separate border-spacing-y-2" style={{ width: '100%', border: '1.5px solid #23243a', borderRadius: 12 }}>
            <thead>
              <tr>
                <th className="px-3 py-2 text-xs font-bold text-gray-300 uppercase bg-[#23243a] rounded-tl-lg" style={{ minWidth: 140, fontSize: 20, border: '1px solid #23243a' }}>Vehicle Number</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-300 uppercase bg-[#23243a]" style={{ minWidth: 180, fontSize: 20, border: '1px solid #23243a' }}>Place</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-300 uppercase bg-[#23243a] rounded-tr-lg" style={{ minWidth: 80, fontSize: 20, border: '1px solid #23243a' }}>Halt Hrs</th>
              </tr>
            </thead>
            <tbody>
              {data.flatMap(branch => branch.vehicles.map(v => ({ ...v, branch: branch.branch })))
                .slice(0, Math.ceil(data.flatMap(branch => branch.vehicles).length / 2))
                .map((v, idx) => (
                  <tr key={v.vehicleNumber + v.branch} className="bg-[#181a2e]">
                    <td className="px-3 py-2 font-bold text-white text-sm rounded-l-lg" style={{ minWidth: 140, fontSize: 18, border: '1px solid #23243a' }}>{v.vehicleNumber}</td>
                    <td className="px-3 py-2 text-gray-200 text-sm" style={{ minWidth: 180, fontSize: 18, border: '1px solid #23243a' }}>{v.branch}</td>
                    <td className="px-3 py-2 rounded-r-lg" style={{ minWidth: 80, fontSize: 18, border: '1px solid #23243a' }}>
                      <span className="inline-block font-bold px-3 py-1" style={{ color: '#fc424a', fontSize: 18 }}>{v.haltingHours}h</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Right table */}
        <div className="overflow-x-auto w-1/2">
          <table className="min-w-fit text-left border-separate border-spacing-y-2" style={{ width: '100%', border: '1.5px solid #23243a', borderRadius: 12 }}>
            <thead>
              <tr>
                <th className="px-3 py-2 text-xs font-bold text-gray-300 uppercase bg-[#23243a] rounded-tl-lg" style={{ minWidth: 140, fontSize: 20, border: '1px solid #23243a' }}>Vehicle Number</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-300 uppercase bg-[#23243a]" style={{ minWidth: 180, fontSize: 20, border: '1px solid #23243a' }}>Place</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-300 uppercase bg-[#23243a] rounded-tr-lg" style={{ minWidth: 80, fontSize: 20, border: '1px solid #23243a' }}>Halt Hrs</th>
              </tr>
            </thead>
            <tbody>
              {data.flatMap(branch => branch.vehicles.map(v => ({ ...v, branch: branch.branch })))
                .slice(Math.ceil(data.flatMap(branch => branch.vehicles).length / 2))
                .map((v, idx) => (
                  <tr key={v.vehicleNumber + v.branch} className="bg-[#181a2e]">
                    <td className="px-3 py-2 font-bold text-white text-sm rounded-l-lg" style={{ minWidth: 140, fontSize: 18, border: '1px solid #23243a' }}>{v.vehicleNumber}</td>
                    <td className="px-3 py-2 text-gray-200 text-sm" style={{ minWidth: 180, fontSize: 18, border: '1px solid #23243a' }}>{v.branch}</td>
                    <td className="px-3 py-2 rounded-r-lg" style={{ minWidth: 80, fontSize: 18, border: '1px solid #23243a' }}>
                      <span className="inline-block font-bold px-3 py-1" style={{ color: '#fc424a', fontSize: 18 }}>{v.haltingHours}h</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default BarChart; 