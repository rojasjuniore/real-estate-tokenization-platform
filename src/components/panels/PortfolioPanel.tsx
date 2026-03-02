'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePanelsStore, usePropertyStore } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';

interface PortfolioProperty {
  id: string;
  name: string;
  location: string;
  images: string[];
  pricePerFraction: string;
  tokenId: number;
}

interface PortfolioItem {
  id: string;
  propertyId: string;
  property: PortfolioProperty;
  tokenAmount: number;
  averagePurchasePrice: string;
  totalInvested: string;
}

export function PortfolioPanel() {
  const { closePanel, openPanel } = usePanelsStore();
  const { openModal: openPropertyModal } = usePropertyStore();
  const { address } = useWeb3Auth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchPortfolio() {
      try {
        const response = await fetch(`/api/user/portfolio?wallet=${address}`);
        const data = await response.json();

        if (data.success) {
          setPortfolio(data.data || []);
        } else {
          setError(data.error?.message || 'Error cargando portafolio');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolio();
  }, [address]);

  const totalValue = portfolio.reduce((acc, item) => {
    return acc + (item.tokenAmount * parseFloat(item.property.pricePerFraction));
  }, 0);

  const totalInvested = portfolio.reduce((acc, item) => {
    return acc + parseFloat(item.totalInvested || '0');
  }, 0);

  const totalTokens = portfolio.reduce((acc, item) => acc + item.tokenAmount, 0);

  const handleBack = () => {
    closePanel();
    setTimeout(() => openPanel('account'), 100);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
        <p className="text-gray-500">Cargando portafolio...</p>
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
        <h2 className="text-xl font-bold text-primary-600">Mi Portafolio</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-primary-600 to-[#3d5a80] rounded-[15px] p-4 text-white">
          <p className="text-xs text-white/70 mb-1">Valor Total</p>
          <p className="text-xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gray-100 rounded-[15px] p-4">
          <p className="text-xs text-gray-500 mb-1">Tokens</p>
          <p className="text-xl font-bold text-primary-600">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-gray-100 rounded-[15px] p-4">
          <p className="text-xs text-gray-500 mb-1">Invertido</p>
          <p className="text-lg font-bold text-gray-700">${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gray-100 rounded-[15px] p-4">
          <p className="text-xs text-gray-500 mb-1">Propiedades</p>
          <p className="text-xl font-bold text-primary-600">{portfolio.length}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[15px] p-4 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Portfolio Items */}
      {portfolio.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Sin inversiones aún</h3>
          <p className="text-gray-500 text-sm mb-4">
            Explora las propiedades disponibles y comienza a invertir
          </p>
          <button
            onClick={() => {
              closePanel();
              window.location.hash = '#marketplace';
            }}
            className="px-6 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition"
          >
            Ver Propiedades
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolio.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-[15px] p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => {
                closePanel();
                // Open property detail modal
                openPropertyModal({
                  id: item.property.id,
                  name: item.property.name,
                  location: item.property.location,
                  description: '',
                  imageUrl: item.property.images?.[0] || '',
                  images: item.property.images,
                  pricePerToken: parseFloat(item.property.pricePerFraction),
                  totalTokens: 0,
                  availableTokens: 0,
                  expectedYield: 0,
                  propertyType: '',
                  status: 'available',
                });
              }}
            >
              <div className="flex gap-3">
                {/* Property Image */}
                <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.property.images?.[0] ? (
                    <Image
                      src={item.property.images[0]}
                      alt={item.property.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{item.property.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{item.property.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-primary-600/10 text-primary-600 text-xs font-medium rounded-full">
                      {item.tokenAmount} tokens
                    </span>
                    <span className="text-xs text-gray-500">
                      #{item.property.tokenId}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className="font-bold text-primary-600">
                    ${(item.tokenAmount * parseFloat(item.property.pricePerFraction)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${parseFloat(item.property.pricePerFraction).toFixed(2)}/token
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
