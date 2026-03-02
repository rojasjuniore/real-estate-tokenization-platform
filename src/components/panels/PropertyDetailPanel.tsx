'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePropertyStore } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';
import { IconArrowClose } from '@/components/icons';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { getDocumentViewUrl } from '@/lib/utils/documents';
import { usePurchaseValidation, type PurchaseValidationError, type ValidationStep } from '@/hooks';
import { brandConfig } from '@/config/brand.config';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS;

type TabType = 'papeles' | 'contratos' | 'pdfs' | 'smartcontracts';
type PurchaseStatus = 'idle' | 'confirming' | 'approving' | 'processing' | 'success' | 'error';

// Extract URL from iframe HTML or return the URL directly
function extractMapUrl(mapUrl: string | null | undefined): string | null {
  if (!mapUrl) return null;

  // If it's an iframe HTML, extract the src URL
  if (mapUrl.includes('<iframe') && mapUrl.includes('src=')) {
    const srcMatch = mapUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      return srcMatch[1];
    }
  }

  // Short URLs cannot be embedded in iframes - return null to use location fallback
  if (mapUrl.includes('goo.gl') || mapUrl.includes('maps.app.goo.gl')) {
    return null;
  }

  // Already an embed URL
  if (mapUrl.includes('/embed') || mapUrl.includes('output=embed')) return mapUrl;

  try {
    const url = new URL(mapUrl);

    // If it's a maps.google.com URL with q parameter
    if (url.searchParams.has('q')) {
      const query = url.searchParams.get('q');
      return `https://maps.google.com/maps?q=${encodeURIComponent(query || '')}&output=embed`;
    }

    // If it contains /place/, extract the location
    if (mapUrl.includes('/place/')) {
      const placeMatch = mapUrl.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
      }
    }

    // If it contains coordinates (@lat,lng)
    const coordsMatch = mapUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordsMatch) {
      const lat = coordsMatch[1];
      const lng = coordsMatch[2];
      return `https://maps.google.com/maps?q=${lat},${lng}&output=embed`;
    }

    // For other google.com/maps URLs, try to make them embeddable
    if (mapUrl.includes('google.com/maps')) {
      return mapUrl.includes('?') ? `${mapUrl}&output=embed` : `${mapUrl}?output=embed`;
    }

    // Return null for unrecognized formats - will use location fallback
    return null;
  } catch {
    // If URL parsing fails, return null to use location fallback
    return null;
  }
}

interface ActiveListing {
  id: string;
  onChainListingId: number | null;
  propertyId: string;
  seller: string;
  amount: number;
  remainingAmount: number | null;
  pricePerToken: number;
  paymentToken: string;
  paymentTokenAddress: string | null;
  status: string;
}

// Extended property interface with additional fields from API
interface ExtendedProperty {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  images?: string[];
  documents?: string[];
  mapUrl?: string;
  pricePerToken: number;
  totalTokens: number;
  availableTokens: number;
  expectedYield: number;
  propertyType: string;
  timeline?: string;
  status?: 'available' | 'sold_out' | 'coming_soon';
  tokenId?: number; // On-chain token ID for buyDirect
}

