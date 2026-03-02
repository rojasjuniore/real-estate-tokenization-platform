'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/lib/web3auth';
import { brandConfig } from '@/config/brand.config';

type DistributionStep = 'idle' | 'approving' | 'creating' | 'syncing' | 'done' | 'error';

interface Property {
  id: string;
  name: string;
  tokenId: number;
  totalFractions?: number;
  availableFractions?: number;
  images?: string[];
}

interface DividendStats {
  totalHolders: number;
  claimedCount: number;
  pendingCount?: number;
  claimedAmount: number;
  pendingAmount?: number;
  claimPercentage: number;
  totalClaimableAmount?: number;
  totalTokensHeld?: number;
}

interface Holder {
  id: string;
  userAddress: string;
  userName: string | null;
  userEmail: string | null;
  tokenAmount: number;
  dividendAmount: number;
  claimed: boolean;
  claimedAt: string | null;
  txHash: string | null;
}

interface Dividend {
  id: string;
  property: Property;
  totalAmount: number;
  amountPerToken: number;
  paymentToken: string;
  period: string;
  status: string;
  approvalTxHash?: string | null;
  txHash?: string | null;
  distributedAt?: string;
  createdAt?: string;
  stats: DividendStats;
  holders?: Holder[];
}

interface CreateFormData {
  propertyId: string;
  totalAmount: string;
  paymentToken: string;
  period: string;
}

interface WalletBalances {
  address: string;
  pol: { balance: string; formatted: string };
  tokens: Record<string, { balance: string; formatted: string }>;
}

