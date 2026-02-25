import React from 'react';
import { BridgeAnalytics } from '../../analytics/types/analytics.types';

/**
 * Props for PerformanceMetrics component
 */
interface PerformanceMetricsProps {
  /** Analytics data array */
  analyticsData: BridgeAnalytics[];
  /** Loading state */
  loading?: boolean;
}

/**
 * PerformanceMetrics Component
 *
 * Displays key performance metrics in a card grid layout.
 * Shows total transfers, success rate, average settlement time, and total volume.
 */
export function PerformanceMetrics({
  analyticsData,
  loading = false,
}: PerformanceMetricsProps) {
  // Calculate aggregated metrics
  const metrics = React.useMemo(() => {
    if (analyticsData.length === 0) {
      return {
        totalTransfers: 0,
        successfulTransfers: 0,
        failedTransfers: 0,
        overallSuccessRate: 0,
        avgSettlementTime: 0,
        totalVolume: 0,
        activeRoutes: 0,
      };
    }

    const totalTransfers = analyticsData.reduce(
      (sum, a) => sum + a.totalTransfers,
      0,
    );
    const successfulTransfers = analyticsData.reduce(
      (sum, a) => sum + a.successfulTransfers,
      0,
    );
    const failedTransfers = analyticsData.reduce(
      (sum, a) => sum + a.failedTransfers,
      0,
    );

    const overallSuccessRate =
      totalTransfers > 0 ? (successfulTransfers / totalTransfers) * 100 : 0;

    // Average settlement time (weighted by successful transfers)
    const routesWithTiming = analyticsData.filter(
      (a) => a.averageSettlementTimeMs && a.successfulTransfers > 0,
    );
    const avgSettlementTime =
      routesWithTiming.length > 0
        ? routesWithTiming.reduce(
            (sum, a) =>
              sum + (a.averageSettlementTimeMs || 0) * a.successfulTransfers,
            0,
          ) /
          routesWithTiming.reduce((sum, a) => sum + a.successfulTransfers, 0)
        : 0;

    const totalVolume = analyticsData.reduce(
      (sum, a) => sum + a.totalVolume,
      0,
    );

    const activeRoutes = analyticsData.filter((a) => a.totalTransfers > 0).length;

    return {
      totalTransfers,
      successfulTransfers,
      failedTransfers,
      overallSuccessRate,
      avgSettlementTime,
      totalVolume,
      activeRoutes,
    };
  }, [analyticsData]);

  // Format milliseconds to human-readable string
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  // Metric card data
  const cards = [
    {
      title: 'Total Transfers',
      value: metrics.totalTransfers.toLocaleString(),
      subtitle: `${metrics.successfulTransfers.toLocaleString()} successful`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
      color: 'blue',
    },
    {
      title: 'Success Rate',
      value: `${metrics.overallSuccessRate.toFixed(1)}%`,
      subtitle: `${metrics.failedTransfers.toLocaleString()} failed`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: metrics.overallSuccessRate >= 95 ? 'green' : metrics.overallSuccessRate >= 80 ? 'yellow' : 'red',
    },
    {
      title: 'Avg Settlement',
      value: formatDuration(metrics.avgSettlementTime),
      subtitle: 'Per successful transfer',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'purple',
    },
    {
      title: 'Total Volume',
      value: metrics.totalVolume.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
      subtitle: `${metrics.activeRoutes} active routes`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'indigo',
    },
  ];

  // Color classes mapping
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: 'text-yellow-600 dark:text-yellow-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-700 dark:text-indigo-400',
      icon: 'text-indigo-600 dark:text-indigo-400',
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        return (
          <div
            key={index}
            className={`${colors.bg} rounded-lg p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                {loading ? (
                  <div className="mt-2 h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className={`mt-2 text-2xl font-bold ${colors.text}`}>
                    {card.value}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {card.subtitle}
                </p>
              </div>
              <div className={`${colors.icon}`}>{card.icon}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PerformanceMetrics;
