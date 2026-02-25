import React from 'react';
import { BridgeAnalytics } from '../../analytics/types/analytics.types';

/**
 * Props for UsageChart component
 */
interface UsageChartProps {
  /** Analytics data array */
  analyticsData: BridgeAnalytics[];
  /** Loading state */
  loading?: boolean;
}

/**
 * UsageChart Component
 *
 * Displays a bar chart of transfer counts by route.
 * Uses SVG for lightweight rendering without external chart dependencies.
 */
export function UsageChart({
  analyticsData,
  loading = false,
}: UsageChartProps) {
  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (analyticsData.length === 0) return [];

    // Sort by total transfers descending and take top 8
    return [...analyticsData]
      .sort((a, b) => b.totalTransfers - a.totalTransfers)
      .slice(0, 8)
      .map((item) => ({
        label: `${item.bridgeName}\n${item.sourceChain} → ${item.destinationChain}`,
        shortLabel: item.bridgeName,
        value: item.totalTransfers,
        successful: item.successfulTransfers,
        failed: item.failedTransfers,
      }));
  }, [analyticsData]);

  // Chart dimensions
  const height = 250;
  const barWidth = 40;
  const gap = 16;
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transfer Volume by Route
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transfer Volume by Route
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map((d) => d.value)) || 1;
  const chartWidth = chartData.length * (barWidth + gap) + padding.left + padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxValue / yTicks) * i),
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Transfer Volume by Route
      </h3>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grid lines */}
        {yTickValues.map((tick, i) => {
          const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                className="text-gray-500"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                className="fill-gray-500 dark:fill-gray-400"
              >
                {tick.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {chartData.map((item, index) => {
          const x = padding.left + index * (barWidth + gap) + gap / 2;
          const barHeight = (item.value / maxValue) * chartHeight;
          const y = padding.top + chartHeight - barHeight;

          // Successful portion
          const successHeight = item.value > 0
            ? (item.successful / item.value) * barHeight
            : 0;
          const failHeight = barHeight - successHeight;

          return (
            <g key={index}>
              {/* Success bar (green) */}
              <rect
                x={x}
                y={y + failHeight}
                width={barWidth}
                height={successHeight}
                fill="#10b981"
                rx={2}
              />
              {/* Fail bar (red) - stacked on bottom */}
              {failHeight > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={failHeight}
                  fill="#ef4444"
                  rx={2}
                />
              )}
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                className="fill-gray-700 dark:fill-gray-300"
              >
                {item.value}
              </text>
              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                className="fill-gray-600 dark:fill-gray-400"
              >
                {item.shortLabel}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth={1}
          className="text-gray-300 dark:text-gray-600"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={chartWidth - padding.right}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth={1}
          className="text-gray-300 dark:text-gray-600"
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Successful</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Failed</span>
        </div>
      </div>
    </div>
  );
}

export default UsageChart;
