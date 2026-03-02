'use client';

import { useState, useCallback } from 'react';
import { useWeb3Auth } from '@/lib/web3auth';

// Contract addresses
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS || '';
const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const USDT_DECIMALS = 6;

// Minimum MATIC required for gas (in wei) - approximately 0.01 MATIC
const MIN_MATIC_FOR_GAS = BigInt('10000000000000000'); // 0.01 MATIC

export interface PurchaseValidationError {
  code:
    | 'WALLET_NOT_CONNECTED'
    | 'KYC_NOT_APPROVED'
    | 'KYC_CHECKING'
    | 'INSUFFICIENT_USDT'
    | 'INSUFFICIENT_MATIC'
    | 'INSUFFICIENT_ALLOWANCE'
    | 'PROPERTY_NOT_AVAILABLE'
    | 'PRICE_NOT_SET'
    | 'TOKENS_NOT_AVAILABLE'
    | 'NETWORK_ERROR'
    | 'USER_REJECTED'
    | 'APPROVAL_FAILED'
    | 'TRANSACTION_FAILED'
    | 'UNKNOWN_ERROR';
  message: string;
  details?: {
    required?: string;
    available?: string;
    difference?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: PurchaseValidationError;
  balances?: {
    usdt: string;
    matic: string;
  };
  priceInfo?: {
    pricePerToken: string;
    totalCost: string;
    currentAllowance: string;
  };
}

export interface ValidationStep {
  id: 'wallet' | 'kyc' | 'balance_usdt' | 'balance_matic' | 'allowance' | 'availability';
  label: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  error?: string;
}

export function usePurchaseValidation() {
  const { provider, address, isConnected } = useWeb3Auth();
  const [isValidating, setIsValidating] = useState(false);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);

  const updateStep = (id: ValidationStep['id'], updates: Partial<ValidationStep>) => {
    setValidationSteps(prev =>
      prev.map(step => step.id === id ? { ...step, ...updates } : step)
    );
  };