export function PropertyDetailPanel() {
  const { selectedProperty, isModalOpen, clearSelection } = usePropertyStore();
  const { isConnected, address, login, buyDirect, provider } = useWeb3Auth();
  const [activeTab, setActiveTab] = useState<TabType>('papeles');
  const [tokenAmount, setTokenAmount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [fullProperty, setFullProperty] = useState<ExtendedProperty | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('idle');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeListing, setActiveListing] = useState<ActiveListing | null>(null);
  const [listingLoading, setListingLoading] = useState(false);

  // KYC verification state - checked via Web3Auth provider
  const [isKYCApproved, setIsKYCApproved] = useState<boolean | null>(null);
  const [isKYCLoading, setIsKYCLoading] = useState(false);

  // Purchase validation hook
  const { validatePurchase, parseTransactionError, isValidating, validationSteps } = usePurchaseValidation();
  const [validationError, setValidationError] = useState<PurchaseValidationError | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Check KYC status using Web3Auth provider
  useEffect(() => {
    const checkKYC = async () => {
      if (!address || !MARKETPLACE_ADDRESS) {
        setIsKYCApproved(null);
        return;
      }

      setIsKYCLoading(true);
      try {
        // isKYCApproved(address) selector = 0xe77db232
        const addressHex = address.slice(2).toLowerCase().padStart(64, '0');
        const data = '0xe77db232' + addressHex;

        const response = await fetch(process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-rpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: MARKETPLACE_ADDRESS, data }, 'latest'],
            id: 1,
          }),
        });

        const result = await response.json();
        // Result is 0x...01 for true, 0x...00 for false
        const approved = result.result && result.result.endsWith('1');
        setIsKYCApproved(approved);
      } catch (error) {
        console.error('Error checking KYC:', error);
        setIsKYCApproved(false);
      } finally {
        setIsKYCLoading(false);
      }
    };

    checkKYC();
  }, [address]);

  // Fetch active listing for this property
  const fetchListing = useCallback(async (propertyId: string) => {
    setListingLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/listing`);
      const data = await res.json();
      if (data.success && data.data) {
        setActiveListing(data.data);
        // Auto-select payment method from listing
        if (data.data.paymentToken) {
          setPaymentMethod(data.data.paymentToken.toLowerCase());
        }
      } else {
        setActiveListing(null);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      setActiveListing(null);
    } finally {
      setListingLoading(false);
    }
  }, []);

  // Fetch full property details when modal opens
  useEffect(() => {
    if (selectedProperty && isModalOpen) {
      fetch(`/api/properties/${selectedProperty.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const prop = data.data;
            // Map API status to component status
            const statusMap: Record<string, 'available' | 'sold_out' | 'coming_soon'> = {
              ACTIVE: 'available',
              SOLD_OUT: 'sold_out',
              DRAFT: 'coming_soon',
              PAUSED: 'coming_soon',
            };

            setFullProperty({
              id: prop.id,
              name: prop.name,
              location: prop.location,
              description: prop.description,
              imageUrl: prop.images?.[0] || selectedProperty.imageUrl,
              images: prop.images || [],
              documents: prop.documents || [],
              mapUrl: prop.mapUrl || null,
              pricePerToken: typeof prop.pricePerFraction === 'number' ? prop.pricePerFraction : parseFloat(prop.pricePerFraction) || 0,
              totalTokens: prop.totalFractions,
              availableTokens: prop.availableFractions,
              expectedYield: typeof prop.estimatedROI === 'number' ? prop.estimatedROI : parseFloat(prop.estimatedROI) || 0,
              propertyType: prop.propertyType,
              timeline: prop.timeline,
              status: statusMap[prop.status] || 'coming_soon',
              tokenId: prop.tokenId ? Number(prop.tokenId) : undefined,
            });
          }
        })
        .catch(console.error);

      // Also fetch active listing
      fetchListing(selectedProperty.id);
    }
  }, [selectedProperty, isModalOpen, fetchListing]);

  // Reset purchase state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setPurchaseStatus('idle');
      setPurchaseError(null);
      setTxHash(null);
      setPaymentMethod('');
      setTokenAmount(1);
      setActiveListing(null);
      setValidationError(null);
      setShowValidationDetails(false);
    }
  }, [isModalOpen]);

  if (!selectedProperty || !isModalOpen) return null;

  const property = fullProperty || selectedProperty;
  const totalCost = tokenAmount * property.pricePerToken;

  const handlePurchase = async () => {
    // Clear previous errors
    setPurchaseError(null);
    setValidationError(null);

    // Validate tokenId exists (property must be approved on-chain)
    const propertyTokenId = (property as ExtendedProperty).tokenId;
    if (!propertyTokenId) {
      setValidationError({
        code: 'PROPERTY_NOT_AVAILABLE',
        message: 'Esta propiedad aún no está disponible para compra on-chain. Contacta al administrador.',
      });
      return;
    }

    // Validate available tokens
    if (tokenAmount > property.availableTokens) {
      setValidationError({
        code: 'TOKENS_NOT_AVAILABLE',
        message: `Solo hay ${property.availableTokens} fracciones disponibles.`,
        details: {
          required: `${tokenAmount} fracciones`,
          available: `${property.availableTokens} fracciones`,
        },
      });
      return;
    }

    // Variables to track active connection (handles fresh login case)
    let activeProvider = null;
    let activeAddress = address;

    // Check if user is connected, login if needed
    if (!isConnected) {
      setPurchaseStatus('confirming');
      const loginResult = await login();
      if (!loginResult.success) {
        setValidationError({
          code: 'WALLET_NOT_CONNECTED',
          message: 'Debes conectar tu wallet para comprar.',
        });
        setPurchaseStatus('idle');
        return;
      }
      // Use the fresh provider and address from login
      activeProvider = loginResult.provider;
      activeAddress = loginResult.address || null;
    }

    // Run comprehensive validation before purchase
    setPurchaseStatus('confirming');
    setShowValidationDetails(true);

    const validation = await validatePurchase(
      propertyTokenId,
      tokenAmount,
      isKYCApproved,
      isKYCLoading
    );

    if (!validation.isValid) {
      setValidationError(validation.error || null);
      setPurchaseStatus('error');
      return;
    }

    // All validations passed - proceed with purchase
    setShowValidationDetails(false);
    setPurchaseStatus('approving');

    try {
      // Use buyDirect to purchase directly from marketplace contract
      // This handles: 1) Approve USDT 2) Call buyDirect on marketplace
      const purchaseResult = await buyDirect(
        {
          propertyId: propertyTokenId,
          amount: tokenAmount,
          paymentToken: 'USDT',
        },
        activeProvider || undefined,
        activeAddress || undefined
      );

      if (!purchaseResult.success) {
        const parsedError = parseTransactionError(new Error(purchaseResult.error || 'Error en la transacción'));
        setValidationError(parsedError);
        setPurchaseStatus('error');
        return;
      }

      setTxHash(purchaseResult.txHash || null);
      setPurchaseStatus('processing');

      // Register purchase in database
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          amount: tokenAmount,
          paymentToken: 'USDT',
          txHash: purchaseResult.txHash,
          buyerAddress: activeAddress,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Transaction succeeded but DB failed - log but don't fail
        console.error('DB registration failed:', data.error);
      }

      setPurchaseStatus('success');

      // Update local property data
      if (fullProperty) {
        setFullProperty({
          ...fullProperty,
          availableTokens: fullProperty.availableTokens - tokenAmount,
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const parsedError = parseTransactionError(error);
      setValidationError(parsedError);
      setPurchaseStatus('error');
    }
  };

  // Figma tabs: Papeles, Contratos, PDFs, Smart Contracts
  const tabs: { id: TabType; label: string }[] = [
    { id: 'papeles', label: 'Papeles' },
    { id: 'contratos', label: 'Contratos' },
    { id: 'pdfs', label: 'PDFs' },
    { id: 'smartcontracts', label: 'Smart Contracts' },
  ];

  const images = property.images?.length ? property.images : [property.imageUrl];
  const documents = (fullProperty?.documents || []) as string[];

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={clearSelection}
            className="fixed inset-0 bg-black/40 z-50"
            aria-hidden="true"
          />

          {/* Panel - Slide from right - responsive width */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[85vw] lg:w-[80vw] z-50 overflow-hidden flex flex-col"
          >
            {/* White background with curved left edge - no curve on mobile */}
            <div className="absolute inset-0 bg-white md:rounded-l-[40px] lg:rounded-l-[80px]" />

            {/* Close Button - Arrow rotated 270° (pointing right) */}
            <button
              onClick={clearSelection}
              className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all duration-200 z-20 shadow-sm"
              aria-label="Cerrar"
            >
              <IconArrowClose size={20} color={brandConfig.colors.primary[600]} />
            </button>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-center md:justify-end p-3 md:p-4 border-b border-gray-200/50">
              <BrandLogo width={100} className="md:w-[140px]" />
              <span className="mx-2 text-gray-300 hidden md:inline">|</span>
              <p className="text-xs md:text-sm text-gray-500 hidden md:block">Tokenización Inmobiliaria | by {brandConfig.identity.appName}</p>
            </div>

            {/* Main Content - Single column on mobile, two columns on desktop */}
            <div className="relative z-10 flex-1 overflow-y-auto bg-white/80">
              <div className="flex flex-col lg:flex-row lg:h-full">
                {/* Left Column - Gallery */}
                <div className="w-full lg:w-[55%] p-4 md:p-6 md:pl-12 lg:pl-16">
                  {/* Status Badges - Figma style: 4 status pills */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                    {/* Disponible - Green */}
                    <span className={`px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-full ${
                      property.status === 'available' && property.availableTokens > property.totalTokens * 0.1
                        ? 'bg-green-500 text-white'
                        : 'bg-green-500/20 text-green-700 opacity-50'
                    }`}>
                      Disponible
                    </span>
                    {/* Sold Out - Orange */}
                    <span className={`px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-full ${
                      property.status === 'sold_out' || property.availableTokens === 0
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-500/20 text-orange-700 opacity-50'
                    }`}>
                      Sold Out
                    </span>
                    {/* Próximamente - Yellow */}
                    <span className={`px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-full ${
                      property.status === 'coming_soon'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-yellow-500/20 text-yellow-700 opacity-50'
                    }`}>
                      Próximamente
                    </span>
                    {/* Últimos Tokens - Blue */}
                    <span className={`px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-full ${
                      property.status === 'available' && property.availableTokens > 0 && property.availableTokens <= property.totalTokens * 0.1
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-600/20 text-primary-600 opacity-50'
                    }`}>
                      Últimos Tokens
                    </span>
                  </div>

                  {/* Main Image */}
                  <div className="relative rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-4 shadow-lg md:shadow-xl">
                    <img
                      src={images[selectedImage] || property.imageUrl}
                      alt={property.name}
                      className="w-full h-[200px] md:h-[300px] lg:h-[400px] object-cover"
                    />
                  </div>

                  {/* Thumbnail Gallery */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                    {images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`rounded-lg md:rounded-xl overflow-hidden shadow-md transition-all ${
                          selectedImage === idx ? 'ring-2 ring-primary-600 scale-105' : 'hover:scale-102'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Vista ${idx + 1}`}
                          className="w-full h-16 md:h-20 lg:h-28 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Column - Info - Figma layout */}
                <div className="w-full lg:w-[45%] p-4 md:p-6 bg-white lg:overflow-y-auto lg:border-l border-t lg:border-t-0 border-gray-200">
                  {/* Property Title - Figma: just name and location */}
                  <div className="mb-3 md:mb-4">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-600 mb-1">{property.name}</h2>
                    <p className="text-sm md:text-base lg:text-lg text-primary-600/70">{property.location}</p>
                  </div>

                  {/* Tabs - Figma: directly below title */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all border ${
                          activeTab === tab.id
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-primary-600 border-primary-600/30 hover:border-primary-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content - Figma: description with scroll */}
                  <div className="mb-3 md:mb-4">
                    {activeTab === 'papeles' && (
                      <>
                        {/* Descripción del proyecto - Figma: text block with scroll */}
                        <div className="mb-3 md:mb-4">
                          <h4 className="font-semibold text-primary-600 mb-1.5 md:mb-2 text-sm md:text-base">Descripción del proyecto</h4>
                          <p className="text-gray-600 text-xs md:text-sm leading-relaxed max-h-[80px] md:max-h-[120px] overflow-y-auto">
                            {property.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.'}
                          </p>
                        </div>

                        {/* Detalles del proyecto - Figma: blue box */}
                        <div className="bg-primary-600/10 rounded-lg md:rounded-xl p-3 md:p-4 mb-3 md:mb-4">
                          <h4 className="font-semibold text-primary-600 mb-1.5 md:mb-2 text-sm md:text-base">Detalles del proyecto</h4>
                          <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam
                          </p>
                        </div>

                        {/* Geolocalización Map - Figma: map in right column - hidden on mobile */}
                        <div className="mb-3 md:mb-4 hidden md:block">
                          <h4 className="font-semibold text-primary-600 mb-2 text-sm md:text-base">Geolocalización</h4>
                          <div className="rounded-lg md:rounded-xl overflow-hidden border border-gray-200">
                            <iframe
                              src={extractMapUrl(fullProperty?.mapUrl) || `https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&output=embed`}
                              width="100%"
                              height="120"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title={`Mapa de ${property.location}`}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'contratos' && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-600 mb-3">Contratos Legales</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-primary-600">Contrato de Inversión</p>
                              <p className="text-xs text-gray-500">Términos y condiciones de la inversión</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-primary-600">Garantías y Respaldo</p>
                              <p className="text-xs text-gray-500">Documentación de respaldo legal</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'pdfs' && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-600 mb-3">Documentos PDF</h4>
                        {!fullProperty ? (
                          <div className="flex items-center justify-center py-4">
                            <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">Cargando documentos...</span>
                          </div>
                        ) : documents.length > 0 ? (
                          <div className="space-y-2">
                            {documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={getDocumentViewUrl(doc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-600 transition-colors"
                              >
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-2.5 9.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-primary-600">
                                    {decodeURIComponent(doc.split('/').pop()?.split('?')[0] || `Documento ${idx + 1}`)}
                                  </p>
                                  <p className="text-xs text-gray-500">PDF</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No hay documentos disponibles</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'smartcontracts' && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-600 mb-3">Smart Contracts</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-primary-600">Property Token (ERC-1155)</span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono break-all">
                              {activeListing?.paymentTokenAddress || '0x...'}
                            </p>
                            <a
                              href={`https://polygonscan.com/address/${activeListing?.paymentTokenAddress || ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline mt-1 inline-flex items-center gap-1"
                            >
                              Ver en PolygonScan
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-primary-600">Marketplace Contract</span>
                            </div>
                            <p className="text-xs text-gray-500">Contrato verificado en Polygon</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fraction Values - Simplified for mobile */}
                  <div className="flex items-center justify-between bg-primary-600/5 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Precio por fracción</p>
                      <p className="text-lg md:text-xl font-bold text-primary-600">{property.pricePerToken} USD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Disponibles</p>
                      <p className="text-lg md:text-xl font-bold text-primary-600">{property.availableTokens}/{property.totalTokens}</p>
                    </div>
                  </div>

                  {/* Purchase Button - Figma: simple green button */}
                  {purchaseStatus === 'success' ? (
                    /* Success State */
                    <div className="bg-green-600 rounded-full p-3 md:p-4 text-white text-center">
                      <p className="font-bold text-sm md:text-base">✓ Compra Exitosa</p>
                      {txHash && (
                        <a
                          href={`https://polygonscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline mt-1 block"
                        >
                          Ver transacción
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Purchase Button - Figma style */
                    <button
                      onClick={handlePurchase}
                      disabled={
                        purchaseStatus === 'processing' ||
                        purchaseStatus === 'approving' ||
                        isValidating ||
                        property.availableTokens === 0
                      }
                      className={`w-full h-11 md:h-14 font-bold rounded-full transition-all text-sm md:text-lg shadow-lg flex items-center justify-center gap-2 ${
                        purchaseStatus === 'error' || validationError
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-[#16d63d] hover:bg-[#14c236] text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isValidating && (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Verificando...
                        </>
                      )}
                      {!isValidating && purchaseStatus === 'confirming' && 'Conectando...'}
                      {!isValidating && purchaseStatus === 'approving' && (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Aprobando USDT...
                        </>
                      )}
                      {!isValidating && purchaseStatus === 'processing' && (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Procesando compra...
                        </>
                      )}
                      {!isValidating && purchaseStatus === 'idle' && (
                        property.availableTokens === 0 ? 'Agotado' : 'Invertir con Cripto'
                      )}
                      {!isValidating && purchaseStatus === 'error' && 'Reintentar'}
                    </button>
                  )}

                  {/* Validation Steps - shown during validation */}
                  {showValidationDetails && validationSteps.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-2">Verificando requisitos...</p>
                      <div className="space-y-1.5">
                        {validationSteps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2 text-xs">
                            {step.status === 'pending' && (
                              <span className="w-4 h-4 rounded-full bg-gray-200" />
                            )}
                            {step.status === 'checking' && (
                              <svg className="w-4 h-4 animate-spin text-primary-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            )}
                            {step.status === 'success' && (
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {step.status === 'error' && (
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span className={step.status === 'error' ? 'text-red-600' : 'text-gray-600'}>
                              {step.label}
                              {step.error && <span className="text-red-500 ml-1">- {step.error}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validation Error with details */}
                  {validationError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">{validationError.message}</p>
                          {validationError.details && (
                            <div className="mt-2 text-xs text-red-600 space-y-1">
                              {validationError.details.required && (
                                <p>Requerido: <span className="font-medium">{validationError.details.required}</span></p>
                              )}
                              {validationError.details.available && (
                                <p>Disponible: <span className="font-medium">{validationError.details.available}</span></p>
                              )}
                              {validationError.details.difference && (
                                <p>Faltante: <span className="font-medium">{validationError.details.difference}</span></p>
                              )}
                            </div>
                          )}
                          {(validationError.code === 'INSUFFICIENT_USDT' || validationError.code === 'INSUFFICIENT_MATIC') && (
                            <p className="mt-2 text-xs text-red-600">
                              Puedes comprar tokens en{' '}
                              <a
                                href="https://quickswap.exchange/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium hover:text-red-800"
                              >
                                QuickSwap
                              </a>
                              {' '}o transferir desde otra wallet.
                            </p>
                          )}
                          {validationError.code === 'KYC_NOT_APPROVED' && (
                            <a
                              href="/profile"
                              className="mt-2 inline-block text-xs text-primary-600 underline font-medium"
                            >
                              Ir a mi perfil →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Legacy error message fallback */}
                  {purchaseError && !validationError && (
                    <p className="text-xs text-red-500 text-center mt-2">{purchaseError}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
