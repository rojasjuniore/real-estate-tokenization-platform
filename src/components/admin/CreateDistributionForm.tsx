'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface PaymentTokenOption {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

export interface PropertyOption {
  id: bigint;
  name: string;
}

export interface DistributionData {
  propertyId: bigint;
  amount: bigint;
  paymentToken: `0x${string}`;
}

interface CreateDistributionFormProps {
  paymentTokens: PaymentTokenOption[];
  properties: PropertyOption[];
  onSubmit: (data: DistributionData) => void;
  isPending?: boolean;
}

export function CreateDistributionForm({
  paymentTokens,
  properties,
  onSubmit,
  isPending = false,
}: CreateDistributionFormProps) {
  const [propertyId, setPropertyId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentToken, setPaymentToken] = useState<string>('');

  const selectedToken = useMemo(() => {
    return paymentTokens.find((t) => t.address === paymentToken);
  }, [paymentTokens, paymentToken]);

  const isValid = propertyId !== '' && amount !== '' && parseFloat(amount) > 0 && paymentToken !== '';

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid || !selectedToken) return;

      const amountWithDecimals = BigInt(
        Math.floor(parseFloat(amount) * Math.pow(10, selectedToken.decimals))
      );

      onSubmit({
        propertyId: BigInt(propertyId),
        amount: amountWithDecimals,
        paymentToken: paymentToken as `0x${string}`,
      });
    },
    [isValid, selectedToken, amount, propertyId, paymentToken, onSubmit]
  );

  const propertyOptions = properties.map((p) => ({
    value: p.id.toString(),
    label: p.name,
  }));

  const tokenOptions = paymentTokens.map((t) => ({
    value: t.address,
    label: t.symbol,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Create Distribution</h2>

        <div className="space-y-4">
          {/* Property Selector */}
          <Select
            label="Property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            options={propertyOptions}
            placeholder="Select a property"
            disabled={isPending}
          />

          {/* Amount Input */}
          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to distribute"
            min="0"
            step="0.01"
            disabled={isPending}
          />

          {/* Payment Token Selector */}
          <Select
            label="Payment Token"
            value={paymentToken}
            onChange={(e) => setPaymentToken(e.target.value)}
            options={tokenOptions}
            placeholder="Select payment token"
            disabled={isPending}
          />
        </div>

        {/* Preview */}
        {isValid && selectedToken && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-600">Distribution Preview</p>
            <p className="text-lg font-bold text-blue-600">
              {parseFloat(amount).toLocaleString()} {selectedToken.symbol}
            </p>
            <p className="text-sm text-gray-500">
              to {properties.find((p) => p.id.toString() === propertyId)?.name} token holders
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            type="submit"
            disabled={!isValid || isPending}
            isLoading={isPending}
            className="w-full"
          >
            {isPending ? 'Creating Distribution...' : 'Create Distribution'}
          </Button>
        </div>
      </div>
    </form>
  );
}
