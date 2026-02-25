import React from 'react';
import { SlippageStatistics } from '../../analytics/types/analytics.types';

/**
 * Props for SlippageStats component
 */
interface SlippageStatsProps {
  /** Slippage statistics data */
  data: SlippageStatistics | null;
  /** Loading state */
  loading?: boolean;
  /** Bridge name for display */
  bridgeName?: string;
}

/**
 * SlippageStats Component
 *
 * Displays slippage distribution and statistics for a bridge route.
 * Includes histogram visualization and key metrics.
 */
export function SlippageStats({
  data,
  loading = false,
  bridgeName,
}: SlippageStatsProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Slippage Statistics
          {bridgeName && <span className="text-gray-500 dark:text-gray-400"> - {bridgeName}</span>}
        </h3>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Slippage Statistics
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p>No slippage data available</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.distribution.map((d) => d.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Slippage Statistics
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {data.bridgeName}: {data.sourceChain} → {data.destinationChain}
      </p>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Average</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {data.averageSlippagePercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Min / Max</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {data.minSlippagePercent.toFixed(2)}% / {data.maxSlippagePercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">High Slippage</p>
          <p className={`text-xl font-bold ${
            data.highSlippagePercentage > 10
              ? 'text-red-600 dark:text-red-400'
              : data.highSlippagePercentage > 5
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {data.highSlippagePercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.highSlippageCount} transfers
          </p>
        </div>
      </div>

      {/* Distribution Histogram */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Distribution
        </h4>
        <div className="space-y-2">
          {data.distribution.map((bucket, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-500 dark:text-gray-400 text-right">
                {bucket.range}
              </div>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className={`h-full rounded ${
                    bucket.range.includes('5%+') || bucket.range.includes('2-5%')
                      ? 'bg-red-500'
                      : bucket.range.includes('1-2%')
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                ></div>
              </div>
              <div className="w-16 text-xs text-gray-600 dark:text-gray-400">
                {bucket.count} ({bucket.percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Low (&lt;1%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Medium (1-2%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>High (&gt;2%)</span>
        </div>
      </div>
    </div>
  );
}

export default SlippageStats;
