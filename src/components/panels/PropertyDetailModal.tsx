'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { usePropertyStore, useNotificationStore } from '@/store';
import { useBuyTokens, useIsKYCApproved, useListing } from '@/hooks/useMarketplace';
import { CONTRACT_ADDRESSES } from '@/lib/web3/config';

const PAYMENT_TOKENS = {
  usdt: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`,
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
  matic: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

type PaymentMethod = 'usdt' | 'usdc' | 'matic' | '';

interface ValidationState {
  isValid: boolean;
  error: string | null;
  needsApproval: boolean;
  isValidating: boolean;
}

export function PropertyDetailModal() {
  const { selectedProperty, isModalOpen, clearSelection } = usePropertyStore();
  const { addNotification } = useNotificationStore();
  const { address, isConnected } = useAccount();
  const [tokenAmount, setTokenAmount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    error: null,
    needsApproval: false,
    isValidating: false,
  });

  // Get listing from blockchain
  const listingId = selectedProperty?.listingId ? BigInt(selectedProperty.listingId) : null;
  const { listing, isLoading: isListingLoading } = useListing(listingId);

  // Debug logs
  console.log('[PropertyDetailModal] selectedProperty:', selectedProperty);
  console.log('[PropertyDetailModal] listingId:', listingId?.toString());
  console.log('[PropertyDetailModal] listing from chain:', listing);

  // KYC check
  const { isKYCApproved, isLoading: isKYCLoading } = useIsKYCApproved(address);

  // Buy hook
  const { buy, isPending, isConfirming, isSuccess, isError, error } = useBuyTokens();

  // Approval hook
  const { writeContractAsync: approveToken, data: approvalHash } = useWriteContract();
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ hash: approvalHash });

  // Get native balance (MATIC)
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Get ERC20 token balance
  const paymentTokenAddress = paymentMethod && paymentMethod !== 'matic'
    ? PAYMENT_TOKENS[paymentMethod]
    : undefined;

  const { data: tokenBalance } = useReadContract({
    address: paymentTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!paymentTokenAddress },
  });

  // Get ERC20 allowance
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: paymentTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.marketplace] : undefined,
    query: { enabled: !!address && !!paymentTokenAddress },
  });

  const totalCost = selectedProperty ? tokenAmount * selectedProperty.pricePerToken : 0;
  const isProcessing = isPending || isConfirming;

  // Validate purchase conditions
  const validatePurchase = useCallback(() => {
    if (!selectedProperty) {
      return { isValid: false, error: null, needsApproval: false, isValidating: false };
    }

    // Check wallet connection
    if (!isConnected || !address) {
      return { isValid: false, error: 'Conecta tu wallet para comprar', needsApproval: false, isValidating: false };
    }

    // Check KYC
    if (isKYCLoading) {
      return { isValid: false, error: null, needsApproval: false, isValidating: true };
    }
    if (!isKYCApproved) {
      return { isValid: false, error: 'Debes completar la verificación KYC antes de comprar', needsApproval: false, isValidating: false };
    }

    // Check listing exists
    if (!selectedProperty.listingId) {
      return { isValid: false, error: 'Esta propiedad no tiene un listing activo', needsApproval: false, isValidating: false };
    }

    // Check listing on-chain
    if (isListingLoading) {
      return { isValid: false, error: null, needsApproval: false, isValidating: true };
    }
    if (!listing || !listing.active) {
      return { isValid: false, error: 'El listing no está activo en blockchain', needsApproval: false, isValidating: false };
    }

    // Check payment method selected
    if (!paymentMethod) {
      return { isValid: false, error: 'Selecciona un método de pago', needsApproval: false, isValidating: false };
    }

    // Check amount
    if (tokenAmount <= 0) {
      return { isValid: false, error: 'La cantidad debe ser mayor a 0', needsApproval: false, isValidating: false };
    }

    // Check available tokens
    if (listing && BigInt(tokenAmount) > listing.amount) {
      return { isValid: false, error: `Solo hay ${listing.amount.toString()} tokens disponibles`, needsApproval: false, isValidating: false };
    }

    const isNativePayment = paymentMethod === 'matic';
    const decimals = isNativePayment ? 18 : 6;
    const requiredAmount = parseUnits(totalCost.toString(), decimals);

    // Check balance
    if (isNativePayment) {
      if (!nativeBalance || nativeBalance.value < requiredAmount) {
        const available = nativeBalance ? formatUnits(nativeBalance.value, 18) : '0';
        return {
          isValid: false,
          error: `Saldo MATIC insuficiente. Tienes ${parseFloat(available).toFixed(4)} MATIC`,
          needsApproval: false,
          isValidating: false
        };
      }
    } else {
      if (tokenBalance === undefined || tokenBalance < requiredAmount) {
        const available = tokenBalance !== undefined ? formatUnits(tokenBalance, 6) : '0';
        return {
          isValid: false,
          error: `Saldo ${paymentMethod.toUpperCase()} insuficiente. Tienes ${parseFloat(available).toFixed(2)} ${paymentMethod.toUpperCase()}`,
          needsApproval: false,
          isValidating: false
        };
      }

      // Check allowance for ERC20
      if (tokenAllowance === undefined || tokenAllowance < requiredAmount) {
        return { isValid: true, error: null, needsApproval: true, isValidating: false };
      }
    }

    return { isValid: true, error: null, needsApproval: false, isValidating: false };
  }, [
    selectedProperty, isConnected, address, isKYCLoading, isKYCApproved,
    isListingLoading, listing, paymentMethod, tokenAmount, totalCost,
    nativeBalance, tokenBalance, tokenAllowance
  ]);

  // Update validation when dependencies change
  useEffect(() => {
    const result = validatePurchase();
    setValidation(result);
  }, [validatePurchase]);

  // Refetch allowance after approval
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
      setIsApproving(false);
      addNotification({
        type: 'success',
        title: 'Aprobación exitosa',
        message: `Has aprobado el uso de ${paymentMethod.toUpperCase()}`,
      });
    }
  }, [isApprovalSuccess, refetchAllowance, paymentMethod, addNotification]);

  // Handle successful purchase
  useEffect(() => {
    if (isSuccess && selectedProperty) {
      addNotification({
        type: 'success',
        title: 'Compra exitosa',
        message: `Has comprado ${tokenAmount} tokens de ${selectedProperty.name}`,
      });
      setShowPurchaseForm(false);
      clearSelection();
    }
  }, [isSuccess, selectedProperty, tokenAmount, addNotification, clearSelection]);

  // Handle purchase error
  useEffect(() => {
    if (isError && error) {
      addNotification({
        type: 'error',
        title: 'Error en la compra',
        message: error.message || 'No se pudo completar la compra',
      });
    }
  }, [isError, error, addNotification]);

  if (!selectedProperty) return null;

  const handleApprove = async () => {
    if (!paymentMethod || paymentMethod === 'matic') return;

    setIsApproving(true);
    try {
      const decimals = 6;
      const amountToApprove = parseUnits(totalCost.toString(), decimals);

      await approveToken({
        address: PAYMENT_TOKENS[paymentMethod],
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.marketplace, amountToApprove],
      });
    } catch (err) {
      console.error('Approval error:', err);
      setIsApproving(false);
      addNotification({
        type: 'error',
        title: 'Error en aprobación',
        message: 'No se pudo aprobar el token',
      });
    }
  };

  const handlePurchase = async () => {
    // Re-validate before purchase
    const currentValidation = validatePurchase();
    console.log('[handlePurchase] validation:', currentValidation);

    if (!currentValidation.isValid || currentValidation.needsApproval) {
      console.log('[handlePurchase] Validation failed, not proceeding');
      return;
    }

    try {
      const isNativePayment = paymentMethod === 'matic';
      const decimals = isNativePayment ? 18 : 6;
      const valueInWei = isNativePayment
        ? parseUnits(totalCost.toString(), decimals)
        : undefined;

      const buyParams = {
        listingId: BigInt(selectedProperty.listingId!),
        amount: BigInt(tokenAmount),
        value: valueInWei,
      };

      console.log('[handlePurchase] Calling buy with params:', {
        listingId: buyParams.listingId.toString(),
        amount: buyParams.amount.toString(),
        value: buyParams.value?.toString(),
        paymentMethod,
        totalCost,
      });

      await buy(buyParams);
    } catch (err) {
      console.error('[handlePurchase] Purchase error:', err);
    }
  };

  const getButtonState = () => {
    if (!isConnected) {
      return { text: 'CONECTAR WALLET', disabled: true };
    }
    if (validation.isValidating) {
      return { text: 'VALIDANDO...', disabled: true };
    }
    if (validation.error) {
      return { text: 'COMPRAR', disabled: true };
    }
    if (isApproving) {
      return { text: 'APROBANDO...', disabled: true };
    }
    if (validation.needsApproval) {
      return { text: `APROBAR ${paymentMethod.toUpperCase()}`, disabled: false, action: 'approve' };
    }
    if (isProcessing) {
      return { text: 'PROCESANDO...', disabled: true };
    }
    return { text: 'COMPRAR', disabled: false, action: 'buy' };
  };

  const buttonState = getButtonState();

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={clearSelection}
            className="fixed inset-0 bg-black/40 z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-white rounded-3xl shadow-xl z-50 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={clearSelection}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--neutral-600)] hover:bg-white hover:text-[var(--neutral-900)] transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row h-full">
              {/* Image Section */}
              <div className="relative md:w-3/5 h-64 md:h-auto">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${selectedProperty.imageUrl || '/placeholder-property.jpg'})`,
                  }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Property Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-1">{selectedProperty.name}</h2>
                  <p className="text-lg opacity-90">{selectedProperty.location}</p>

                  {/* Invest Button */}
                  <button
                    onClick={() => setShowPurchaseForm(!showPurchaseForm)}
                    className="mt-4 pill-button bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green-dark)]"
                  >
                    Invertir con Cripto
                  </button>
                </div>

                {/* Purchase Form Overlay */}
                {showPurchaseForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute top-4 left-4 right-4 bg-[var(--accent-green)] rounded-2xl p-5 text-white"
                  >
                    <h3 className="font-semibold mb-1">Invertir con Cripto</h3>
                    <p className="text-sm opacity-90 mb-4">Comprar Fracciones</p>

                    {/* Token Amount */}
                    <div className="mb-3">
                      <label className="text-sm opacity-90">Número de Tokens</label>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => setTokenAmount(Math.max(1, tokenAmount - 1))}
                          className="w-10 h-10 rounded-full border border-white/50 flex items-center justify-center hover:bg-white/10"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className="flex-1 h-10 bg-white/20 border border-white/30 rounded-full text-center text-white placeholder-white/50"
                        />
                        <button
                          onClick={() => setTokenAmount(tokenAmount + 1)}
                          className="w-10 h-10 rounded-full border border-white/50 flex items-center justify-center hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="mb-3">
                      <label className="text-sm opacity-90">Costo</label>
                      <input
                        type="text"
                        value={`$${totalCost.toLocaleString()} USD`}
                        readOnly
                        className="w-full h-10 bg-white/20 border border-white/30 rounded-full px-4 text-white mt-1"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="mb-4">
                      <label className="text-sm opacity-90">Método de pago</label>
                      <div className="relative mt-1">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full h-10 bg-white/20 border border-white/30 rounded-full px-4 text-white appearance-none"
                        >
                          <option value="" className="text-black">Seleccionar...</option>
                          <option value="usdt" className="text-black">USDT</option>
                          <option value="usdc" className="text-black">USDC</option>
                          <option value="matic" className="text-black">MATIC</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Validation Error Message */}
                    {validation.error && (
                      <div className="mb-3 p-2 bg-red-500/20 border border-red-400/50 rounded-lg text-sm">
                        {validation.error}
                      </div>
                    )}

                    {/* Approval Info */}
                    {validation.needsApproval && !validation.error && (
                      <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-400/50 rounded-lg text-sm">
                        Debes aprobar el uso de {paymentMethod.toUpperCase()} antes de comprar
                      </div>
                    )}

                    {/* Validating Spinner */}
                    {validation.isValidating && (
                      <div className="mb-3 p-2 bg-blue-500/20 border border-blue-400/50 rounded-lg text-sm flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Validando...
                      </div>
                    )}

                    {/* Buy/Approve Button */}
                    <button
                      onClick={buttonState.action === 'approve' ? handleApprove : handlePurchase}
                      disabled={buttonState.disabled}
                      className="w-full pill-button bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {(isProcessing || isApproving || validation.isValidating) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      )}
                      {buttonState.text}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Info Section */}
              <div className="md:w-2/5 p-6 overflow-y-auto">
                {/* Stats */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                    <span className="text-[var(--foreground-secondary)]">Valor de la fracción</span>
                    <span className="text-xl font-bold text-[var(--primary-600)]">
                      {selectedProperty.pricePerToken} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                    <span className="text-[var(--foreground-secondary)]">Fracciones Restantes</span>
                    <span className="text-xl font-bold text-[var(--primary-600)]">
                      {selectedProperty.availableTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                    <span className="text-[var(--foreground-secondary)]">Rentabilidad Estimada</span>
                    <span className="text-xl font-bold text-[var(--primary-600)]">
                      {selectedProperty.expectedYield}%*
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Descripción</h3>
                  <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Learn More Button */}
                <button className="mt-6 pill-button bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] w-full">
                  Saber Más
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
