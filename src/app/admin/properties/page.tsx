"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3Auth } from "@/lib/web3auth";
import { PROPERTY_MARKETPLACE_ADDRESS, PROPERTY_TOKEN_ADDRESS } from "@/lib/web3auth/config";

// Payment token addresses on Polygon
const PAYMENT_TOKENS: Record<string, { address: string; decimals: number; symbol: string }> = {
  USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, symbol: "USDT" },
  USDC: { address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", decimals: 6, symbol: "USDC" },
};


// Helper to wait for transaction confirmation
async function waitForTransaction(
  provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
  txHash: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<{ status: string; logs: Array<{ address: string; topics: string[]; data: string }> } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await provider.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });

      if (receipt) {
        return receipt as { status: string; logs: Array<{ address: string; topics: string[]; data: string }> };
      }
    } catch (e) {
      console.error("Error checking receipt:", e);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return null;
}

interface Property {
  id: string;
  tokenId: number;
  name: string;
  location: string;
  propertyType: string;
  status: string;
  totalFractions: number;
  availableFractions: number;
  pricePerFraction: string;
}

interface Listing {
  id: string;
  onChainListingId: number | null;
  propertyId: string;
  amount: number;
  remainingAmount: number | null;
  pricePerToken: number;
  paymentToken: string;
  status: string;
}

interface PropertyStats {
  property: {
    id: string;
    name: string;
    totalFractions: number;
    availableFractions: number;
    soldFractions: number;
    pricePerFraction: number;
  };
  sales: {
    totalAmount: number;
    totalTokensSold: number;
    transactionCount: number;
    recentTransactions: {
      amount: number;
      tokenAmount: number;
      date: string;
    }[];
  };
  holders: {
    count: number;
    list: {
      walletAddress: string;
      name: string;
      tokenAmount: number;
      percentage: string;
    }[];
  };
  treasury: {
    address: string | null;
    note: string;
  };
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const { address, isConnected, isLoading: authLoading, provider } = useWeb3Auth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPropertyAdmin, setIsPropertyAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auth guard - check if user is admin
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

  // Check if current user can approve properties
  useEffect(() => {
    const checkPropertyAdmin = async () => {
      if (!address || !isAdmin) {
        setIsPropertyAdmin(false);
        return;
      }
      try {
        const res = await fetch(`/api/admin/property-admin?address=${address}`);
        const data = await res.json();
        setIsPropertyAdmin(data.success && data.data?.isPropertyAdmin);
      } catch (e) {
        console.error('Error checking property admin:', e);
        setIsPropertyAdmin(false);
      }
    };
    checkPropertyAdmin();
  }, [address, isAdmin]);

  // KPI Modal state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Listing state
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [listingModalProperty, setListingModalProperty] = useState<Property | null>(null);
  const [listingForm, setListingForm] = useState({
    amount: 0,
    pricePerToken: 0,
    paymentToken: 'USDT',
  });
  const [listingStatus, setListingStatus] = useState<'idle' | 'approving' | 'creating' | 'saving' | 'success' | 'error'>('idle');
  const [listingError, setListingError] = useState<string | null>(null);
  const [listingTxHash, setListingTxHash] = useState<string | null>(null);


