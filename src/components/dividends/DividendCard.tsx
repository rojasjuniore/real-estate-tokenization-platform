'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';

export interface DividendInfo {
  distributionId: bigint;
  propertyId: bigint;
  propertyName: string;
  totalAmount: bigint;
  claimableAmount: bigint;
  paymentToken: `0x${string}`;
  paymentSymbol: string;
  createdAt: bigint;
  hasClaimed: boolean;
}

interface DividendCardProps {
  dividend: DividendInfo;
  onClaim: (distributionId: bigint) => void;
  isPending?: boolean;
}

export function DividendCard({
  dividend,
  onClaim,
  isPending = false,
}: DividendCardProps) {
  const formattedTotalAmount = useMemo(() => {
    // Assuming 6 decimals for stablecoins
    return Number(dividend.totalAmount) / 1e6;
  }, [dividend.totalAmount]);

  const formattedClaimableAmount = useMemo(() => {
    return Number(dividend.claimableAmount) / 1e6;
  }, [dividend.claimableAmount]);

  const formattedDate = useMemo(() => {
    const date = new Date(Number(dividend.createdAt) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [dividend.createdAt]);

  const canClaim = !dividend.hasClaimed && dividend.claimableAmount > BigInt(0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">#{Number(dividend.distributionId)}</span>
            {dividend.hasClaimed && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Claimed
              </span>
            )}
          </div>
          <h3 className="mt-1 font-semibold text-gray-900">{dividend.propertyName}</h3>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-sm text-gray-500">Total Distribution</p>
          <p className="text-lg font-bold text-gray-900">
            {formattedTotalAmount.toLocaleString()} {dividend.paymentSymbol}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-gray-500">Your Share</p>
          <p className="text-lg font-bold text-blue-600">
            {formattedClaimableAmount.toLocaleString()} {dividend.paymentSymbol}
          </p>
        </div>
      </div>

      {/* Action */}
      {!dividend.hasClaimed && (
        <div className="mt-4">
          <Button
            onClick={() => onClaim(dividend.distributionId)}
            disabled={!canClaim || isPending}
            isLoading={isPending}
            className="w-full"
          >
            {isPending ? 'Claiming...' : 'Claim'}
          </Button>
        </div>
      )}
    </div>
  );
}
