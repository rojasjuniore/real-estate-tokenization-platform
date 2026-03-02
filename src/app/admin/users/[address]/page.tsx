'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/web3auth';
import { CHAIN_CONFIG } from '@/lib/web3auth/config';

interface UserDetail {
  id: string;
  walletAddress: string;
  email: string | null;
  name: string | null;
  profileImage: string | null;
  role: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioItem {
  id: string;
  tokenAmount: number;
  property: {
    id: string;
    name: string;
    location: string;
    pricePerFraction: string;
    totalFractions: number;
    status: string;
    images: string[];
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  tokenAmount: number | null;
  txHash: string;
  status: string;
  createdAt: string;
  propertyId: string | null;
}

interface KYCSubmission {
  id: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  adminNotes: string | null;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const walletAddress = (params?.address as string) || '';
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycSubmission, setKycSubmission] = useState<KYCSubmission | null>(null);

  // Check admin access
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

  // Load user data
  useEffect(() => {
    if (!isAdmin || !walletAddress) return;

    async function loadUserData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user details with portfolio
        const userResponse = await fetch(`/api/users/${walletAddress}`, {
          headers: { 'x-wallet-address': address || '' },
        });

        if (!userResponse.ok) {
          throw new Error('Usuario no encontrado');
        }

        const userData = await userResponse.json();

        if (userData.success && userData.data) {
          setUser({
            id: userData.data.id,
            walletAddress: userData.data.walletAddress,
            email: userData.data.email,
            name: userData.data.name,
            profileImage: userData.data.profileImage,
            role: userData.data.role,
            kycStatus: userData.data.kycStatus,
            createdAt: userData.data.createdAt,
            updatedAt: userData.data.updatedAt,
          });
          setPortfolio(userData.data.portfolio || []);
          setKycSubmission(userData.data.kycSubmission || null);
        }

        // Fetch transactions
        const txResponse = await fetch(`/api/users/${walletAddress}/transactions`, {
          headers: { 'x-wallet-address': address || '' },
        });

        if (txResponse.ok) {
          const txData = await txResponse.json();
          if (txData.success && txData.data) {
            setTransactions(txData.data.transactions || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [isAdmin, walletAddress, address]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getKycBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      NONE: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'No enviado' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobado' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' },
    };
    return config[status] || config.NONE;
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Administrador' },
      USER: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Usuario' },
    };
    return config[role] || config.USER;
  };

  const getTxTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      BUY: { bg: 'bg-green-100', text: 'text-green-700', label: 'Compra' },
      SELL: { bg: 'bg-red-100', text: 'text-red-700', label: 'Venta' },
      DIVIDEND_CLAIM: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dividendo' },
      DIVIDEND_DISTRIBUTION: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Distribución' },
    };
    return config[type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: type };
  };

