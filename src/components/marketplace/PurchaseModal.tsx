'use client';

import { useState, useCallback, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface ListingInfo {
  id: bigint;
  seller: `0x${string}`;
  propertyId: bigint;
  propertyName: string;
  amount: bigint;
  pricePerToken: bigint;
  paymentToken: `0x${string}`;
  paymentSymbol: string;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ListingInfo;
  onPurchase: (quantity: bigint) => void;
  isPending?: boolean;
}

export function PurchaseModal({
  isOpen,
  onClose,
  listing,
  onPurchase,
  isPending = false,
}: PurchaseModalProps) {
  const [quantity, setQuantity] = useState('1');

  const quantityBigInt = useMemo(() => {
    try {
      const parsed = parseInt(quantity, 10);
      return isNaN(parsed) || parsed < 0 ? BigInt(0) : BigInt(parsed);
    } catch {
      return BigInt(0);
    }
  }, [quantity]);

  const totalPrice = useMemo(() => {
    return quantityBigInt * listing.pricePerToken;
  }, [quantityBigInt, listing.pricePerToken]);

  const formattedPricePerToken = useMemo(() => {
    // Assuming 6 decimals for stablecoins
    return Number(listing.pricePerToken) / 1e6;
  }, [listing.pricePerToken]);

  const formattedTotalPrice = useMemo(() => {
    return Number(totalPrice) / 1e6;
  }, [totalPrice]);

  const availableFractions = Number(listing.amount);

  const isQuantityValid = quantityBigInt > BigInt(0) && quantityBigInt <= listing.amount;
  const exceedsAvailable = quantityBigInt > listing.amount;

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setQuantity(value || '0');
  }, []);

  const handleMaxClick = useCallback(() => {
    setQuantity(listing.amount.toString());
  }, [listing.amount]);

  const handleConfirm = useCallback(() => {
    if (isQuantityValid) {
      onPurchase(quantityBigInt);
    }
  }, [isQuantityValid, quantityBigInt, onPurchase]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Fractions" size="md">
      <div className="space-y-6">
        {/* Property Info */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">{listing.propertyName}</h3>
          <p className="text-sm text-gray-500">
            {availableFractions.toLocaleString()} fractions available
          </p>
        </div>

        {/* Price Info */}
        <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
          <span className="text-gray-600">Price per fraction</span>
          <span className="text-lg font-bold text-green-600">
            {formattedPricePerToken.toLocaleString()} {listing.paymentSymbol}
          </span>
        </div>

        {/* Quantity Input */}
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Quantity"
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={handleQuantityChange}
                error={exceedsAvailable ? 'Quantity exceeds available fractions' : undefined}
                disabled={isPending}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxClick}
              disabled={isPending}
              className="mb-1"
            >
              Max
            </Button>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-blue-600">
            {formattedTotalPrice.toLocaleString()} {listing.paymentSymbol}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isQuantityValid || isPending}
            isLoading={isPending}
            className="flex-1"
          >
            {isPending ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500">
          By confirming, you agree to purchase {quantity} fraction(s) for{' '}
          {formattedTotalPrice.toLocaleString()} {listing.paymentSymbol}
        </p>
      </div>
    </Modal>
  );
}
