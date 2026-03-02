'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/web3auth';

interface User {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
  kycStatus: string;
}

interface KYCSubmission {
  id: string;
  user: User;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  status: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  marketplaceTxHash?: string;
  paymentProcessorTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export default function KYCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    async function loadSubmission() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/kyc/${id}`, {
          headers: { 'x-wallet-address': address || '' },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Error loading KYC submission');
        }

        setSubmission(data.data);
        setAdminNotes(data.data.adminNotes || '');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSubmission();
  }, [isAdmin, address, id]);

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/kyc/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({ status, adminNotes }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSubmission(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating KYC status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      APPROVED: 'bg-green-100 text-green-700 border border-green-300',
      REJECTED: 'bg-red-100 text-red-700 border border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">Solicitud no encontrada</h3>
          <p className="text-gray-500 mb-6">La solicitud de KYC que buscas no existe</p>
          <Link
            href="/admin/kyc"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-[10px] hover:bg-primary-700 transition"
          >
            Volver a la lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/kyc"
          className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-4 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a la lista
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-600 mb-2">Detalle KYC</h1>
            <p className="text-gray-500">Revisa la documentación del usuario</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(submission.status)}`}>
            {submission.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-primary-600 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Información del Usuario
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nombre</p>
            <p className="text-gray-800 font-medium">{submission.user.name || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="text-gray-800">{submission.user.email || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Wallet</p>
            <p className="text-gray-800 font-mono text-sm">{submission.user.walletAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Estado KYC del Usuario</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(submission.user.kycStatus)}`}>
              {submission.user.kycStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-primary-600 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documentos
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* ID Front */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Documento (Frente)</p>
            <button
              onClick={() => setSelectedImage(submission.idFrontUrl)}
              className="w-full aspect-[4/3] bg-gray-50 border border-gray-200 rounded-[10px] overflow-hidden hover:border-primary-600 transition group"
            >
              {submission.idFrontUrl ? (
                <img
                  src={submission.idFrontUrl}
                  alt="ID Front"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* ID Back */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Documento (Reverso)</p>
            <button
              onClick={() => setSelectedImage(submission.idBackUrl)}
              className="w-full aspect-[4/3] bg-gray-50 border border-gray-200 rounded-[10px] overflow-hidden hover:border-primary-600 transition group"
            >
              {submission.idBackUrl ? (
                <img
                  src={submission.idBackUrl}
                  alt="ID Back"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Selfie */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Selfie con Documento</p>
            <button
              onClick={() => setSelectedImage(submission.selfieUrl)}
              className="w-full aspect-[4/3] bg-gray-50 border border-gray-200 rounded-[10px] overflow-hidden hover:border-primary-600 transition group"
            >
              {submission.selfieUrl ? (
                <img
                  src={submission.selfieUrl}
                  alt="Selfie"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">Haz clic en una imagen para ampliarla</p>
      </div>

      {/* Timeline Card */}
      <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-primary-600 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historial
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Solicitud creada</p>
              <p className="text-sm text-gray-500">{formatDate(submission.createdAt)}</p>
            </div>
          </div>
          {submission.reviewedAt && (
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                submission.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-4 h-4 ${submission.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {submission.status === 'APPROVED' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <div>
                <p className="text-gray-800 font-medium">
                  {submission.status === 'APPROVED' ? 'Solicitud aprobada' : 'Solicitud rechazada'}
                </p>
                <p className="text-sm text-gray-500">{formatDate(submission.reviewedAt)}</p>
                {submission.reviewedBy && (
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    Por: {truncateAddress(submission.reviewedBy)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* On-Chain Transaction Hashes */}
      {(submission.marketplaceTxHash || submission.paymentProcessorTxHash) && (
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-primary-600 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Transacciones On-Chain
          </h2>
          <div className="space-y-3">
            {submission.marketplaceTxHash && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-[10px]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 mb-1">PropertyMarketplace</p>
                  <p className="text-xs font-mono text-gray-800 break-all">{submission.marketplaceTxHash}</p>
                </div>
                <a
                  href={`https://polygonscan.com/tx/${submission.marketplaceTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-[8px] transition flex items-center gap-1 flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver
                </a>
              </div>
            )}
            {submission.paymentProcessorTxHash && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-[10px]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 mb-1">PaymentProcessor</p>
                  <p className="text-xs font-mono text-gray-800 break-all">{submission.paymentProcessorTxHash}</p>
                </div>
                <a
                  href={`https://polygonscan.com/tx/${submission.paymentProcessorTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[8px] transition flex items-center gap-1 flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Notes & Actions */}
      {submission.status === 'PENDING' ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary-600 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Revisión
          </h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Notas del administrador (opcional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Añade notas sobre esta verificación..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-600 resize-none"
              rows={3}
            />
          </div>
          {/* Processing overlay */}
          {isProcessing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-[10px]">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                <div>
                  <p className="text-blue-800 font-medium">Procesando transacciones on-chain...</p>
                  <p className="text-blue-600 text-sm">Esto puede tomar unos segundos. Por favor espera.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleUpdateStatus('APPROVED')}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-[10px] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isProcessing ? 'Procesando...' : 'Aprobar'}
            </button>
            <button
              onClick={() => handleUpdateStatus('REJECTED')}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-[10px] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {isProcessing ? 'Procesando...' : 'Rechazar'}
            </button>
          </div>
        </div>
      ) : submission.adminNotes ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary-600 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Notas del Administrador
          </h2>
          <p className="text-gray-600">{submission.adminNotes}</p>
        </div>
      ) : null}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Document"
            className="max-w-full max-h-full object-contain rounded-[15px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
