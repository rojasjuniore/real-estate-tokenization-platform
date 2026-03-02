'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWeb3Auth } from '@/lib/web3auth';
import { getDocumentViewUrl } from '@/lib/utils/documents';

interface Property {
  id: string;
  name: string;
  location: string;
  propertyType: string;
  totalFractions: number;
  pricePerFraction: string;
  estimatedROI: string;
  timeline: string;
  images: string[];
  documents: string[];
  description: string;
  createdAt: string;
}

interface ApprovalResult {
  tokenId: number;
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  message?: string;
  approveTxHash?: string;
  listingTxHash?: string;
  onChainListingId?: number;
}

type ApprovalStep = 'idle' | 'confirming' | 'deploying' | 'listing' | 'success' | 'error';

export default function PendingPropertiesPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Approval process state
  const [approvalStep, setApprovalStep] = useState<ApprovalStep>('idle');
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

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

    async function fetchProperties() {
      try {
        const response = await fetch('/api/properties?status=PENDING_REVIEW', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();

        if (data.success && data.data?.properties) {
          setProperties(data.data.properties);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperties();
  }, [isAdmin, address]);

  const openApproveModal = (property: Property) => {
    setSelectedProperty(property);
    setApprovalStep('idle');
    setApprovalResult(null);
    setApprovalError(null);
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedProperty) return;

    setApprovalStep('confirming');
    setApprovalError(null);

    // Small delay to show "confirming" state
    await new Promise(resolve => setTimeout(resolve, 500));
    setApprovalStep('deploying');

    try {
      const response = await fetch('/api/admin/properties/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApprovalResult({
          ...data.data.blockchain,
          message: data.data.message,
        });
        setApprovalStep('success');
        // Remove from list
        setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
      } else {
        setApprovalError(data.error.message);
        setApprovalStep('error');
      }
    } catch {
      setApprovalError('Error de conexión al aprobar la propiedad');
      setApprovalStep('error');
    }
  };

  const closeApproveModal = () => {
    setShowApproveModal(false);
    setSelectedProperty(null);
    setApprovalStep('idle');
    setApprovalResult(null);
    setApprovalError(null);
  };

  const handleReject = async () => {
    if (!selectedProperty || !rejectionReason.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/properties/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from list
        setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
        setSelectedProperty(null);
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Error al rechazar la propiedad');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (property: Property) => {
    setSelectedProperty(property);
    setShowRejectModal(true);
  };

  const formatPropertyType = (type: string) => {
    const types: Record<string, string> = {
      RESIDENTIAL: 'Residencial',
      COMMERCIAL: 'Comercial',
      INDUSTRIAL: 'Industrial',
      MIXED: 'Mixto',
    };
    return types[type] || type;
  };

  const formatTimeline = (timeline: string) => {
    return timeline === 'SHORT_TERM' ? 'Corto Plazo' : 'Largo Plazo';
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://polygonscan.com/tx/${txHash}`;
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:text-primary-600">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin/properties" className="hover:text-primary-600">
            Propiedades
          </Link>
          <span>/</span>
          <span className="text-primary-600">Pendientes</span>
        </div>
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Propiedades Pendientes de Revisión</h1>
        <p className="text-gray-500">Revisa y aprueba o rechaza las propiedades antes de su tokenización</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando propiedades...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-600 mb-2">No hay propiedades pendientes</h3>
          <p className="text-gray-400">Todas las propiedades han sido revisadas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="lg:w-80 h-48 lg:h-auto relative flex-shrink-0">
                  {property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-primary-600 mb-1">{property.name}</h3>
                      <p className="text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {property.location}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                      Pendiente
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Tipo</p>
                      <p className="text-sm font-medium text-gray-700">{formatPropertyType(property.propertyType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Fracciones</p>
                      <p className="text-sm font-medium text-gray-700">{property.totalFractions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Precio/Fracción</p>
                      <p className="text-sm font-medium text-gray-700">${parseFloat(property.pricePerFraction).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">ROI Estimado</p>
                      <p className="text-sm font-medium text-green-600">{parseFloat(property.estimatedROI).toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>

                  {/* Documents */}
                  {property.documents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 uppercase mb-2">Documentos ({property.documents.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {property.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={getDocumentViewUrl(doc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600 transition"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                            </svg>
                            Doc {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline and Created Date */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Horizonte: {formatTimeline(property.timeline)}</span>
                    <span>Creado: {new Date(property.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openApproveModal(property)}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-[10px] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobar y Tokenizar
                    </button>
                    <button
                      onClick={() => openRejectModal(property)}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-[10px] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rechazar
                    </button>
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="px-4 py-2.5 border border-gray-300 hover:border-primary-600 text-gray-600 hover:text-primary-600 font-medium rounded-[10px] transition"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-lg p-6">
            {/* Idle State - Confirmation */}
            {approvalStep === 'idle' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-600 mb-2">Aprobar y Tokenizar</h3>
                  <p className="text-gray-500">
                    ¿Confirmas la aprobación de <strong>&quot;{selectedProperty.name}&quot;</strong>?
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Esta acción desplegará el token en blockchain</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Se creará un token ERC-1155 con {selectedProperty.totalFractions.toLocaleString()} fracciones en Polygon.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeApproveModal}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-[10px] hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-[10px] transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar Aprobación
                  </button>
                </div>
              </>
            )}

            {/* Confirming State */}
            {approvalStep === 'confirming' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">Preparando transacción...</h3>
                <p className="text-gray-500">Verificando datos de la propiedad</p>
              </div>
            )}

            {/* Deploying State */}
            {approvalStep === 'deploying' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">Desplegando en Blockchain</h3>
                <p className="text-gray-500 mb-4">Paso 1/3: Creando token en Polygon...</p>
                <div className="bg-gray-50 rounded-[10px] p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                      <span>1. Creando token ERC-1155</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                      <span>2. Aprobando marketplace</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                      <span>3. Creando listing</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">Este proceso puede tardar hasta 1 minuto</p>
              </div>
            )}

            {/* Listing State */}
            {approvalStep === 'listing' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-green-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">Listando en Marketplace</h3>
                <p className="text-gray-500 mb-4">Paso 3/3: Creando listing de venta...</p>
                <div className="bg-gray-50 rounded-[10px] p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>1. Token creado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>2. Marketplace aprobado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                      <span>3. Creando listing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {approvalStep === 'success' && approvalResult && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  {approvalResult.txHash === 'already-deployed'
                    ? '¡Sincronización Exitosa!'
                    : approvalResult.listingTxHash
                    ? '¡Tokenización y Listing Exitosos!'
                    : '¡Tokenización Exitosa!'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {approvalResult.message
                    ? approvalResult.message
                    : approvalResult.txHash === 'already-deployed'
                    ? 'El token ya existía en blockchain, base de datos sincronizada'
                    : approvalResult.listingTxHash
                    ? 'La propiedad ha sido tokenizada y listada en el marketplace'
                    : 'La propiedad ha sido tokenizada en Polygon'}
                </p>

                <div className="bg-gray-50 rounded-[10px] p-4 mb-6 text-left space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Token ID</p>
                    <p className="text-sm font-mono font-medium text-gray-800">{approvalResult.tokenId}</p>
                  </div>
                  {approvalResult.txHash !== 'already-deployed' && (
                    <>
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1">Transaction Hash</p>
                        <a
                          href={getExplorerUrl(approvalResult.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-primary-600 hover:underline flex items-center gap-1"
                        >
                          {truncateHash(approvalResult.txHash)}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1">Block Number</p>
                        <p className="text-sm font-mono font-medium text-gray-800">{approvalResult.blockNumber.toLocaleString()}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Contract Address</p>
                    <a
                      href={`https://polygonscan.com/address/${approvalResult.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {truncateHash(approvalResult.contractAddress)}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  {approvalResult.listingTxHash && (
                    <>
                      <hr className="border-gray-200" />
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1">Listing ID</p>
                        <p className="text-sm font-mono font-medium text-gray-800">#{approvalResult.onChainListingId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase mb-1">Listing TX</p>
                        <a
                          href={getExplorerUrl(approvalResult.listingTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-primary-600 hover:underline flex items-center gap-1"
                        >
                          {truncateHash(approvalResult.listingTxHash)}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {approvalResult.txHash === 'already-deployed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-3 mb-4">
                    <p className="text-xs text-blue-700">
                      <strong>Nota:</strong> Este token fue creado previamente en blockchain (posiblemente por una aprobación anterior que no completó la sincronización).
                      La base de datos ahora está sincronizada.
                    </p>
                  </div>
                )}

                <button
                  onClick={closeApproveModal}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-[10px] transition"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Error State */}
            {approvalStep === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Error en la Tokenización</h3>
                <p className="text-gray-500 mb-4">{approvalError}</p>

                <div className="bg-red-50 border border-red-200 rounded-[10px] p-4 mb-6">
                  <p className="text-sm text-red-700">
                    {approvalError?.includes('insufficient funds')
                      ? 'Verifica que la wallet tenga suficiente MATIC para gas.'
                      : approvalError?.includes('CONTRACT_ERROR')
                      ? 'Error en el smart contract. Verifica los parámetros de la propiedad.'
                      : approvalError?.includes('RPC')
                      ? 'Error de conexión con la red. Intenta de nuevo.'
                      : 'La transacción no pudo completarse. Intenta de nuevo o contacta soporte.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeApproveModal}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-[10px] hover:bg-gray-50 transition"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setApprovalStep('idle');
                      setApprovalError(null);
                    }}
                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-[10px] transition"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-primary-600 mb-2">Rechazar Propiedad</h3>
            <p className="text-gray-500 mb-4">
              ¿Estás seguro de rechazar &quot;{selectedProperty.name}&quot;? Por favor, indica el motivo del rechazo.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Escribe el motivo del rechazo..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none resize-none mb-4"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedProperty(null);
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-[10px] hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-[10px] transition disabled:opacity-50"
              >
                {isProcessing ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
