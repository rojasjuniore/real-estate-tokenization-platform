'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePropertyStore, type Property } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';
import { useNavigationStore } from '@/store';
import { IconBuscar } from '@/components/icons';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { brandConfig } from '@/config/brand.config';

// Listing type from API
interface APIListing {
  id: string;
  onChainListingId: number | null;
  pricePerToken: string;
  paymentToken: string;
  paymentTokenAddress: string | null;
}

// API property type from database
interface APIProperty {
  id: string;
  tokenId: number | null;
  name: string;
  description: string;
  location: string;
  propertyType: string;
  images: string[];
  totalFractions: number;
  availableFractions: number;
  pricePerFraction: string;
  estimatedROI: string;
  timeline: 'SHORT_TERM' | 'LONG_TERM';
  status: string;
  listings?: APIListing[];
}

// Map API property to store Property format
function mapAPIPropertyToStore(apiProp: APIProperty): Property {
  const propertyTypeMap: Record<string, string> = {
    RESIDENTIAL: 'Residencial',
    COMMERCIAL: 'Comercial',
    INDUSTRIAL: 'Industrial',
    MIXED: 'Mixto',
  };

  const statusMap: Record<string, 'available' | 'sold_out' | 'coming_soon'> = {
    ACTIVE: 'available',
    SOLD_OUT: 'sold_out',
    DRAFT: 'coming_soon',
    PAUSED: 'coming_soon',
  };

  // Get the active listing if exists
  const activeListing = apiProp.listings?.[0];

  return {
    id: apiProp.id,
    name: apiProp.name,
    location: apiProp.location,
    description: apiProp.description,
    imageUrl: apiProp.images[0] || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    images: apiProp.images,
    pricePerToken: parseFloat(apiProp.pricePerFraction),
    totalTokens: apiProp.totalFractions,
    availableTokens: apiProp.availableFractions,
    expectedYield: parseFloat(apiProp.estimatedROI),
    propertyType: propertyTypeMap[apiProp.propertyType] || apiProp.propertyType,
    status: statusMap[apiProp.status] || 'coming_soon',
    timeline: apiProp.timeline === 'SHORT_TERM' ? '1-2' : '3-4',
    // Include listing data for purchases
    listingId: activeListing?.onChainListingId?.toString(),
    paymentToken: activeListing?.paymentTokenAddress || undefined,
  };
}

type TimelineFilter = 'all' | '1-2' | '3-4';

// Copy icon for address
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