  const validatePurchase = useCallback(async (
    propertyId: number,
    amount: number,
    isKYCApproved: boolean | null,
    isKYCLoading: boolean
  ): Promise<ValidationResult> => {
    setIsValidating(true);

    // Initialize validation steps
    const initialSteps: ValidationStep[] = [
      { id: 'wallet', label: 'Conexión de wallet', status: 'pending' },
      { id: 'kyc', label: 'Verificación KYC', status: 'pending' },
      { id: 'balance_usdt', label: 'Balance de USDT', status: 'pending' },
      { id: 'balance_matic', label: 'MATIC para gas', status: 'pending' },
      { id: 'availability', label: 'Disponibilidad de tokens', status: 'pending' },
    ];
    setValidationSteps(initialSteps);

    try {
      // Step 1: Check wallet connection
      updateStep('wallet', { status: 'checking' });

      if (!isConnected || !provider || !address) {
        updateStep('wallet', { status: 'error', error: 'Wallet no conectada' });
        return {
          isValid: false,
          error: {
            code: 'WALLET_NOT_CONNECTED',
            message: 'Conecta tu wallet para continuar con la compra.',
          },
        };
      }
      updateStep('wallet', { status: 'success' });

      // Step 2: Check KYC
      updateStep('kyc', { status: 'checking' });

      if (isKYCLoading) {
        updateStep('kyc', { status: 'error', error: 'Verificando KYC...' });
        return {
          isValid: false,
          error: {
            code: 'KYC_CHECKING',
            message: 'Verificando tu estado de KYC. Por favor espera...',
          },
        };
      }

      if (isKYCApproved !== true) {
        updateStep('kyc', { status: 'error', error: 'KYC no aprobado' });
        return {
          isValid: false,
          error: {
            code: 'KYC_NOT_APPROVED',
            message: 'Debes completar la verificación KYC antes de comprar. Ve a tu perfil para iniciar el proceso.',
          },
        };
      }
      updateStep('kyc', { status: 'success' });

      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // Step 3: Get property price from contract
      updateStep('availability', { status: 'checking' });

      const propertyIdHex = propertyId.toString(16).padStart(64, '0');
      const getPriceData = '0x0789752c' + propertyIdHex; // getPropertyPrice(uint256)

      const priceResult = await typedProvider.request({
        method: 'eth_call',
        params: [{
          to: MARKETPLACE_ADDRESS,
          data: getPriceData,
        }, 'latest'],
      });

      if (!priceResult || priceResult === '0x') {
        updateStep('availability', { status: 'error', error: 'Precio no configurado' });
        return {
          isValid: false,
          error: {
            code: 'PRICE_NOT_SET',
            message: 'El precio de esta propiedad no está configurado. Contacta al administrador.',
          },
        };
      }

      const pricePerToken = BigInt('0x' + priceResult.slice(2, 66));

      if (pricePerToken === BigInt(0)) {
        updateStep('availability', { status: 'error', error: 'Propiedad no disponible' });
        return {
          isValid: false,
          error: {
            code: 'PROPERTY_NOT_AVAILABLE',
            message: 'Esta propiedad no está disponible para compra directa.',
          },
        };
      }

      const totalCost = pricePerToken * BigInt(amount);
      updateStep('availability', { status: 'success' });

      // Step 4: Check USDT balance
      updateStep('balance_usdt', { status: 'checking' });

      const addressHex = address.slice(2).toLowerCase().padStart(64, '0');
      const balanceOfData = '0x70a08231' + addressHex;

      const usdtBalanceHex = await typedProvider.request({
        method: 'eth_call',
        params: [{
          to: USDT_ADDRESS,
          data: balanceOfData,
        }, 'latest'],
      });

      const usdtBalance = usdtBalanceHex ? BigInt(usdtBalanceHex) : BigInt(0);
      const usdtBalanceFormatted = (Number(usdtBalance) / 10 ** USDT_DECIMALS).toFixed(2);
      const totalCostFormatted = (Number(totalCost) / 10 ** USDT_DECIMALS).toFixed(2);

      if (usdtBalance < totalCost) {
        const difference = totalCost - usdtBalance;
        const differenceFormatted = (Number(difference) / 10 ** USDT_DECIMALS).toFixed(2);

        updateStep('balance_usdt', {
          status: 'error',
          error: `Faltan ${differenceFormatted} USDT`
        });

        return {
          isValid: false,
          error: {
            code: 'INSUFFICIENT_USDT',
            message: `No tienes suficiente USDT para esta compra.`,
            details: {
              required: `${totalCostFormatted} USDT`,
              available: `${usdtBalanceFormatted} USDT`,
              difference: `${differenceFormatted} USDT`,
            },
          },
          balances: {
            usdt: usdtBalanceFormatted,
            matic: '0',
          },
        };
      }
      updateStep('balance_usdt', { status: 'success' });

      // Step 5: Check MATIC balance for gas
      updateStep('balance_matic', { status: 'checking' });

      const maticBalance = await typedProvider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      const maticBalanceWei = maticBalance ? BigInt(maticBalance) : BigInt(0);
      const maticBalanceFormatted = (Number(maticBalanceWei) / 10 ** 18).toFixed(4);

      if (maticBalanceWei < MIN_MATIC_FOR_GAS) {
        const minMaticFormatted = (Number(MIN_MATIC_FOR_GAS) / 10 ** 18).toFixed(4);

        updateStep('balance_matic', {
          status: 'error',
          error: 'Insuficiente MATIC para gas'
        });

        return {
          isValid: false,
          error: {
            code: 'INSUFFICIENT_MATIC',
            message: `Necesitas MATIC para pagar el gas de la transacción.`,
            details: {
              required: `~${minMaticFormatted} MATIC`,
              available: `${maticBalanceFormatted} MATIC`,
            },
          },
          balances: {
            usdt: usdtBalanceFormatted,
            matic: maticBalanceFormatted,
          },
        };
      }
      updateStep('balance_matic', { status: 'success' });

      // Step 6: Check current allowance
      const spenderHex = MARKETPLACE_ADDRESS.slice(2).toLowerCase().padStart(64, '0');
      const allowanceData = '0xdd62ed3e' + addressHex + spenderHex;

      const allowanceResult = await typedProvider.request({
        method: 'eth_call',
        params: [{
          to: USDT_ADDRESS,
          data: allowanceData,
        }, 'latest'],
      });

      const currentAllowance = allowanceResult ? BigInt(allowanceResult) : BigInt(0);
      const allowanceFormatted = (Number(currentAllowance) / 10 ** USDT_DECIMALS).toFixed(2);

      // All validations passed
      return {
        isValid: true,
        balances: {
          usdt: usdtBalanceFormatted,
          matic: maticBalanceFormatted,
        },
        priceInfo: {
          pricePerToken: (Number(pricePerToken) / 10 ** USDT_DECIMALS).toFixed(2),
          totalCost: totalCostFormatted,
          currentAllowance: allowanceFormatted,
        },
      };

    } catch (error) {
      console.error('[usePurchaseValidation] Error:', error);

      return {
        isValid: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
        },
      };
    } finally {
      setIsValidating(false);
    }
  }, [provider, address, isConnected]);

  /**
   * Parse blockchain/wallet errors into user-friendly messages
   */
  const parseTransactionError = useCallback((error: unknown): PurchaseValidationError => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLower = errorMessage.toLowerCase();

    // User rejected transaction
    if (errorLower.includes('user rejected') ||
        errorLower.includes('user denied') ||
        errorLower.includes('rejected the request') ||
        (error as { code?: number })?.code === 4001) {
      return {
        code: 'USER_REJECTED',
        message: 'Transacción cancelada. Vuelve a intentar cuando estés listo.',
      };
    }

    // Insufficient funds for gas
    if (errorLower.includes('insufficient funds') ||
        errorLower.includes('gas required exceeds')) {
      return {
        code: 'INSUFFICIENT_MATIC',
        message: 'No tienes suficiente MATIC para pagar el gas de la transacción.',
      };
    }

    // ERC20 transfer errors
    if (errorLower.includes('transfer amount exceeds balance') ||
        errorLower.includes('erc20: transfer amount exceeds balance')) {
      return {
        code: 'INSUFFICIENT_USDT',
        message: 'No tienes suficiente USDT. Tu balance ha cambiado desde la última verificación.',
      };
    }

    // Allowance errors
    if (errorLower.includes('allowance') ||
        errorLower.includes('erc20: insufficient allowance')) {
      return {
        code: 'INSUFFICIENT_ALLOWANCE',
        message: 'Error de autorización. Recarga la página e intenta de nuevo.',
      };
    }

    // Approval failed
    if (errorLower.includes('approval') && errorLower.includes('failed')) {
      return {
        code: 'APPROVAL_FAILED',
        message: 'No se pudo autorizar el gasto de USDT. Intenta de nuevo.',
      };
    }

    // Transaction reverted
    if (errorLower.includes('reverted') ||
        errorLower.includes('revert') ||
        errorLower.includes('execution reverted')) {
      return {
        code: 'TRANSACTION_FAILED',
        message: 'La transacción falló. Puede que los tokens ya no estén disponibles.',
      };
    }

    // Network errors
    if (errorLower.includes('network') ||
        errorLower.includes('timeout') ||
        errorLower.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Error de conexión con la red. Verifica tu internet e intenta de nuevo.',
      };
    }

    // Unknown error
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
    };
  }, []);

  return {
    validatePurchase,
    parseTransactionError,
    isValidating,
    validationSteps,
  };
}
