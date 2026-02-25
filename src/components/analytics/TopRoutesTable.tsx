import React, { useState } from 'react';
import { BridgeAnalytics } from '../../analytics/types/analytics.types';

/**
 * Props for TopRoutesTable component
 */
interface TopRoutesTableProps {
  /** Analytics data array */
  analyticsData: BridgeAnalytics[];
  /** Loading state */
  loading?: boolean;
  /** Total count for pagination info */
  total?: number;
}

type SortField = 'bridgeName' | 'totalTransfers' | 'successRate' | 'averageSettlementTimeMs' | 'totalVolume';
type SortDirection = 'asc' | 'desc';

/**
 * TopRoutesTable Component
 *
 * Displays a sortable table of top bridge routes with key metrics.
 * Supports pagination and sorting by multiple columns.
 */
export function TopRoutesTable({
  analyticsData,
  loading = false,
  total = 0,
}: TopRoutesTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalTransfers');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sort data
  const sortedData = React.useMemo(() => {
    return [...analyticsData].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'bridgeName':
          aValue = a.bridgeName;
          bValue = b.bridgeName;
          break;
        case 'totalTransfers':
          aValue = a.totalTransfers;
          bValue = b.totalTransfers;
          break;
        case 'successRate':
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        case 'averageSettlementTimeMs':
          aValue = a.averageSettlementTimeMs || Infinity;
          bValue = b.averageSettlementTimeMs || Infinity;
          break;
        case 'totalVolume':
          aValue = a.totalVolume;
          bValue = b.totalVolume;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [analyticsData, sortField, sortDirection]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Format duration
  const formatDuration = (ms: number | null): string => {
    if (ms === null || ms === Infinity) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 10l5-5 5 5H5z" />
          <path d="M5 10l5 5 5-5H5z" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 10l5-5 5 5H5z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 10l5 5 5-5H5z" />
      </svg>
    );
  };

  if (loading && analyticsData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Routes
        </h3>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Routes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {total > 0 ? `Showing ${analyticsData.length} of ${total} routes` : 'No routes available'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('bridgeName')}
              >
                Bridge
                <SortIndicator field="bridgeName" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Route
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('totalTransfers')}
              >
                Transfers
                <SortIndicator field="totalTransfers" />
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('successRate')}
              >
                Success Rate
                <SortIndicator field="successRate" />
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('averageSettlementTimeMs')}
              >
                Avg Time
                <SortIndicator field="averageSettlementTimeMs" />
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('totalVolume')}
              >
                Volume
                <SortIndicator field="totalVolume" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((route, index) => (
              <tr
                key={`${route.bridgeName}-${route.sourceChain}-${route.destinationChain}-${index}`}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {route.bridgeName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {route.bridgeName}
                      </div>
                      {route.token && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {route.token}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="capitalize">{route.sourceChain}</span>
                    <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="capitalize">{route.destinationChain}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {route.totalTransfers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {route.successfulTransfers.toLocaleString()} successful
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          route.successRate >= 95
                            ? 'bg-green-500'
                            : route.successRate >= 80
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(route.successRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${
                      route.successRate >= 95
                        ? 'text-green-600 dark:text-green-400'
                        : route.successRate >= 80
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {route.successRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                  {formatDuration(route.averageSettlementTimeMs)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {route.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No analytics data available</p>
        </div>
      )}
    </div>
  );
}

export default TopRoutesTable;