export function HomeSection() {
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const { selectProperty, selectedProperty, openModal } = usePropertyStore();
  const { isConnected, userInfo, address, getBalances } = useWeb3Auth();
  const { navigate } = useNavigationStore();
  const [balances, setBalances] = useState({ matic: '0', usdt: '0' });
  const [copied, setCopied] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch properties from API
  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch('/api/properties?status=ACTIVE&limit=50');
        const data = await response.json();

        if (data.success && data.data.properties) {
          const mappedProperties = data.data.properties.map(mapAPIPropertyToStore);
          setProperties(mappedProperties);

          // Auto-select first property if none selected
          if (mappedProperties.length > 0 && !selectedProperty) {
            selectProperty(mappedProperties[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    }

    fetchProperties();
  }, [selectedProperty, selectProperty]);

  // Fetch balances when connected
  const fetchBalances = useCallback(async () => {
    if (isConnected) {
      const result = await getBalances();
      setBalances(result);
    }
  }, [isConnected, getBalances]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Fetch profile image from our DB
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!isConnected || !address) {
        setProfileImage(null);
        return;
      }

      try {
        const response = await fetch(`/api/users/${address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.profileImage) {
            setProfileImage(data.data.profileImage);
          }
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    fetchProfileImage();
  }, [isConnected, address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredProperties = timelineFilter === 'all'
    ? properties
    : properties.filter((p) => p.timeline === timelineFilter);

  const activeProperty = selectedProperty || filteredProperties[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <BrandLogo width={160} className="lg:w-[200px]" />
          <p className="text-xs lg:text-sm text-gray-500 mt-1">{brandConfig.identity.tagline} | by {brandConfig.identity.appName}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
          {/* User Widget - only when connected */}
          {isConnected ? (
            <button
              onClick={() => navigate('profile')}
              className="flex items-center gap-4 bg-white rounded-2xl px-5 py-3 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl border border-gray-200"
            >
              {/* Avatar - prefer DB image, fallback to Web3Auth, then initials */}
              <div className="relative flex-shrink-0">
                {(profileImage || userInfo?.profileImage) ? (
                  <img
                    src={profileImage || userInfo?.profileImage}
                    alt="Usuario"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-600 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-[#3d5a80] flex items-center justify-center border-2 border-primary-600 shadow-md">
                    <span className="text-white font-bold text-lg">
                      {userInfo?.name?.charAt(0)?.toUpperCase() ||
                        userInfo?.email?.charAt(0)?.toUpperCase() ||
                        address?.slice(2, 4)?.toUpperCase() ||
                        '?'}
                    </span>
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#16d63d] border-2 border-white rounded-full" />
              </div>

              {/* User info - visible on all screens */}
              <div className="text-left pr-0 sm:pr-4 sm:border-r border-gray-200 flex-1 min-w-0">
                <p className="font-semibold text-primary-600 text-sm truncate">
                  {userInfo?.name || 'Usuario'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAddress();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        copyAddress();
                      }
                    }}
                    className="hover:text-primary-600 transition-colors p-0.5 cursor-pointer"
                    title="Copiar dirección"
                  >
                    <CopyIcon />
                  </span>
                  {copied && <span className="text-[#16d63d] text-xs font-medium">✓</span>}
                </div>
              </div>

              {/* Balances */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center px-3 py-1 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">MATIC</p>
                  <p className="font-bold text-primary-600 text-sm">{parseFloat(balances.matic).toFixed(2)}</p>
                </div>
                <div className="text-center px-3 py-1 bg-green-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">USDT</p>
                  <p className="font-bold text-green-600 text-sm">${parseFloat(balances.usdt).toFixed(2)}</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="hidden lg:block text-right">
              <p className="text-primary-600 font-semibold">
                Real Estate fraccionado, con transparencia y cumplimiento.
              </p>
              <p className="text-sm text-gray-500">
                Invierte en proyectos inmobiliarios de alto nivel desde 100 USD
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full sm:w-[200px] lg:w-[255px] h-[36px] lg:h-[30px] pl-4 pr-10 rounded-[50px] bg-[rgba(219,225,230,0.95)] border-none text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <IconBuscar size={16} color={brandConfig.colors.primary[600]} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Column - Property List */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
          <h2 className="text-lg font-bold text-primary-600 mb-4">Tipos de Inversiones</h2>

          {/* Timeline Filter - Figma style: horizontal row */}
          <div className="flex flex-row gap-2 mb-6 flex-wrap">
            {[
              { id: 'all', label: 'Todas' },
              { id: '1-2', label: '1-2 años' },
              { id: '3-4', label: '3-4 años' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimelineFilter(filter.id as TimelineFilter)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  timelineFilter === filter.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-primary-600/30 text-primary-600 hover:bg-primary-600/5 hover:border-primary-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Presale Banner */}
          <div className="mb-6 bg-gradient-to-r from-primary-600/5 to-transparent p-4 rounded-[10px]">
            <p className="text-primary-600 text-base lg:text-lg">Invierte antes, ahorra más</p>
            <p className="text-xl lg:text-2xl font-bold text-primary-600">PREVENTA EXCLUSIVA</p>
          </div>

          {/* Property Cards - Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:max-h-[400px] lg:overflow-y-auto pb-4 lg:pb-0 lg:pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent -mx-4 px-4 lg:mx-0 lg:px-0">
            {isLoadingProperties ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[240px] lg:w-full h-[125px] rounded-[10px] bg-gray-200 animate-pulse flex-shrink-0" />
                ))}
              </>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-8 text-gray-500 w-full">
                <p>No hay propiedades disponibles</p>
                <p className="text-sm mt-1">con este filtro de timeline</p>
              </div>
            ) : (
              filteredProperties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => selectProperty(property)}
                  className={`w-[240px] lg:w-full h-[125px] rounded-[10px] overflow-hidden transition-all duration-300 flex-shrink-0 ${
                    activeProperty?.id === property.id
                      ? 'ring-2 ring-primary-600 shadow-lg'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                >
                  <div
                    className="relative w-full h-full bg-cover bg-center bg-[#d9d9d9]"
                    style={{ backgroundImage: `url(${property.imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-left">
                      <h3 className="font-bold text-sm drop-shadow-lg line-clamp-1">{property.name}</h3>
                      <p className="text-xs opacity-90 drop-shadow-md line-clamp-1">{property.location}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* IGJ Badge - Figma style: official logo image */}
          <div className="hidden lg:block mt-8">
            <img
              src="/images/8085c4e77c8d78573059a8463548ae14974d58a3.png"
              alt="Inspección General de Justicia"
              className="w-[190px] h-[72px] object-contain"
            />
          </div>
        </div>

        {/* Center/Right - Property Detail Card */}
        <div className="flex-1 order-1 lg:order-2">
          {isLoadingProperties ? (
            /* Loading Skeleton */
            <div className="rounded-[20px] overflow-hidden shadow-lg bg-[#d9d9d9] animate-pulse">
              <div className="relative">
                <div className="h-[250px] sm:h-[350px] lg:h-[450px] bg-gray-300" />
              </div>
              <div className="p-4 lg:p-8">
                <div className="h-6 bg-gray-300 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-300 rounded w-2/3" />
              </div>
            </div>
          ) : activeProperty ? (
            <div className="rounded-[25px] overflow-hidden shadow-xl bg-[#DBE1E6]/50">
              {/* Main Card Content */}
              <div className="relative">
                {/* Left info overlay */}
                <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10 max-w-[200px] sm:max-w-[300px] lg:max-w-[380px]">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2 drop-shadow-lg">{activeProperty.name}</h2>
                  <p className="text-xs sm:text-sm lg:text-base text-white/90 mb-3 lg:mb-5 drop-shadow-md">{activeProperty.location}</p>
                  <button
                    onClick={() => openModal(activeProperty)}
                    className="px-4 sm:px-6 lg:px-8 py-2 lg:py-3 bg-[#f97316] text-white font-semibold rounded-[20px] hover:bg-[#ea580c] transition-all shadow-lg hover:shadow-xl text-sm lg:text-lg"
                  >
                    Invertir con Cripto
                  </button>
                </div>

                {/* Right stats panel */}
                <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10 flex flex-row lg:flex-col gap-2 lg:gap-3">
                  {/* Valor de la fracción */}
                  <div className="w-[70px] h-[70px] sm:w-[85px] sm:h-[85px] lg:w-[100px] lg:h-[100px] bg-white/95 rounded-[15px] lg:rounded-[20px] flex flex-col items-center justify-center shadow-lg">
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px] font-medium leading-tight text-center">Valor</p>
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px] font-medium leading-tight text-center mb-0.5 lg:mb-1">de la fracción</p>
                    <p className="text-primary-600 text-sm lg:text-lg font-bold">{activeProperty.pricePerToken}</p>
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px]">USD</p>
                  </div>

                  {/* Fracciones Restantes - Hidden on mobile */}
                  <div className="hidden sm:flex w-[85px] h-[85px] lg:w-[100px] lg:h-[100px] bg-white/95 rounded-[15px] lg:rounded-[20px] flex-col items-center justify-center shadow-lg">
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px] font-medium leading-tight text-center">Fracciones</p>
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px] font-medium leading-tight text-center mb-0.5 lg:mb-1">Restantes</p>
                    <p className="text-primary-600 text-sm lg:text-lg font-bold">{activeProperty.availableTokens.toLocaleString()}</p>
                  </div>

                  {/* Rentabilidad Estimada */}
                  <div className="w-[70px] h-[70px] sm:w-[85px] sm:h-[85px] lg:w-[100px] lg:h-[100px] bg-white/95 rounded-[15px] lg:rounded-[20px] flex flex-col items-center justify-center shadow-lg">
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px] font-medium leading-tight text-center">Rentabilidad</p>
                    <p className="text-primary-600/60 text-[8px] lg:text-[10px] font-medium leading-tight text-center mb-0.5 lg:mb-1">Estimada</p>
                    <p className="text-primary-600 text-sm lg:text-lg font-bold">{activeProperty.expectedYield}%<span className="text-xs lg:text-sm">*</span></p>
                  </div>
                </div>

                {/* Hero Image with overlay gradient */}
                <div
                  className="h-[250px] sm:h-[350px] lg:h-[450px] bg-cover bg-center bg-no-repeat relative"
                  style={{ backgroundImage: `url(${activeProperty.imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Description Section */}
              <div className="p-4 lg:p-8 flex flex-col sm:flex-row justify-between items-start gap-4 lg:gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-primary-600 text-base lg:text-lg mb-2 lg:mb-3">Descripción</h3>
                  <p className="text-gray-600 leading-relaxed text-xs lg:text-sm line-clamp-3 lg:line-clamp-none">
                    {activeProperty.description}
                  </p>
                </div>
                <button
                  onClick={() => openModal(activeProperty)}
                  className="w-full sm:w-auto px-6 lg:px-8 py-2 lg:py-3 bg-[#f97316] text-white font-medium rounded-[20px] hover:bg-[#ea580c] transition-all shadow-lg text-sm whitespace-nowrap flex-shrink-0"
                >
                  Saber Más
                </button>
              </div>
            </div>
          ) : (
            /* No properties available */
            <div className="rounded-[20px] overflow-hidden shadow-lg bg-[#e8eef5] h-[300px] lg:h-[550px] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 rounded-full bg-primary-600/10 flex items-center justify-center">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-primary-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-primary-600 mb-2">No hay propiedades disponibles</h3>
                <p className="text-primary-600/60 text-sm">Las propiedades activas aparecerán aquí</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
