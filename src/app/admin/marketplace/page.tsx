'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/lib/web3auth';

interface Property {
  id: string;
  name: string;
  tokenId: number;
}

interface Seller {
  id: string;
  walletAddress: string;
  name: string;
}

interface Listing {
  id: string;
  property: Property;
  seller: Seller;
  fractionCount: number;
  pricePerFraction: number;
  status: string;
  createdAt: string;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'CANCELLED' | 'SOLD';

export default function AdminMarketplacePage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

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

    async function loadListings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/marketplace', {
          headers: { 'x-wallet-address': address || '' },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Error loading listings');
        }

        setListings(data.data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }

    loadListings();
  }, [isAdmin, address]);

  const filteredListings = useMemo(() => {
    if (statusFilter === 'ALL') return listings;
    return listings.filter((listing) => listing.status === statusFilter);
  }, [listings, statusFilter]);

  const stats = useMemo(() => {
    const total = listings.length;
    const active = listings.filter((l) => l.status === 'ACTIVE').length;
    const totalValue = listings
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + l.fractionCount * l.pricePerFraction, 0);
    return { total, active, totalValue };
  }, [listings]);

  const handleCancelListing = async (listingId: string) => {
    setProcessingId(listingId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/marketplace/${listingId}/cancel`, {
        method: 'POST',
        headers: {
          'x-wallet-address': address || '',
        },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      // Reload listings
      const reloadRes = await fetch('/api/admin/marketplace', {
        headers: { 'x-wallet-address': address || '' },
      });
      const reloadData = await reloadRes.json();
      if (reloadData.success) {
        setListings(reloadData.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cancelling listing');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 border border-green-200',
      SOLD: 'bg-blue-100 text-blue-700 border border-blue-200',
      CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Marketplace</h1>
        <p className="text-gray-500">Gestiona los listados del marketplace</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Total Listados</p>
          <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Listados Activos</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Valor Total Activo</p>
          <p className="text-3xl font-bold text-primary-600">
            ${stats.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'ALL'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-primary-600'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'ACTIVE'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-green-600'
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'CANCELLED'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-red-600'
          }`}
        >
          Canceladas
        </button>
        <button
          onClick={() => setStatusFilter('SOLD')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'SOLD'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-blue-600'
          }`}
        >
          Vendidas
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">No hay listados</h3>
          <p className="text-gray-500">
            {statusFilter === 'ALL'
              ? 'Aún no hay listados en el marketplace'
              : `No hay listados con estado ${statusFilter.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Propiedad</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Vendedor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Fracciones</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Precio/Fracción</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Fecha</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-primary-600 font-medium">{listing.property.name}</p>
                      <p className="text-sm text-gray-500">Token #{listing.property.tokenId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-800">{listing.seller.name}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {truncateAddress(listing.seller.walletAddress)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800">{listing.fractionCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary-600 font-medium">
                      ${listing.pricePerFraction.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(listing.status)}`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{formatDate(listing.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {listing.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCancelListing(listing.id)}
                        disabled={processingId === listing.id}
                        className="px-3 py-1.5 text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        Cancelar
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
