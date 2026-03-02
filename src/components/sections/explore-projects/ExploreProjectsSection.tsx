'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { usePropertyStore } from '@/store';
import { IconBuscar } from '@/components/icons';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { brandConfig } from '@/config/brand.config';

interface Listing {
  id: string;
  onChainListingId: number | null;
  pricePerToken: string;
  paymentToken: string;
  paymentTokenAddress: string | null;
  amount: number;
  remainingAmount: number | null;
}

interface Property {
  id: string;
  name: string;
  location: string;
  images: string[];
  pricePerFraction: number;
  totalFractions: number;
  availableFractions: number;
  estimatedROI: number;
  propertyType: string;
  status: string;
  description: string;
  timeline: string;
  createdAt: string;
  listings?: Listing[];
}

type StatusFilter = 'disponible' | 'sold_out' | 'proximamente' | 'ultimos';

export function ExploreProjectsSection() {
  const { openModal } = usePropertyStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties?status=ACTIVE&limit=100');
      const data = await response.json();

      if (data.success) {
        setProperties(data.data.properties || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Apply filters
  useEffect(() => {
    let result = [...properties];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (activeFilter) {
      result = result.filter((p) => {
        const availPercent = (p.availableFractions / p.totalFractions) * 100;
        switch (activeFilter) {
          case 'disponible':
            return p.availableFractions > p.totalFractions * 0.1;
          case 'sold_out':
            return p.availableFractions === 0;
          case 'proximamente':
            return p.status === 'DRAFT' || p.status === 'PAUSED';
          case 'ultimos':
            return availPercent > 0 && availPercent <= 10;
          default:
            return true;
        }
      });
    }

    setFilteredProperties(result);
  }, [properties, searchTerm, activeFilter]);

  const handlePropertyClick = (property: Property) => {
    const activeListing = property.listings?.[0];

    const storeProperty = {
      id: property.id,
      name: property.name,
      location: property.location,
      description: property.description || '',
      imageUrl: property.images?.[0] || '',
      images: property.images,
      pricePerToken: property.pricePerFraction,
      totalTokens: property.totalFractions,
      availableTokens: property.availableFractions,
      expectedYield: property.estimatedROI,
      propertyType: property.propertyType,
      status: property.availableFractions === 0 ? 'sold_out' as const : 'available' as const,
      timeline: property.timeline === 'SHORT_TERM' ? '1-2' as const : '3-4' as const,
      listingId: activeListing?.onChainListingId?.toString(),
      paymentToken: activeListing?.paymentTokenAddress || undefined,
    };

    openModal(storeProperty);
  };

  const featuredProperties = filteredProperties.slice(0, 5);
  const gridProperties = filteredProperties;

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Figma style */}
      <div className="px-6 lg:px-10 pt-6 pb-4">
        {/* Top row: Logo and filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2">
              <BrandLogo width={180} height={32} />
            </div>
            <p className="text-sm text-gray-500">{brandConfig.identity.tagline} | by {brandConfig.identity.appName}</p>
          </div>

          {/* Status Filters - Figma style */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter(activeFilter === 'disponible' ? null : 'disponible')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                activeFilter === 'disponible'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              Disponible
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === 'sold_out' ? null : 'sold_out')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                activeFilter === 'sold_out'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-500 text-white'
              }`}
            >
              Sold Out
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === 'proximamente' ? null : 'proximamente')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                activeFilter === 'proximamente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-500 text-white'
              }`}
            >
              Próximamente
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === 'ultimos' ? null : 'ultimos')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                activeFilter === 'ultimos'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-primary-600 border border-primary-600'
              }`}
            >
              Últimos Tokens
            </button>
          </div>
        </div>

        {/* Search Bar - Figma style with border */}
        <div className="flex justify-end">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder=""
              className="w-full h-10 pl-4 pr-12 rounded-full bg-white border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <IconBuscar size={20} color={brandConfig.colors.primary[600]} />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Carousel - Figma style */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              <div className="flex-shrink-0 w-full lg:w-[calc(50%-8px)] h-[300px] bg-gray-200 rounded-[20px] animate-pulse" />
            ) : (
              featuredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handlePropertyClick(property)}
                  className="flex-shrink-0 w-full lg:w-[calc(50%-8px)] h-[300px] relative rounded-[20px] overflow-hidden cursor-pointer snap-start group"
                >
                  {property.images?.[0] ? (
                    <Image
                      src={property.images[0]}
                      alt={property.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                  )}

                  {/* Light gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent" />

                  <div className="absolute bottom-0 left-0 p-6">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-1 leading-tight text-primary-600">
                      {property.name.split(' ').slice(0, 2).join(' ')}
                      {property.name.split(' ').length > 2 && (
                        <>
                          <br />
                          {property.name.split(' ').slice(2).join(' ')}
                        </>
                      )}
                    </h2>
                    <p className="text-lg text-primary-600">{property.location}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Property Grid - Figma style: 5 columns with small cards */}
      <div className="px-6 lg:px-10 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-[#DBE1E6]/30 rounded-[15px] overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-200" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            gridProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => handlePropertyClick(property)}
                className="bg-[#DBE1E6]/30 rounded-[15px] overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
              >
                <div className="relative h-32 overflow-hidden">
                  {property.images?.[0] ? (
                    <Image
                      src={property.images[0]}
                      alt={property.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-primary-600 text-sm mb-1 line-clamp-1">
                    {property.name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="line-clamp-1">{property.location}</span>
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-600 text-sm">
                      {property.pricePerFraction.toLocaleString()} USD
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyClick(property);
                      }}
                      className="px-3 py-1 bg-[#16d63d] text-white text-xs font-medium rounded-full hover:bg-[#14c236] transition-colors"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-600 mb-2">No se encontraron proyectos</h3>
            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-600/90 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