  const getTxStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Fallida' },
    };
    return config[status] || config.PENDING;
  };

  // Calculate totals
  const totalTokens = portfolio.reduce((sum, p) => sum + p.tokenAmount, 0);
  const totalValue = portfolio.reduce((sum, p) => {
    const price = Number(p.property.pricePerFraction) || 0;
    return sum + p.tokenAmount * price;
  }, 0);
  const totalTransactions = transactions.length;
  const totalSpent = transactions
    .filter((t) => t.type === 'BUY' && t.status === 'CONFIRMED')
    .reduce((sum, t) => sum + Number(t.amount), 0);

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-6 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a usuarios
      </Link>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : user ? (
        <div className="space-y-8">
          {/* User Header */}
          <div className="bg-gradient-to-br from-[#1e3a5f] via-[#2d4a70] to-[#3d5a80] rounded-2xl p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || 'Usuario'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                    <span className="text-white font-bold text-3xl">
                      {user.name?.charAt(0)?.toUpperCase() || walletAddress.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.name || 'Usuario sin nombre'}
                </h1>
                <p className="text-white/70 mb-3">{user.email || 'Sin email registrado'}</p>
                <div className="flex items-center gap-2 text-white/60 font-mono text-sm bg-white/10 rounded-lg px-3 py-2 w-fit">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {walletAddress}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleBadge(user.role).bg} ${getRoleBadge(user.role).text}`}>
                  {getRoleBadge(user.role).label}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getKycBadge(user.kycStatus).bg} ${getKycBadge(user.kycStatus).text}`}>
                  KYC: {getKycBadge(user.kycStatus).label}
                </span>
              </div>
            </div>

            {/* Registration Info */}
            <div className="mt-6 pt-6 border-t border-white/20 flex gap-8 text-white/70 text-sm">
              <div>
                <span className="text-white/50">Registrado:</span>{' '}
                {formatDate(user.createdAt)}
              </div>
              <div>
                <span className="text-white/50">Última actualización:</span>{' '}
                {formatDate(user.updatedAt)}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Propiedades</p>
              </div>
              <p className="text-3xl font-bold text-primary-600">{portfolio.length}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Total Tokens</p>
              </div>
              <p className="text-3xl font-bold text-primary-600">{totalTokens.toLocaleString()}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Valor Portfolio</p>
              </div>
              <p className="text-3xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Transacciones</p>
              </div>
              <p className="text-3xl font-bold text-primary-600">{totalTransactions}</p>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-primary-600">Portafolio de Propiedades</h2>
            </div>

            {portfolio.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500">Este usuario no tiene propiedades en su portafolio</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {portfolio.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition">
                    {/* Property Image */}
                    <div
                      className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
                      style={{
                        backgroundImage: `url(${item.property.images?.[0] || 'https://via.placeholder.com/80'})`,
                      }}
                    />

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary-600 truncate">{item.property.name}</h3>
                      <p className="text-sm text-gray-500">{item.property.location}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 text-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tokens</p>
                        <p className="font-bold text-primary-600">{item.tokenAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Participación</p>
                        <p className="font-bold text-primary-600">
                          {((item.tokenAmount / item.property.totalFractions) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valor</p>
                        <p className="font-bold text-green-600">
                          ${(item.tokenAmount * Number(item.property.pricePerFraction)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-600">Historial de Transacciones</h2>
              {totalSpent > 0 && (
                <span className="text-sm text-gray-500">
                  Total invertido: <span className="font-bold text-green-600">${totalSpent.toLocaleString()}</span>
                </span>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500">Este usuario no tiene transacciones registradas</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TX Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const typeBadge = getTxTypeBadge(tx.type);
                    const statusBadge = getTxStatusBadge(tx.status);
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                            {typeBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-primary-600">
                          ${Number(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {tx.tokenAmount ? tx.tokenAmount.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {formatShortDate(tx.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`${CHAIN_CONFIG.blockExplorerUrl}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm font-mono"
                          >
                            {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* KYC Section */}
          {kycSubmission && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-600">Verificación KYC</h2>
                <Link
                  href={`/admin/kyc/${kycSubmission.id}`}
                  className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                >
                  Ver documentos
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estado</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getKycBadge(kycSubmission.status).bg} ${getKycBadge(kycSubmission.status).text}`}>
                      {getKycBadge(kycSubmission.status).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Enviado</p>
                    <p className="font-medium text-gray-700">{formatShortDate(kycSubmission.createdAt)}</p>
                  </div>
                  {kycSubmission.reviewedAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Revisado</p>
                      <p className="font-medium text-gray-700">{formatShortDate(kycSubmission.reviewedAt)}</p>
                    </div>
                  )}
                  {kycSubmission.reviewedBy && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Revisado por</p>
                      <p className="font-mono text-sm text-gray-600">
                        {kycSubmission.reviewedBy.slice(0, 6)}...{kycSubmission.reviewedBy.slice(-4)}
                      </p>
                    </div>
                  )}
                </div>
                {kycSubmission.adminNotes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Notas del admin</p>
                    <p className="text-gray-700">{kycSubmission.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">Usuario no encontrado</h3>
          <p className="text-gray-500 mb-4">No se encontró información para la wallet: {walletAddress}</p>
          <Link
            href="/admin/users"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
          >
            Volver a usuarios
          </Link>
        </div>
      )}
    </div>
  );
}
