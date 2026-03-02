'use client';

import { useState, useEffect } from 'react';
import { usePanelsStore } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';
import { useKYC } from '@/hooks/useKYC';

interface Dividend {
  id: string;
  dividendId: string;
  onChainDistributionId: number | null;
  propertyId: string;
  property: {
    name: string;
    tokenId: number;
  };
  amount: string;
  paymentToken: string;
  status: 'PENDING' | 'CLAIMABLE' | 'CLAIMED';
  distributedAt: string;
  claimedAt: string | null;
  txHash: string | null;
}

type ClaimStep = 'idle' | 'claiming' | 'confirming' | 'success' | 'error';

export function DividendsPanel() {
  const { closePanel, openPanel } = usePanelsStore();
  const { address, claimRoyalty } = useWeb3Auth();
  const { isApproved: kycApproved, isLoading: kycLoading } = useKYC();
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimStep, setClaimStep] = useState<ClaimStep>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchDividends() {
      try {
        const response = await fetch(`/api/user/dividends?wallet=${address}`);
        const data = await response.json();

        if (data.success) {
          setDividends(data.data || []);
        } else {
          setError(data.error?.message || 'Error cargando dividendos');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDividends();
  }, [address]);

  const handleBack = () => {
    closePanel();
    setTimeout(() => openPanel('account'), 100);
  };

  const handleClaim = async (dividend: Dividend) => {
    if (!dividend.onChainDistributionId) {
      setClaimError('Esta distribución aún no está disponible en blockchain');
      return;
    }

    setClaimingId(dividend.id);
    setClaimStep('claiming');
    setClaimError(null);
    setLastTxHash(null);

    try {
      // Step 1: Call smart contract to claim
      const result = await claimRoyalty(dividend.onChainDistributionId);

      if (!result.success) {
        throw new Error(result.error || 'Error al reclamar en blockchain');
      }

      setLastTxHash(result.txHash || null);
      setClaimStep('confirming');

      // Step 2: Update database
      const response = await fetch('/api/dividends/claim', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          claimIds: [dividend.id],
          txHash: result.txHash,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Transaction succeeded but DB update failed - still show success
        console.error('DB update failed:', data.error);
      }

      // Step 3: Update local state
      setDividends((prev) =>
        prev.map((d) =>
          d.id === dividend.id
            ? { ...d, status: 'CLAIMED' as const, txHash: result.txHash || null, claimedAt: new Date().toISOString() }
            : d
        )
      );

      setClaimStep('success');

      // Reset after showing success
      setTimeout(() => {
        setClaimStep('idle');
        setClaimingId(null);
        setLastTxHash(null);
      }, 3000);
    } catch (err) {
      console.error('Claim error:', err);
      setClaimError(err instanceof Error ? err.message : 'Error desconocido');
      setClaimStep('error');
      setClaimingId(null);
    }
  };

  const totalClaimable = dividends
    .filter(d => d.status === 'CLAIMABLE')
    .reduce((acc, d) => acc + parseFloat(d.amount), 0);

  const totalClaimed = dividends
    .filter(d => d.status === 'CLAIMED')
    .reduce((acc, d) => acc + parseFloat(d.amount), 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CLAIMABLE':
        return { label: 'Reclamar', color: 'text-green-600', bg: 'bg-green-100' };
      case 'CLAIMED':
        return { label: 'Reclamado', color: 'text-gray-500', bg: 'bg-gray-100' };
      case 'PENDING':
      default:
        return { label: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
        <p className="text-gray-500">Cargando dividendos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-primary-600">Mis Dividendos</h2>
      </div>

      {/* KYC Warning Banner */}
      {!kycLoading && !kycApproved && totalClaimable > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-[15px] p-4 mb-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Verificación KYC requerida</h4>
              <p className="text-xs text-yellow-700 mb-3">
                Para reclamar tus dividendos necesitas completar la verificación de identidad.
              </p>
              <button
                onClick={() => {
                  closePanel();
                  setTimeout(() => openPanel('kyc'), 100);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-medium hover:bg-yellow-600 transition"
              >
                Verificar Identidad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[15px] p-4 text-white">
          <p className="text-xs text-white/70 mb-1">Por Reclamar</p>
          <p className="text-xl font-bold">${totalClaimable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gray-100 rounded-[15px] p-4">
          <p className="text-xs text-gray-500 mb-1">Total Reclamado</p>
          <p className="text-xl font-bold text-gray-700">${totalClaimed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[15px] p-4 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Claim Error Banner */}
      {claimError && (
        <div className="bg-red-50 border border-red-200 rounded-[15px] p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">Error al reclamar</p>
              <p className="text-red-600 text-xs mt-1">{claimError}</p>
            </div>
            <button
              onClick={() => setClaimError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Claim Success Banner */}
      {claimStep === 'success' && lastTxHash && (
        <div className="bg-green-50 border border-green-200 rounded-[15px] p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-green-700 text-sm font-medium">¡Dividendo reclamado exitosamente!</p>
              <a
                href={`https://polygonscan.com/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 text-xs hover:underline flex items-center gap-1 mt-1"
              >
                Ver transacción
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Dividends List */}
      {dividends.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Sin dividendos aún</h3>
          <p className="text-gray-500 text-sm">
            Los dividendos aparecerán aquí cuando las propiedades en tu portafolio generen ingresos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dividends.map((dividend) => {
            const statusConfig = getStatusConfig(dividend.status);
            return (
              <div
                key={dividend.id}
                className="bg-white border border-gray-200 rounded-[15px] p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{dividend.property.name}</h4>
                    <p className="text-xs text-gray-500">Token #{dividend.property.tokenId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">
                      ${parseFloat(dividend.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(dividend.distributedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {dividend.status === 'CLAIMABLE' && (
                    kycApproved ? (
                      <button
                        onClick={() => handleClaim(dividend)}
                        disabled={claimingId === dividend.id}
                        className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {claimingId === dividend.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {claimStep === 'claiming' ? 'Firmando...' : claimStep === 'confirming' ? 'Confirmando...' : 'Procesando...'}
                          </>
                        ) : (
                          'Reclamar'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          closePanel();
                          setTimeout(() => openPanel('kyc'), 100);
                        }}
                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium hover:bg-yellow-200 transition flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Verificar KYC
                      </button>
                    )
                  )}

                  {dividend.status === 'CLAIMED' && dividend.txHash && (
                    <a
                      href={`https://polygonscan.com/tx/${dividend.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      Ver TX
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