  // Fetch listings for all properties
  const fetchListings = useCallback(async (propertyIds: string[]) => {
    const listingsMap: Record<string, Listing> = {};

    await Promise.all(
      propertyIds.map(async (propertyId) => {
        try {
          const res = await fetch(`/api/properties/${propertyId}/listing`);
          const data = await res.json();
          if (data.success && data.data) {
            listingsMap[propertyId] = data.data;
          }
        } catch (e) {
          console.error(`Error fetching listing for ${propertyId}:`, e);
        }
      })
    );

    setListings(listingsMap);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    async function fetchProperties() {
      try {
        const response = await fetch("/api/properties");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Error loading properties');
        }

        const props = data.data?.properties || [];
        setProperties(props);

        // Fetch listings for all properties
        if (props.length > 0) {
          fetchListings(props.map((p: Property) => p.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperties();
  }, [isAdmin, fetchListings]);

  // Open listing modal
  const openListingModal = (property: Property) => {
    setListingModalProperty(property);
    setListingForm({
      amount: property.availableFractions,
      pricePerToken: Number(property.pricePerFraction),
      paymentToken: 'USDT',
    });
    setListingStatus('idle');
    setListingError(null);
    setListingTxHash(null);
  };

  // Close listing modal
  const closeListingModal = () => {
    setListingModalProperty(null);
    setListingForm({ amount: 0, pricePerToken: 0, paymentToken: 'USDT' });
    setListingStatus('idle');
    setListingError(null);
    setListingTxHash(null);
  };

  // Create listing on-chain and in DB
  const handleCreateListing = async () => {
    if (!listingModalProperty || !provider || !address) {
      setListingError('Wallet no conectada');
      return;
    }

    if (!PROPERTY_MARKETPLACE_ADDRESS || !PROPERTY_TOKEN_ADDRESS) {
      setListingError('Contratos no configurados');
      return;
    }

    if (listingModalProperty.tokenId === null || listingModalProperty.tokenId === undefined) {
      setListingError('La propiedad no tiene tokenId asignado. Debe estar minteada primero.');
      return;
    }

    setListingStatus('approving');
    setListingError(null);

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // Step 1: Check if already approved, if not, approve PropertyToken to Marketplace
      // setApprovalForAll(address operator, bool approved) = 0xa22cb465
      const operatorHex = PROPERTY_MARKETPLACE_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
      const approvedHex = "0000000000000000000000000000000000000000000000000000000000000001";
      const approveData = "0xa22cb465" + operatorHex + approvedHex;

      console.log("Step 1: Approving PropertyToken to Marketplace...");
      const approveTxHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: PROPERTY_TOKEN_ADDRESS,
          data: approveData,
        }],
      });

      if (!approveTxHash) {
        throw new Error("Error al aprobar tokens");
      }
      console.log("Approval tx:", approveTxHash);

      // Wait for approval confirmation
      const approveReceipt = await waitForTransaction(typedProvider, approveTxHash);
      if (!approveReceipt || approveReceipt.status !== "0x1") {
        throw new Error("La transacción de aprobación falló");
      }

      // Step 2: Create listing on marketplace
      setListingStatus('creating');

      const tokenConfig = PAYMENT_TOKENS[listingForm.paymentToken];
      const priceInSmallestUnit = BigInt(Math.floor(listingForm.pricePerToken * 10 ** tokenConfig.decimals));

      // createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken)
      // createListing(uint256,uint256,uint256,address) selector = 0x8ebaae08
      const propertyIdHex = listingModalProperty.tokenId.toString(16).padStart(64, "0");
      const amountHex = listingForm.amount.toString(16).padStart(64, "0");
      const priceHex = priceInSmallestUnit.toString(16).padStart(64, "0");
      const paymentTokenHex = tokenConfig.address.slice(2).toLowerCase().padStart(64, "0");

      const createListingData = "0x8ebaae08" + propertyIdHex + amountHex + priceHex + paymentTokenHex;

      console.log("Step 2: Creating listing on marketplace...");
      const createTxHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: PROPERTY_MARKETPLACE_ADDRESS,
          data: createListingData,
        }],
      });

      if (!createTxHash) {
        throw new Error("Error al crear listing en blockchain");
      }
      console.log("Create listing tx:", createTxHash);
      setListingTxHash(createTxHash);

      // Wait for transaction confirmation
      const listingReceipt = await waitForTransaction(typedProvider, createTxHash);
      if (!listingReceipt || listingReceipt.status !== "0x1") {
        throw new Error("La transacción de creación de listing falló");
      }

      // Extract listingId from event
      let onChainListingId: number | null = null;
      // Look for ListingCreated event
      // ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed propertyId, ...)
      for (const log of listingReceipt.logs || []) {
        if (log.address?.toLowerCase() === PROPERTY_MARKETPLACE_ADDRESS?.toLowerCase()) {
          if (log.topics && log.topics.length >= 2) {
            const listingIdHex = log.topics[1];
            const bigIntValue = BigInt(listingIdHex);
            if (bigIntValue <= BigInt(Number.MAX_SAFE_INTEGER)) {
              onChainListingId = Number(bigIntValue);
              break;
            }
          }
        }
      }

      // Step 3: Save to database
      setListingStatus('saving');

      const response = await fetch('/api/admin/marketplace/listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          propertyId: listingModalProperty.id,
          amount: listingForm.amount,
          pricePerToken: listingForm.pricePerToken,
          paymentToken: listingForm.paymentToken,
          txHash: createTxHash,
          onChainListingId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Error guardando listing');
      }

      setListingStatus('success');

      // Update listings state
      setListings(prev => ({
        ...prev,
        [listingModalProperty.id]: data.data,
      }));

    } catch (err) {
      console.error("Create listing error:", err);
      setListingError(err instanceof Error ? err.message : 'Error desconocido');
      setListingStatus('error');
    }
  };

  const openKPIModal = async (propertyId: string) => {
    if (authLoading || !address) {
      setStatsError('Esperando autenticación...');
      return;
    }

    setSelectedPropertyId(propertyId);
    setIsLoadingStats(true);
    setStats(null);
    setStatsError(null);

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/stats`, {
        headers: { 'x-wallet-address': address },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setStatsError(data.error?.message || 'Error cargando estadísticas');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setStatsError('Error de conexión');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const closeKPIModal = () => {
    setSelectedPropertyId(null);
    setStats(null);
    setStatsError(null);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_REVIEW: "bg-amber-100 text-amber-700 border border-amber-300",
      APPROVED: "bg-blue-100 text-blue-700 border border-blue-300",
      REJECTED: "bg-red-100 text-red-700 border border-red-300",
      DRAFT: "bg-gray-100 text-gray-600",
      ACTIVE: "bg-green-100 text-green-700 border border-green-300",
      SOLD_OUT: "bg-purple-100 text-purple-700 border border-purple-300",
      PAUSED: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING_REVIEW: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
      DRAFT: "Borrador",
      ACTIVE: "Activo",
      SOLD_OUT: "Vendido",
      PAUSED: "Pausado",
    };
    return labels[status] || status;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      RESIDENTIAL: "Residencial",
      COMMERCIAL: "Comercial",
      INDUSTRIAL: "Industrial",
      MIXED: "Mixto",
    };
    return labels[type] || type;
  };


  // Show loading while checking auth
  if (authLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Not admin - will redirect
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[15px] p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Propiedades</h1>
          <p className="text-gray-500">Gestiona todas las propiedades de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          {isPropertyAdmin && (
            <Link
              href="/admin/properties/pending"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-[15px] transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Aprobar Propiedades
            </Link>
          )}
          <Link
            href="/admin/properties/new"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[15px] transition font-medium"
          >
            + Nueva Propiedad
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">
            No hay propiedades
          </h3>
          <p className="text-gray-500 mb-6">
            Comienza creando tu primera propiedad
          </p>
          <Link
            href="/admin/properties/new"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[15px] transition font-medium"
          >
            Crear Primera Propiedad
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Token ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Propiedad
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Progreso
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Precio/Token
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Listing
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((property) => {
                const soldFractions = property.totalFractions - property.availableFractions;
                const soldPercentage = (soldFractions / property.totalFractions) * 100;

                return (
                  <tr key={property.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-primary-600">#{property.tokenId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-primary-600 font-medium">{property.name}</p>
                        <p className="text-sm text-gray-500">{property.location}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 text-sm">
                        {getTypeBadge(property.propertyType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(property.status)}`}>
                        {getStatusLabel(property.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${soldPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {soldPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-800 font-medium">
                        ${Number(property.pricePerFraction).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {listings[property.id] ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                            Activo #{listings[property.id].onChainListingId || 'DB'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {listings[property.id].remainingAmount ?? listings[property.id].amount} disp.
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openListingModal(property)}
                          disabled={!property.tokenId}
                          className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-[8px] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title={!property.tokenId ? 'Propiedad no minteada' : 'Crear listing en marketplace'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Crear Listing
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openKPIModal(property.id)}
                          className="px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-[8px] transition font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          KPIs
                        </button>
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-600/10 rounded-[8px] transition font-medium"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* KPI Modal */}
      {selectedPropertyId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary-600">
                  {stats?.property.name || 'Cargando...'}
                </h2>
                <p className="text-gray-500 text-sm">Metricas e indicadores de la propiedad</p>
              </div>
              <button
                onClick={closeKPIModal}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {isLoadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-[12px] p-4 border border-gray-200">
                      <p className="text-gray-500 text-sm mb-1">Total Vendido</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ${stats.sales.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-[12px] p-4 border border-gray-200">
                      <p className="text-gray-500 text-sm mb-1">Tokens Vendidos</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {stats.property.soldFractions} / {stats.property.totalFractions}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-[12px] p-4 border border-gray-200">
                      <p className="text-gray-500 text-sm mb-1">Holders</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.holders.count}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-[12px] p-4 border border-gray-200">
                      <p className="text-gray-500 text-sm mb-1">Transacciones</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.sales.transactionCount}
                      </p>
                    </div>
                  </div>

                  {/* Holders List */}
                  <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-semibold text-primary-600 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Holders ({stats.holders.count})
                      </h3>
                    </div>
                    {stats.holders.list.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                        {stats.holders.list.map((holder, index) => (
                          <div key={index} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <p className="text-gray-800 font-medium">
                                {holder.name || 'Usuario'}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {truncateAddress(holder.walletAddress)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-primary-600 font-medium">
                                {holder.tokenAmount} tokens
                              </p>
                              <p className="text-xs text-gray-500">
                                {holder.percentage}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No hay holders aun
                      </div>
                    )}
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-semibold text-primary-600 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Ultimas Transacciones
                      </h3>
                    </div>
                    {stats.sales.recentTransactions.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {stats.sales.recentTransactions.map((tx, index) => (
                          <div key={index} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <p className="text-gray-800">
                                {tx.tokenAmount} tokens
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(tx.date)}
                              </p>
                            </div>
                            <p className="text-green-600 font-medium">
                              +${tx.amount.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No hay transacciones aun
                      </div>
                    )}
                  </div>

                  {/* Treasury Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-blue-700 font-medium">Sobre los Fondos</h4>
                        <p className="text-blue-600 text-sm mt-1">
                          {stats.treasury.note}
                        </p>
                        {stats.treasury.address && (
                          <p className="text-blue-600 text-sm mt-2 font-mono">
                            Treasury: {truncateAddress(stats.treasury.address)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : statsError ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">{statsError}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Error cargando estadisticas
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {listingModalProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary-600">Crear Listing</h2>
                  <p className="text-gray-500 text-sm">{listingModalProperty.name}</p>
                </div>
                <button
                  onClick={closeListingModal}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {listingStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-600 mb-2">Listing Creado</h3>
                  <p className="text-gray-500 mb-4">El listing se ha creado exitosamente en el marketplace.</p>
                  {listingTxHash && (
                    <a
                      href={`https://polygonscan.com/tx/${listingTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Ver transacción en PolygonScan
                    </a>
                  )}
                  <button
                    onClick={closeListingModal}
                    className="mt-6 w-full py-3 bg-primary-600 text-white rounded-[12px] font-medium hover:bg-primary-700 transition"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  {listingError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[12px]">
                      <p className="text-red-600 text-sm">{listingError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Token ID Info */}
                    <div className="bg-gray-50 rounded-[12px] p-4 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Token ID (on-chain)</span>
                        <span className="font-mono text-primary-600 font-medium">#{listingModalProperty.tokenId}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad de tokens a listar
                      </label>
                      <input
                        type="number"
                        value={listingForm.amount}
                        onChange={(e) => setListingForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        max={listingModalProperty.availableFractions}
                        min={1}
                        disabled={listingStatus !== 'idle' && listingStatus !== 'error'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Máximo disponible: {listingModalProperty.availableFractions}
                      </p>
                    </div>

                    {/* Price per Token */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio por token (USD)
                      </label>
                      <input
                        type="number"
                        value={listingForm.pricePerToken}
                        onChange={(e) => setListingForm(prev => ({ ...prev, pricePerToken: Number(e.target.value) }))}
                        step="0.01"
                        min="0.01"
                        disabled={listingStatus !== 'idle' && listingStatus !== 'error'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50"
                      />
                    </div>

                    {/* Payment Token */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Token de pago
                      </label>
                      <select
                        value={listingForm.paymentToken}
                        onChange={(e) => setListingForm(prev => ({ ...prev, paymentToken: e.target.value }))}
                        disabled={listingStatus !== 'idle' && listingStatus !== 'error'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="USDT">USDT (Tether)</option>
                        <option value="USDC">USDC (USD Coin)</option>
                      </select>
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 rounded-[12px] p-4 border border-blue-200">
                      <h4 className="text-blue-700 font-medium mb-2">Resumen</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Total tokens:</span>
                          <span className="text-blue-800 font-medium">{listingForm.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Precio unitario:</span>
                          <span className="text-blue-800 font-medium">${listingForm.pricePerToken} {listingForm.paymentToken}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                          <span className="text-blue-600">Valor total:</span>
                          <span className="text-blue-800 font-bold">${(listingForm.amount * listingForm.pricePerToken).toLocaleString()} {listingForm.paymentToken}</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-yellow-50 rounded-[12px] p-4 border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium">Pasos de la transacción:</p>
                          <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Aprobar tokens al Marketplace (1 tx)</li>
                            <li>Crear listing en el contrato (1 tx)</li>
                            <li>Guardar en base de datos</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleCreateListing}
                    disabled={listingStatus !== 'idle' && listingStatus !== 'error'}
                    className="mt-6 w-full py-3 bg-primary-600 text-white rounded-[12px] font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {listingStatus === 'approving' && (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Aprobando tokens...</span>
                      </>
                    )}
                    {listingStatus === 'creating' && (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Creando listing...</span>
                      </>
                    )}
                    {listingStatus === 'saving' && (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Guardando...</span>
                      </>
                    )}
                    {(listingStatus === 'idle' || listingStatus === 'error') && 'Crear Listing'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
