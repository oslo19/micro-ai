import { useEffect, useState, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Lazy load the chart component
const DoughnutChart = lazy(() => import('./DoughnutChart'));

interface PatternStat {
  attempted: number;
  correct: number;
}

interface UserProgress {
  totalScore: number;
  gamesPlayed: number;
  correctAnswers: number;
  averageAttempts: number;
  patternStats: Record<string, PatternStat>;
  createdAt: Date;
}

// Add getSuccessRate function at the top level
const getSuccessRate = (correct: number, attempted: number): string => {
  if (attempted === 0) return '0.0';
  return ((correct / attempted) * 100).toFixed(1);
};

// Fallback component for stats
const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <p className="text-gray-600">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

export function Profile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [chartError, setChartError] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.uid}`);
          const data = await response.json();
          setUserData(data);
          setUserProgress(data.progress);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    }

    fetchUserData();
  }, [user]);

  const patternData = {
    labels: Object.keys(userProgress?.patternStats || {}).map(type => 
      `${type} (${getSuccessRate(
        userProgress?.patternStats[type].correct || 0,
        userProgress?.patternStats[type].attempted || 0
      )}%)`
    ),
    datasets: [{
      label: 'Success Rate by Pattern Type',
      data: Object.values(userProgress?.patternStats || {}).map(stat => 
        (stat.correct / stat.attempted) * 100 || 0
      ),
      backgroundColor: [
        'rgba(52, 211, 153, 0.8)',  // emerald
        'rgba(59, 130, 246, 0.8)',  // blue
        'rgba(251, 146, 60, 0.8)',  // orange
        'rgba(167, 139, 250, 0.8)'  // purple
      ]
    }]
  };

  // Add chart options
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Success Rate: ${context.parsed.toFixed(1)}%`;
          }
        }
      }
    }
  };

  const getRecommendation = () => {
    const stats = Object.entries(userProgress?.patternStats || {});
    const weakestPattern = stats.reduce((prev, curr) => {
      const prevRate = (prev[1].correct / prev[1].attempted) || 0;
      const currRate = (curr[1].correct / curr[1].attempted) || 0;
      return currRate < prevRate ? curr : prev;
    });
    return `Focus on ${weakestPattern[0]} patterns to improve your overall performance.`;
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Pattern Performance</h2>
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading chart...</div>}>
          {!chartError ? (
            <DoughnutChart 
              data={patternData} 
              options={chartOptions}
              onError={() => setChartError(true)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(userProgress?.patternStats || {}).map(([type, stats]) => (
                <StatCard
                  key={type}
                  label={type}
                  value={`${((stats.correct / stats.attempted) * 100 || 0).toFixed(1)}%`}
                  color="text-emerald-500"
                />
              ))}
            </div>
          )}
        </Suspense>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Overall Stats</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Total Score</p>
            <p className="text-3xl font-bold text-emerald-500">{userProgress?.totalScore}</p>
          </div>
          <div>
            <p className="text-gray-600">Success Rate</p>
            <p className="text-3xl font-bold text-blue-500">
              {(((userProgress?.correctAnswers || 0) / (userProgress?.gamesPlayed || 1)) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Games Played</p>
            <p className="text-3xl font-bold text-orange-500">{userProgress?.gamesPlayed}</p>
          </div>
          <div>
            <p className="text-gray-600">Average Attempts</p>
            <p className="text-3xl font-bold text-purple-500">{userProgress?.averageAttempts.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
          <p className="text-emerald-800">{getRecommendation()}</p>
        </div>
      </div>
    </div>
  );

  if (!userProgress || !userData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Profile & Progress</h1>
        <div className="text-gray-600 mb-6">
          <p>Email: {user?.email}</p>
          <p>Member since: {new Date(userData.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {renderStats()}
    </div>
  );
} 