import React, { forwardRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BranchAvailabilityLineChartProps {
  data: { branch: string; count: number }[];
  logoUrl?: string;
}

const backgroundColor = '#181a2a'; // your navy blue

const backgroundPlugin = {
  id: 'customBackground',
  beforeDraw: (chart: any) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

const BranchAvailabilityLineChart = forwardRef<any, BranchAvailabilityLineChartProps>(({ data, logoUrl }, ref) => {
  // Chart.js plugin to draw logo
  const logoPlugin = logoUrl
    ? {
        id: 'logo',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const image = new window.Image();
          image.src = logoUrl;
          image.onload = function () {
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.drawImage(image, 10, 0, 60, 60);
            ctx.restore();
          };
        }
      }
    : undefined;

  const chartData = {
    labels: data.map(d => d.branch),
    datasets: [
      {
        label: 'Available Vehicles',
        data: data.map(d => d.count),
        fill: false,
        borderColor: 'rgba(78, 84, 200, 1)',
        backgroundColor: 'rgba(78, 84, 200, 0.2)',
        tension: 0.3,
        pointBackgroundColor: 'rgba(252, 66, 74, 1)',
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const options = {
    responsive: true,
    layout: {
      padding: {
        top: 40,
        right: 0,
        bottom: 40,
        left: 0
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Available Vehicles by Branch',
        color: '#fff',
        font: { size: 18 }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Available: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Branch',
          color: '#fff',
          font: { size: 14 }
        },
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        title: {
          display: true,
          text: 'Available Vehicles',
          color: '#fff',
          font: { size: 14 }
        },
        beginAtZero: true,
        ticks: { color: '#fff', precision: 0 },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  return (
    <div style={{height: '150%', width: '952px', maxWidth: '100%', margin: '0 auto', background: 'rgba(30,30,47,0.5)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
      <Line
        ref={ref}
        data={chartData}
        options={options}
        width={952}
        height={476}
        plugins={[backgroundPlugin, ...(logoPlugin ? [logoPlugin] : [])]}
      />
    </div>
  );
});

export default BranchAvailabilityLineChart; 