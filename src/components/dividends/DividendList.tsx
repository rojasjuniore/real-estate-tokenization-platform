'use client';

import { useMemo } from 'react';
import { DividendCard, type DividendInfo } from './DividendCard';

interface DividendListProps {
  dividends: DividendInfo[];
  onClaim: (distributionId: bigint) => void;
  isLoading?: boolean;
  claimingId?: bigint;
}

export function DividendList({
  dividends,
  onClaim,
  isLoading = false,
  claimingId,
}: DividendListProps) {
  const { totalClaimable, unclaimedCount, paymentSymbol } = useMemo(() => {
    const unclaimed = dividends.filter((d) => !d.hasClaimed);
    const total = unclaimed.reduce((sum, d) => sum + d.claimableAmount, BigInt(0));
    return {
      totalClaimable: Number(total) / 1e6,
      unclaimedCount: unclaimed.length,
      paymentSymbol: dividends[0]?.paymentSymbol || 'USDT',
    };
  }, [dividends]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="mt-4 text-gray-500">Loading distributions...</p>
        </div>
      </div>
    );
  }

  if (dividends.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">No distributions available for this property yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{unclaimedCount} unclaimed distributions</p>
            <p className="text-lg font-bold text-blue-600">
              {totalClaimable.toLocaleString()} {paymentSymbol} available to claim
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {dividends.map((dividend) => (
          <DividendCard
            key={Number(dividend.distributionId)}
            dividend={dividend}
            onClaim={onClaim}
            isPending={claimingId === dividend.distributionId}
          />
        ))}
      </div>
    </div>
  );
}
