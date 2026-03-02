"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
}

/**
 * StatsCard - Displays a metric with title, value, optional change percentage, and icon
 *
 * Usage:
 * <StatsCard
 *   title="Total Value"
 *   value="$12,345"
 *   change={5.2}
 *   icon={<svg>...</svg>}
 *   iconBgColor="bg-purple-500/20"
 *   iconColor="text-purple-400"
 * />
 */
export function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor = "bg-purple-500/20",
  iconColor = "text-purple-400",
  valueColor = "text-white",
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">{title}</p>
          <p className={`text-2xl font-bold ${valueColor} mb-2`}>{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
