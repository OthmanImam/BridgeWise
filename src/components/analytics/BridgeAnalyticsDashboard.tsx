import React from 'react';
import { useBridgeAnalytics, useTopPerformingBridges } from '../../hooks/useBridgeAnalytics';
import { PerformanceMetrics } from './PerformanceMetrics';
import { TopRoutesTable } from './TopRoutesTable';
import { UsageChart } from './UsageChart';

/**
 * Props for BridgeAnalyticsDashboard
 */
interface BridgeAnalyticsDashboardProps {
  /** Optional bridge name filter */
  bridgeName?: string;
  /** Optional source chain filter */
  sourceChain?: string;
  /** Optional destination chain filter */
  destinationChain?: string;
  /** Optional CSS class name */
  className?: string;
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
}

/**
 * BridgeAnalyticsDashboard Component
 *
 * Main dashboard container for BridgeWise analytics.
 * Displays usage metrics, performance statistics, and top routes.
 * Supports light/dark themes via CSS variables.
 *
 * @example
 * ```tsx
 * <BridgeAnalyticsDashboard
 *   bridgeName="hop"
 *   refreshInterval={30000}
 * />
 * ```
 */
export function BridgeAnalyticsDashboard({
  bridgeName,
  sourceChain,
  destinationChain,
  className = '',
  refreshInterval = 30000,
}: BridgeAnalyticsDashboardProps) {
  const {
    analyticsData,
    loading,
    error,
    total,
    refetch,
  } = useBridgeAnalytics({
    bridgeName,
    sourceChain,
    destinationChain,
    refreshInterval,
    limit: 10,
  });

  const {
    data: topPerforming,
    loading: topLoading,
  } = useTopPerformingBridges({ limit: 5 });

  if (error) {
    return (
      <div className={`p-6 rounded-lg bg-red-50 dark:bg-red-900/20 ${className}`}>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Error Loading Analytics
        </h3>
        <p className="text-red-600 dark:text-red-300 mt-2">
          {error.message}
        </p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bridge Analytics
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor bridge usage, performance, and trends
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Performance Metrics Cards */}
      <PerformanceMetrics
        analyticsData={analyticsData}
        loading={loading}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <UsageChart
          analyticsData={analyticsData}
          loading={loading}
        />

        {/* Top Performing Bridges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Bridges
          </h3>
          {topLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : topPerforming ? (
            <div className="space-y-4">
              {/* By Volume */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  By Volume
                </h4>
                <div className="space-y-2">
                  {topPerforming.byVolume.slice(0, 3).map((route, index) => (
                    <div
                      key={`${route.bridgeName}-${index}`}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {route.bridgeName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {route.totalVolume.toFixed(2)} total
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Success Rate */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  By Success Rate
                </h4>
                <div className="space-y-2">
                  {topPerforming.bySuccessRate.slice(0, 3).map((route, index) => (
                    <div
                      key={`${route.bridgeName}-${index}`}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {route.bridgeName}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {route.successRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Top Routes Table */}
      <TopRoutesTable
        analyticsData={analyticsData}
        loading={loading}
        total={total}
      />

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {analyticsData.length} of {total} routes
      </div>
    </div>
  );
}

export default BridgeAnalyticsDashboard;