export default function AdminDividendsPage() {
  const router = useRouter();
  const {
    isConnected,
    address,
    isLoading: authLoading,
  } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail modal state
  const [selectedDividend, setSelectedDividend] = useState<Dividend | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionStep, setDistributionStep] = useState<DistributionStep>('idle');
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [distributionTxHash, setDistributionTxHash] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFormData>({
    propertyId: '',
    totalAmount: '',
    paymentToken: 'USDT',
    period: '',
  });

  // Distribution wallet balances
  const [walletBalances, setWalletBalances] = useState<WalletBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isConnected) {
      router.replace('/#home');
      return;
    }

    async function checkAdmin() {
      try {
        const response = await fetch('/api/admin/check', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();

        if (data.success && data.data.isAdmin) {
          setIsAdmin(true);
        } else {
          router.replace('/#home');
        }
      } catch {
        router.replace('/#home');
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    checkAdmin();
  }, [isConnected, address, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadData() {
      try {
        const [dividendsRes, propertiesRes] = await Promise.all([
          fetch('/api/admin/dividends', {
            headers: { 'x-wallet-address': address || '' },
          }),
          fetch('/api/properties'),
        ]);

        const dividendsData = await dividendsRes.json();
        const propertiesData = await propertiesRes.json();

        if (!dividendsData.success) {
          throw new Error(dividendsData.error?.message || 'Error loading dividends');
        }

        setDividends(dividendsData.data || []);

        if (propertiesData.success) {
          const props = propertiesData.data?.properties || propertiesData.data || [];
          setProperties(props);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isAdmin, address]);

  // Load distribution wallet balances
  const loadWalletBalances = async () => {
    setIsLoadingBalances(true);
    try {
      const res = await fetch('/api/admin/distribution-wallet', {
        headers: { 'x-wallet-address': address || '' },
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalances(data.data);
      }
    } catch (err) {
      console.error('Error loading wallet balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !address) return;
    loadWalletBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/dividends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          totalAmount: parseFloat(formData.totalAmount),
          paymentToken: formData.paymentToken,
          period: formData.period,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      // Reload dividends
      const reloadRes = await fetch('/api/admin/dividends', {
        headers: { 'x-wallet-address': address || '' },
      });
      const reloadData = await reloadRes.json();
      if (reloadData.success) {
        setDividends(reloadData.data);
      }

      setShowCreateForm(false);
      setFormData({ propertyId: '', totalAmount: '', paymentToken: 'USDT', period: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating distribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load dividend detail with holders
  const loadDividendDetail = async (dividendId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/dividends/${dividendId}`, {
        headers: { 'x-wallet-address': address || '' },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSelectedDividend(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (dividend: Dividend) => {
    loadDividendDetail(dividend.id);
  };

  const handleDistribute = async () => {
    if (!selectedDividend) return;

    setIsDistributing(true);
    setDistributionStep('creating');
    setError(null);
    setApprovalTxHash(null);
    setDistributionTxHash(null);

    try {
      // All blockchain operations now happen on the backend
      console.log('Distributing dividend via backend...');

      const response = await fetch(`/api/admin/dividends/${selectedDividend.id}/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        setDistributionStep('error');
        return;
      }

      // Set transaction hashes from response
      if (data.data.blockchain) {
        setApprovalTxHash(data.data.blockchain.approvalTxHash || null);
        setDistributionTxHash(data.data.blockchain.txHash || null);
      }

      setDistributionStep('done');

      // Reload dividends
      const reloadRes = await fetch('/api/admin/dividends', {
        headers: { 'x-wallet-address': address || '' },
      });
      const reloadData = await reloadRes.json();
      if (reloadData.success) {
        setDividends(reloadData.data);
      }

      // Close modal after short delay to show success
      setTimeout(() => {
        setSelectedDividend(null);
        setDistributionStep('idle');
        setApprovalTxHash(null);
        setDistributionTxHash(null);
      }, 3000);
    } catch (err: unknown) {
      console.error('Distribution error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error distributing';
      setError(errorMessage);
      setDistributionStep('error');
    } finally {
      setIsDistributing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      DISTRIBUTED: 'bg-green-100 text-green-700 border border-green-300',
      CANCELLED: 'bg-red-100 text-red-700 border border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Distribuciones</h1>
          <p className="text-gray-500">Gestiona las distribuciones de dividendos</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[15px] transition font-medium"
        >
          Nueva Distribución
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Distribution Wallet Balances */}
      <div className="mb-6 bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-600">Wallet de Distribución</h2>
          <button
            onClick={loadWalletBalances}
            disabled={isLoadingBalances}
            className="text-sm text-primary-600 hover:text-[#0b3d66] flex items-center gap-1"
          >
            <svg className={`w-4 h-4 ${isLoadingBalances ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {isLoadingBalances ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : walletBalances ? (
          <div className="space-y-4">
            {/* Wallet Address */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-[10px]">
              <span className="text-sm text-gray-500">Dirección:</span>
              <code className="text-sm font-mono text-primary-600">{walletBalances.address}</code>
              <button
                onClick={() => navigator.clipboard.writeText(walletBalances.address)}
                className="ml-auto text-gray-400 hover:text-primary-600"
                title="Copiar dirección"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <a
                href={`https://polygonscan.com/address/${walletBalances.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600"
                title="Ver en PolygonScan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* POL Balance (Gas) */}
              <div className={`p-4 rounded-[10px] ${Number(walletBalances.pol.formatted) < 1 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-xs text-gray-500 mb-1">POL (Gas)</p>
                <p className={`text-xl font-bold ${Number(walletBalances.pol.formatted) < 1 ? 'text-red-600' : 'text-green-600'}`}>
                  {Number(walletBalances.pol.formatted).toFixed(4)}
                </p>
                {Number(walletBalances.pol.formatted) < 1 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Fondear gas</p>
                )}
              </div>

              {/* USDT Balance */}
              <div className="p-4 bg-gray-50 rounded-[10px] border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">USDT</p>
                <p className="text-xl font-bold text-primary-600">
                  ${Number(walletBalances.tokens.USDT?.formatted || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* USDC Balance */}
              <div className="p-4 bg-gray-50 rounded-[10px] border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">USDC</p>
                <p className="text-xl font-bold text-primary-600">
                  ${Number(walletBalances.tokens.USDC?.formatted || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Total Stablecoins */}
              <div className="p-4 bg-blue-50 rounded-[10px] border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">Total Disponible</p>
                <p className="text-xl font-bold text-blue-600">
                  ${(Number(walletBalances.tokens.USDT?.formatted || 0) + Number(walletBalances.tokens.USDC?.formatted || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Info Note */}
            <p className="text-xs text-gray-400 mt-2">
              💡 Para distribuir dividendos, fondea esta wallet con USDT/USDC y POL para gas.
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No se pudo cargar la información de la wallet</p>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-[15px] p-8 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-2xl font-bold text-primary-600 mb-6">Crear Distribución</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-600 mb-2">
                  Propiedad
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] text-gray-800 focus:border-primary-600 outline-none"
                  required
                >
                  <option value="">Seleccionar propiedad</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-600 mb-2">
                  Monto Total
                </label>
                <input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 outline-none"
                  placeholder="10000"
                  required
                />
              </div>

              <div>
                <label htmlFor="paymentToken" className="block text-sm font-medium text-gray-600 mb-2">
                  Token de Pago
                </label>
                <select
                  id="paymentToken"
                  name="paymentToken"
                  value={formData.paymentToken}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] text-gray-800 focus:border-primary-600 outline-none"
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-600 mb-2">
                  Período
                </label>
                <input
                  type="text"
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 outline-none"
                  placeholder="2024-Q1"
                  required
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 text-gray-500 hover:text-primary-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[10px] transition font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal with Holders */}
      {selectedDividend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-[15px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary-600">{selectedDividend.property.name}</h2>
                  <p className="text-gray-500">Período: {selectedDividend.period}</p>
                </div>
                <button
                  onClick={() => setSelectedDividend(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading */}
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
              </div>
            ) : (
              <>
                {/* Stats Summary */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-[10px] p-4">
                      <p className="text-sm text-gray-500">Monto Total</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ${selectedDividend.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{selectedDividend.paymentToken}</p>
                    </div>
                    <div className="bg-gray-50 rounded-[10px] p-4">
                      <p className="text-sm text-gray-500">Por Token</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ${selectedDividend.amountPerToken.toFixed(4)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-[10px] p-4">
                      <p className="text-sm text-gray-500">Holders</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {selectedDividend.stats.totalHolders}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-[10px] p-4">
                      <p className="text-sm text-gray-500">Estado</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedDividend.status)}`}>
                        {selectedDividend.status}
                      </span>
                    </div>
                  </div>

                  {selectedDividend.status === 'DISTRIBUTED' && (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-[10px] p-4">
                          <p className="text-sm text-gray-500">Reclamados</p>
                          <p className="text-xl font-bold text-green-600">
                            {selectedDividend.stats.claimedCount} / {selectedDividend.stats.totalHolders}
                            <span className="text-sm font-normal ml-2">
                              ({selectedDividend.stats.claimPercentage.toFixed(0)}%)
                            </span>
                          </p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-[10px] p-4">
                          <p className="text-sm text-gray-500">Pendientes</p>
                          <p className="text-xl font-bold text-yellow-600">
                            ${(selectedDividend.stats.pendingAmount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Transaction Hashes for Distributed Dividends */}
                      {(selectedDividend.approvalTxHash || selectedDividend.txHash) && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-[10px] space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Transacciones en Blockchain:</p>
                          {selectedDividend.approvalTxHash && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-24">Aprobación:</span>
                              <a
                                href={`https://polygonscan.com/tx/${selectedDividend.approvalTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-mono"
                              >
                                <span>{selectedDividend.approvalTxHash.slice(0, 10)}...{selectedDividend.approvalTxHash.slice(-8)}</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                          {selectedDividend.txHash && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-24">Distribución:</span>
                              <a
                                href={`https://polygonscan.com/tx/${selectedDividend.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-500 hover:text-green-600 flex items-center gap-1 font-mono"
                              >
                                <span>{selectedDividend.txHash.slice(0, 10)}...{selectedDividend.txHash.slice(-8)}</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Holders List */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold text-primary-600 mb-4">
                    Desglose por Holder ({selectedDividend.holders?.length || 0})
                  </h3>

                  {selectedDividend.holders && selectedDividend.holders.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDividend.holders.map((holder, index) => (
                        <div
                          key={holder.id}
                          className={`flex items-center justify-between p-4 rounded-[10px] ${
                            holder.claimed ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-[#3d5a80] flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-800 font-mono">
                                  {formatAddress(holder.userAddress)}
                                </p>
                                {holder.userName && (
                                  <span className="text-sm text-gray-500">({holder.userName})</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {holder.tokenAmount.toLocaleString()} tokens
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">
                              ${holder.dividendAmount.toFixed(2)}
                            </p>
                            {holder.claimed ? (
                              <span className="text-xs text-green-600">Reclamado</span>
                            ) : (
                              <span className="text-xs text-yellow-600">Pendiente</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay holders para esta distribución
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {selectedDividend.status === 'PENDING' && (
                  <div className="p-6 border-t border-gray-200 bg-white">
                    {/* Distribution Steps Progress */}
                    {distributionStep !== 'idle' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {/* Step 1: Approve */}
                            <div className={`flex items-center gap-2 ${
                              distributionStep === 'approving' ? 'text-yellow-500' :
                              ['creating', 'syncing', 'done'].includes(distributionStep) ? 'text-green-500' :
                              distributionStep === 'error' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                              {distributionStep === 'approving' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : ['creating', 'syncing', 'done'].includes(distributionStep) ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-current" />
                              )}
                              <span className="text-sm">Aprobar</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-200" />
                            {/* Step 2: Create */}
                            <div className={`flex items-center gap-2 ${
                              distributionStep === 'creating' ? 'text-yellow-500' :
                              ['syncing', 'done'].includes(distributionStep) ? 'text-green-500' :
                              distributionStep === 'error' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                              {distributionStep === 'creating' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : ['syncing', 'done'].includes(distributionStep) ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-current" />
                              )}
                              <span className="text-sm">Crear en Blockchain</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-200" />
                            {/* Step 3: Sync */}
                            <div className={`flex items-center gap-2 ${
                              distributionStep === 'syncing' ? 'text-yellow-500' :
                              distributionStep === 'done' ? 'text-green-500' :
                              'text-gray-400'
                            }`}>
                              {distributionStep === 'syncing' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : distributionStep === 'done' ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-current" />
                              )}
                              <span className="text-sm">Sincronizar</span>
                            </div>
                          </div>
                        </div>

                        {/* Success Message */}
                        {distributionStep === 'done' && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-[10px]">
                            <p className="text-green-600 text-sm font-medium">
                              ✓ Distribución creada exitosamente en blockchain
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transaction Hashes - Always visible when they exist */}
                    {(approvalTxHash || distributionTxHash) && (
                      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-[10px] space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Transacciones:</p>
                        {approvalTxHash && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-24">Aprobación:</span>
                            <a
                              href={`https://polygonscan.com/tx/${approvalTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-mono"
                            >
                              <span>{approvalTxHash.slice(0, 10)}...{approvalTxHash.slice(-8)}</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                        {distributionTxHash && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-24">Distribución:</span>
                            <a
                              href={`https://polygonscan.com/tx/${distributionTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-500 hover:text-green-600 flex items-center gap-1 font-mono"
                            >
                              <span>{distributionTxHash.slice(0, 10)}...{distributionTxHash.slice(-8)}</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Se distribuirán <span className="text-primary-600 font-bold">${selectedDividend.totalAmount.toLocaleString()}</span> {selectedDividend.paymentToken} a{' '}
                          <span className="text-primary-600 font-bold">{selectedDividend.stats.totalHolders}</span> holders
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Requiere 2 transacciones: aprobar tokens + crear distribución
                        </p>
                      </div>
                      <button
                        onClick={handleDistribute}
                        disabled={isDistributing || distributionStep === 'done'}
                        className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDistributing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            {distributionStep === 'approving' && 'Aprobando...'}
                            {distributionStep === 'creating' && 'Creando...'}
                            {distributionStep === 'syncing' && 'Sincronizando...'}
                          </>
                        ) : distributionStep === 'done' ? (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Completado
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Distribuir en Blockchain
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Dividends List */}
      {dividends.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">No hay distribuciones</h3>
          <p className="text-gray-500 mb-6">Crea tu primera distribución de dividendos</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[15px] transition font-medium"
          >
            Crear Primera Distribución
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Propiedad</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Período</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Monto Total</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Por Token</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Holders</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dividends.map((dividend) => (
                <tr key={dividend.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-primary-600 font-medium">{dividend.property.name}</p>
                      <p className="text-sm text-gray-500">Token #{dividend.property.tokenId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800">{dividend.period}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800 font-medium">
                      ${Number(dividend.totalAmount).toLocaleString()} {dividend.paymentToken}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary-600 font-medium">
                      ${Number(dividend.amountPerToken).toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(dividend.status)}`}>
                      {dividend.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-800">
                        {dividend.stats.claimedCount} / {dividend.stats.totalHolders}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({dividend.stats.claimPercentage.toFixed(0)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetail(dividend)}
                      className="text-primary-600 hover:text-[#0b3d66] font-medium mr-4"
                    >
                      Ver Detalle
                    </button>
                    {dividend.status === 'PENDING' && (
                      <button
                        onClick={() => handleViewDetail(dividend)}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Distribuir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
