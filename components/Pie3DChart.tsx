import React, { useRef } from 'react';
import { Pie, getElementAtEvent } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface Pie3DChartProps {
  data: number[];
  labels: string[];
  backgroundColors?: string[];
  onSegmentClick?: (index: number) => void;
}

const blueShades = [
  '#60a5fa', // light blue
  '#3b82f6', // blue
  '#2563eb', // dark blue
  '#1d4ed8', // deeper blue
  '#1e40af', // navy blue
  '#1e3a8a', // even deeper blue
  '#0ea5e9', // cyan blue
];

export default function Pie3DChart({ data, labels, backgroundColors = blueShades, onSegmentClick }: Pie3DChartProps) {
  const pieRef = useRef<any>(null);

  const pieData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: '#181a2e',
        borderWidth: 2,
        hoverOffset: 16,
        hoverBorderColor: '#fff',
        hoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.chart?.data?.labels?.[context.dataIndex] ?? '';
            const value = context.dataset?.data?.[context.dataIndex] ?? '';
            return `${label}: ${value}`;
          }
        },
        backgroundColor: 'rgba(30,30,47,0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 2,
        cornerRadius: 10,
        caretSize: 8,
        boxPadding: 8,
        displayColors: false,
      },
      datalabels: {
        color: '#fff',
        font: (context: any) => {
          // Make font smaller for small segments
          const value = context.dataset.data[context.dataIndex];
          return {
            weight: 'bold',
            size: value < 10 ? 12 : value < 20 ? 16 : 20,
          };
        },
        formatter: function(_value: any, context: any) {
          return context.chart.data.labels[context.dataIndex];
        },
        anchor: 'center',
        align: 'center',
        clamp: true,
        clip: false,
        rotation: (context: any) => {
          // Rotate text to be vertical for small segments
          const value = context.dataset.data[context.dataIndex];
          return value < 15 ? 90 : 0;
        },
      },
    },
    cutout: 0, // No donut/circle in the middle
    animation: {
      animateScale: true,
      animateRotate: true,
    },
    layout: {
      padding: 20,
    },
    elements: {
      arc: {
        borderJoinStyle: 'round',
        borderAlign: 'center',
        borderWidth: 2,
      },
    },
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pieRef.current) return;
    const elements = getElementAtEvent(pieRef.current, event);
    if (elements && elements.length > 0 && onSegmentClick) {
      const index = elements[0].index;
      onSegmentClick(index);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: 520, width: 520, maxWidth: '100%', position: 'relative' }}>
        <Pie ref={pieRef} data={pieData} options={options} onClick={handleClick} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
} 