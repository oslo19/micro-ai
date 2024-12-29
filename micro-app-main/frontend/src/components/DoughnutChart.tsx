import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { ErrorBoundary } from './ErrorBoundary';

// Register required components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

interface DoughnutChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
    }[];
  };
  options?: {
    plugins?: {
      legend?: {
        position?: 'bottom' | 'top' | 'left' | 'right';
        labels?: {
          font?: {
            size?: number;
          };
        };
      };
      tooltip?: {
        callbacks?: {
          label?: (context: any) => string;
        };
      };
    };
  };
  onError: () => void;
}

export default function DoughnutChart({ data, options, onError }: DoughnutChartProps) {
  return (
    <div className="relative h-64">
      <ErrorBoundary fallback={<div>Failed to load chart</div>} onError={onError}>
        <Doughnut 
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            ...options
          }}
        />
      </ErrorBoundary>
    </div>
  );
} 