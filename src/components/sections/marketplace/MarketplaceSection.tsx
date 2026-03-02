'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeb3Auth } from '@/lib/web3auth';

// Types
interface Property {
  id: string;
  name: string;
  location: string;
  images: string[];
  pricePerFraction: string;
  totalFractions: number;
  availableFractions: number;
  estimatedROI: string;
  propertyType: string;
  status: string;
}

interface Listing {
  id: string;
  propertyId: string;
  seller: string;
  amount: number;
  pricePerToken: string;
  paymentToken: string;
  status: string;
  createdAt: string;
  onChainListingId: number | null;
  property: {
    id: string;
    name: string;
    images?: string[];
    tokenId: number;
  };
}

interface UserPortfolioItem {
  propertyId: string;
  tokenAmount: number;
  property: {
    id: string;
    name: string;
    images?: string[];
    tokenId: number;
  };
}

type ViewMode = 'properties' | 'listings';

export function MarketplaceSection() {
  const { isConnected, address, login, buyFromMarketplace, createMarketplaceListing, cancelMarketplaceListing } = useWeb3Auth();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('properties');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<UserPortfolioItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Purchase state
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Create listing state
  const [newListing, setNewListing] = useState({
    propertyId: '',
    amount: 1,
    pricePerToken: '',
    paymentToken: 'USDT',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Cancel listing state
  const [cancellingListingId, setCancellingListingId] = useState<string | null>(null);

  // Fetch all properties
  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch('/api/properties?status=ACTIVE&limit=50');
      const data = await response.json();

      if (data.success) {
        setProperties(data.data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch listings for a specific property
  const fetchListingsForProperty = useCallback(async (propertyId: string) => {
    setListingsLoading(true);
    try {
      const response = await fetch(`/api/marketplace/listings?propertyId=${propertyId}&status=ACTIVE`);
      const data = await response.json();

      if (data.success) {
        setListings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  // Fetch user's portfolio
  const fetchUserPortfolio = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/users/${address}`);
      const data = await response.json();

      if (data.success && data.data?.portfolio) {
        setUserPortfolio(data.data.portfolio);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  }, [address]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserPortfolio();
    }
  }, [isConnected, address, fetchUserPortfolio]);

  // Handle property click - show listings
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setViewMode('listings');
    fetchListingsForProperty(property.id);
  };

  // Handle back to properties
  const handleBackToProperties = () => {
    setViewMode('properties');
    setSelectedProperty(null);
    setListings([]);
  };

  // Handle buy from listing
  const handleBuyFromListing = async () => {
    if (!selectedListing || !address) return;

    setBuyLoading(true);
    setBuyError(null);

    try {
      // Check connection
      let activeProvider = null;
      let activeAddress = address;

      if (!isConnected) {
        const loginResult = await login();
        if (!loginResult.success) {
          setBuyError('Debes conectar tu wallet para comprar');
          setBuyLoading(false);
          return;
        }
        activeProvider = loginResult.provider;
        activeAddress = loginResult.address || address;
      }

      // Validate onChainListingId exists
      if (!selectedListing.onChainListingId) {
        throw new Error('Este listing no tiene ID en blockchain');
      }

      // Buy from marketplace contract
      const paymentResult = await buyFromMarketplace(
        {
          listingId: selectedListing.onChainListingId,
          amount: selectedListing.amount,
          paymentToken: selectedListing.paymentToken,
          pricePerToken: Number(selectedListing.pricePerToken),
        },
        activeProvider || undefined,
        activeAddress || undefined
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Error en la transacción');
      }

      setTxHash(paymentResult.txHash || null);

      // Update listing status in database
      const response = await fetch(`/api/marketplace/listings/${selectedListing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': activeAddress || '',
        },
        body: JSON.stringify({
          status: 'SOLD',
          buyerAddress: activeAddress,
          buyTxHash: paymentResult.txHash,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Error al procesar la compra');
      }

      setBuySuccess(true);

      // Refresh listings
      if (selectedProperty) {
        fetchListingsForProperty(selectedProperty.id);
      }
    } catch (error) {
      console.error('Buy error:', error);
      setBuyError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setBuyLoading(false);
    }
  };

  // Handle create listing
  const handleCreateListing = async () => {
    if (!address) return;

    // Find the portfolio item to get the tokenId
    const portfolioItem = userPortfolio.find(item => item.propertyId === newListing.propertyId);
    if (!portfolioItem) {
      setCreateError('Propiedad no encontrada en tu portafolio');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      // Step 1: Call smart contract to create listing on-chain
      const onChainResult = await createMarketplaceListing({
        propertyId: portfolioItem.property.tokenId,
        amount: newListing.amount,
        pricePerToken: parseFloat(newListing.pricePerToken),
        paymentToken: newListing.paymentToken,
      });

      if (!onChainResult.success) {
        throw new Error(onChainResult.error || 'Error al crear listing en blockchain');
      }

      // Step 2: Save listing in database with onChainListingId
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          ...newListing,
          onChainListingId: onChainResult.listingId,
          txHash: onChainResult.txHash,
          approvalTxHash: onChainResult.approvalTxHash,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setNewListing({ propertyId: '', amount: 1, pricePerToken: '', paymentToken: 'USDT' });
        // Refresh listings if we're viewing the same property
        if (selectedProperty && newListing.propertyId === selectedProperty.id) {
          fetchListingsForProperty(selectedProperty.id);
        }
        // Refresh user portfolio since tokens were transferred to marketplace
        fetchUserPortfolio();
      } else {
        // On-chain succeeded but DB failed - still show partial success
        console.error('DB update failed:', data.error);
        setShowCreateModal(false);
        setNewListing({ propertyId: '', amount: 1, pricePerToken: '', paymentToken: 'USDT' });
      }
    } catch (error) {
      console.error('Create listing error:', error);
      setCreateError(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle cancel listing
  const handleCancelListing = async (listing: Listing) => {
    if (!address || !listing.onChainListingId) return;

    setCancellingListingId(listing.id);

    try {
      // Step 1: Cancel on blockchain
      const cancelResult = await cancelMarketplaceListing(listing.onChainListingId);

      if (!cancelResult.success) {
        throw new Error(cancelResult.error || 'Error al cancelar en blockchain');
      }

      // Step 2: Update database
      await fetch(`/api/marketplace/listings/${listing.id}`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': address,
        },
      });

      // Refresh listings
      if (selectedProperty) {
        fetchListingsForProperty(selectedProperty.id);
      }
      // Refresh portfolio since tokens are returned
      fetchUserPortfolio();
    } catch (error) {
      console.error('Cancel listing error:', error);
      alert(error instanceof Error ? error.message : 'Error al cancelar listing');
    } finally {
      setCancellingListingId(null);
    }
  };

  // Filter properties by search
  const filteredProperties = properties.filter((p) => {
    if (!searchTerm) return true;
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex items-center gap-3 lg:gap-4">
          {viewMode === 'listings' && (
            <button
              onClick={handleBackToProperties}
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-[var(--foreground)]">
              {viewMode === 'properties' ? 'Marketplace Secundario' : selectedProperty?.name}
            </h1>
            <p className="text-xs lg:text-sm text-[var(--foreground-secondary)]">
              {viewMode === 'properties'
                ? 'Compra y vende tokens entre usuarios'
                : `${listings.length} listings disponibles`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 w-full sm:w-auto">
          {viewMode === 'properties' && (
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Buscar propiedad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 lg:w-64 h-10 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:border-[#1e3a5f] text-sm"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          {isConnected && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 lg:px-6 py-2 bg-[#1e3a5f] text-white rounded-full font-medium hover:bg-[#2d4a6f] transition-colors flex items-center gap-2 text-sm lg:text-base whitespace-nowrap"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Vender Tokens</span>
              <span className="sm:hidden">Vender</span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      {viewMode === 'properties' ? (
        <>
          {/* Featured Carousel / Slider */}
          {!loading && filteredProperties.length > 0 && (
            <div className="px-4 sm:px-6 lg:px-8 mb-6 lg:mb-8">
              <div className="relative">
                <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  {filteredProperties.slice(0, 3).map((property) => (
                    <button
                      key={`featured-${property.id}`}
                      onClick={() => handlePropertyClick(property)}
                      className="relative flex-shrink-0 w-[280px] sm:w-[400px] lg:w-[600px] h-[180px] sm:h-[240px] lg:h-[300px] rounded-2xl lg:rounded-3xl overflow-hidden snap-start cursor-pointer group"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${property.images?.[0] || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80'})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 sm:px-3 py-1 bg-green-500/80 rounded-full text-xs sm:text-sm font-medium">
                            {Number(property.estimatedROI).toFixed(1)}% ROI
                          </span>
                          <span className="hidden sm:inline px-3 py-1 bg-white/20 rounded-full text-sm">
                            {property.propertyType === 'RESIDENTIAL' ? 'Residencial' :
                             property.propertyType === 'COMMERCIAL' ? 'Comercial' :
                             property.propertyType === 'INDUSTRIAL' ? 'Industrial' : 'Mixto'}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 line-clamp-1">{property.name}</h2>
                        <p className="text-sm sm:text-base lg:text-lg opacity-90 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {property.location}
                        </p>
                      </div>
                      {/* Price tag */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2">
                        <p className="text-xs text-gray-500">Desde</p>
                        <p className="text-lg font-bold text-[#1e3a5f]">${Number(property.pricePerFraction).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Scroll indicator */}
                {filteredProperties.length > 1 && (
                  <div className="flex justify-center gap-2 mt-2">
                    {filteredProperties.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-2 h-2 rounded-full bg-[#1e3a5f]/30" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Properties Grid */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500">Cargando propiedades...</p>
                </div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <h3 className="text-xl font-semibold text-[#1e3a5f] mb-2">No hay propiedades</h3>
                <p className="text-gray-500">No se encontraron propiedades activas</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">
                  Selecciona una propiedad para ver tokens en venta
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filteredProperties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => handlePropertyClick(property)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all text-left group"
                  >
                    {/* Image */}
                    <div className="relative h-44">
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{
                          backgroundImage: `url(${property.images?.[0] || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80'})`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {/* Property Type Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 rounded-full text-xs font-medium text-[#1e3a5f]">
                        {property.propertyType === 'RESIDENTIAL' ? 'Residencial' :
                         property.propertyType === 'COMMERCIAL' ? 'Comercial' :
                         property.propertyType === 'INDUSTRIAL' ? 'Industrial' : 'Mixto'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-[#1e3a5f] mb-1 truncate">{property.name}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{property.location}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Precio original</p>
                          <p className="font-bold text-[#1e3a5f]">${Number(property.pricePerFraction).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[#1e3a5f]">
                          <span className="text-sm font-medium">Ver listings</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          </div>
        </>
      ) : (
        /* Listings for selected property */
        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {listingsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500">Cargando listings...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1e3a5f] mb-2">No hay tokens en venta</h3>
              <p className="text-gray-500 mb-6">Sé el primero en vender tokens de esta propiedad</p>
              {isConnected && (
                <button
                  onClick={() => {
                    setNewListing({ ...newListing, propertyId: selectedProperty?.id || '' });
                    setShowCreateModal(true);
                  }}
                  className="px-6 py-3 bg-[#1e3a5f] text-white rounded-xl font-medium hover:bg-[#2d4a6f] transition-colors"
                >
                  Crear Listing
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Seller info */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#3d5a80] flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {listing.seller.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Vendedor</p>
                          <p className="font-mono text-sm">{formatAddress(listing.seller)}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        En Venta
                      </span>
                    </div>
                  </div>

                  {/* Listing details */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Cantidad</p>
                        <p className="text-xl font-bold text-[#1e3a5f]">{listing.amount} tokens</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Precio/Token</p>
                        <p className="text-xl font-bold text-[#1e3a5f]">${Number(listing.pricePerToken).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total</span>
                        <span className="text-2xl font-bold text-[#1e3a5f]">
                          ${(listing.amount * Number(listing.pricePerToken)).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Pago en {listing.paymentToken}</p>
                    </div>

                    {listing.seller.toLowerCase() === address?.toLowerCase() ? (
                      <button
                        onClick={() => handleCancelListing(listing)}
                        disabled={cancellingListingId === listing.id || !listing.onChainListingId}
                        className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {cancellingListingId === listing.id ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar Listing
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedListing(listing);
                          setBuySuccess(false);
                          setBuyError(null);
                          setTxHash(null);
                          setShowBuyModal(true);
                        }}
                        className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1e3a5f]">Vender Tokens</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {createError}
              </div>
            )}

            {userPortfolio.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tienes tokens para vender</p>
                <p className="text-sm text-gray-400">Primero compra tokens en el mercado primario</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad</label>
                  <select
                    value={newListing.propertyId}
                    onChange={(e) => setNewListing({ ...newListing, propertyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1e3a5f]"
                  >
                    <option value="">Seleccionar propiedad...</option>
                    {userPortfolio.map((item) => (
                      <option key={item.propertyId} value={item.propertyId}>
                        {item.property.name} ({item.tokenAmount} tokens)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Tokens</label>
                  <input
                    type="number"
                    min="1"
                    value={newListing.amount}
                    onChange={(e) => setNewListing({ ...newListing, amount: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1e3a5f]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Token (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newListing.pricePerToken}
                    onChange={(e) => setNewListing({ ...newListing, pricePerToken: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1e3a5f]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token de Pago</label>
                  <select
                    value={newListing.paymentToken}
                    onChange={(e) => setNewListing({ ...newListing, paymentToken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1e3a5f]"
                  >
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="MATIC">MATIC</option>
                  </select>
                </div>

                {newListing.pricePerToken && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Total a recibir</span>
                      <span className="font-bold text-[#1e3a5f]">
                        ${(newListing.amount * parseFloat(newListing.pricePerToken || '0')).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Se aplicará una comisión del 2.5% al venderse</p>
                  </div>
                )}

                {/* Dividend Warning Alert */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Importante sobre dividendos</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Al publicar tus tokens para venta, estos se transfieren al contrato del marketplace.
                        Mientras estén en venta, <strong>no recibirás dividendos</strong> por esos tokens.
                        Puedes cancelar el listing en cualquier momento para recuperarlos.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateListing}
                  disabled={!newListing.propertyId || !newListing.pricePerToken || createLoading}
                  className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-medium hover:bg-[#2d4a6f] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creando...
                    </>
                  ) : (
                    'Crear Listing'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1e3a5f]">
                {buySuccess ? 'Compra Exitosa' : 'Confirmar Compra'}
              </h3>
              <button
                onClick={() => {
                  setShowBuyModal(false);
                  setSelectedListing(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {buySuccess ? (
              /* Success State */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-[#1e3a5f] mb-2">Compra Completada</h4>
                <p className="text-gray-500 mb-4">
                  Has comprado {selectedListing.amount} tokens de {selectedListing.property.name}
                </p>
                {txHash && (
                  <a
                    href={`https://polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#1e3a5f] hover:underline"
                  >
                    Ver transacción
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            ) : (
              /* Confirmation State */
              <>
                {buyError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {buyError}
                  </div>
                )}

                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Vendedor</p>
                      <p className="font-mono">{formatAddress(selectedListing.seller)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tokens</p>
                      <p className="font-semibold">{selectedListing.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Precio/Token</p>
                      <p className="font-semibold">${Number(selectedListing.pricePerToken).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pago en</p>
                      <p className="font-semibold">{selectedListing.paymentToken}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total a pagar</span>
                      <span className="font-bold text-xl text-green-700">
                        ${(selectedListing.amount * Number(selectedListing.pricePerToken)).toFixed(2)} {selectedListing.paymentToken}
                      </span>
                    </div>
                  </div>
                </div>

                {!isConnected ? (
                  <button
                    onClick={async () => {
                      await login();
                    }}
                    className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-medium hover:bg-[#2d4a6f] transition-colors"
                  >
                    Conectar Wallet
                  </button>
                ) : (
                  <button
                    onClick={handleBuyFromListing}
                    disabled={buyLoading}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {buyLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      'Confirmar Compra'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
