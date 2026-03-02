"use client";

import { useMemo } from "react";

interface PortfolioDataPoint {
  date: string;
  value: number;
}

interface PortfolioChartProps {
  data?: PortfolioDataPoint[];
  title?: string;
  height?: number;
}

/**
 * PortfolioChart - Displays a line chart visualization of portfolio value over time
 *
 * Usage:
 * <PortfolioChart
 *   data={[
 *     { date: "2024-01", value: 1000 },
 *     { date: "2024-02", value: 1200 },
 *   ]}
 *   title="Portfolio Value"
 *   height={300}
 * />
 */
export function PortfolioChart({
  data = [],
  title = "Portfolio Performance",
  height = 300,
}: PortfolioChartProps) {
  const { points, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) {
      return { points: "", maxValue: 0, minValue: 0 };
    }

    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const chartHeight = height - 60;
    const chartWidth = 100;
    const step = chartWidth / Math.max(data.length - 1, 1);

    const pathPoints = data
      .map((point, index) => {
        const x = index * step;
        const y = chartHeight - ((point.value - min) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    return { points: pathPoints, maxValue: max, minValue: min };
  }, [data, height]);

  const hasData = data.length > 0;

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-sm text-gray-400 hover:text-white transition">
            1W
          </button>
          <button className="px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded-lg">
            1M
          </button>
          <button className="px-3 py-1 text-sm text-gray-400 hover:text-white transition">
            3M
          </button>
          <button className="px-3 py-1 text-sm text-gray-400 hover:text-white transition">
            1Y
          </button>
        </div>
      </div>

      {hasData ? (
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            viewBox={`0 0 100 ${height - 60}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={`0,${height - 60} ${points} 100,${height - 60}`}
              fill="url(#chartGradient)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#a855f7"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="absolute top-0 left-0 text-xs text-gray-400">
            ${maxValue.toLocaleString()}
          </div>
          <div className="absolute bottom-0 left-0 text-xs text-gray-400">
            ${minValue.toLocaleString()}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-center bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-700"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <p className="text-gray-400 text-sm">No data available</p>
            <p className="text-gray-500 text-xs mt-1">
              Chart will appear once you have investment history
            </p>
          </div>
        </div>
      )}

      {hasData && data.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
          <span>{data[0].date}</span>
          <span>{data[data.length - 1].date}</span>
        </div>
      )}
    </div>
  );
}
