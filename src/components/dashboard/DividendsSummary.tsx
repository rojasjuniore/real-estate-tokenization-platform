"use client";

import { useState } from "react";

interface DividendsSummaryProps {
  pendingAmount?: string;
  claimedThisMonth?: string;
  totalClaimed?: string;
  nextDistribution?: Date;
  onClaim?: () => Promise<void>;
  isClaimable?: boolean;
}

/**
 * DividendsSummary - Displays pending dividends summary with claim functionality
 *
 * Usage:
 * <DividendsSummary
 *   pendingAmount="$125.50"
 *   claimedThisMonth="$87.30"
 *   totalClaimed="$1,245.00"
 *   nextDistribution={new Date("2024-01-01")}
 *   onClaim={async () => { await claimDividends(); }}
 *   isClaimable={true}
 * />
 */
export function DividendsSummary({
  pendingAmount = "$0.00",
  claimedThisMonth = "$0.00",
  totalClaimed = "$0.00",
  nextDistribution,
  onClaim,
  isClaimable = false,
}: DividendsSummaryProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const handleClaim = async () => {
    if (!onClaim || !isClaimable) return;

    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(false);

    try {
      await onClaim();
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 3000);
    } catch (error) {
      setClaimError(
        error instanceof Error ? error.message : "Failed to claim dividends"
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const formatDistributionDate = (date: Date) => {
    const days = Math.ceil(
      (date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  const hasPending = parseFloat(pendingAmount.replace(/[^0-9.-]+/g, "")) > 0;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Pending Dividends
          </h3>
          <p className="text-sm text-gray-400">Available to claim</p>
        </div>
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-4xl font-bold text-white mb-2">{pendingAmount}</p>
        {nextDistribution && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Next distribution: {formatDistributionDate(nextDistribution)}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleClaim}
        disabled={!isClaimable || !hasPending || isClaiming}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          isClaimable && hasPending && !isClaiming
            ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Claiming...
          </span>
        ) : claimSuccess ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Claimed Successfully!
          </span>
        ) : isClaimable && hasPending ? (
          "Claim Dividends"
        ) : !hasPending ? (
          "No Dividends Available"
        ) : (
          "Claim Unavailable"
        )}
      </button>

      {claimError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{claimError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div>
          <p className="text-xs text-gray-400 mb-1">This Month</p>
          <p className="text-lg font-semibold text-white">{claimedThisMonth}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Total Claimed</p>
          <p className="text-lg font-semibold text-white">{totalClaimed}</p>
        </div>
      </div>
    </div>
  );
}
