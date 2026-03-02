'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/web3auth';
import { brandConfig } from '@/config/brand.config';

interface User {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
}

interface KYCSubmission {
  id: string;
  user: User;
  documentType: string;
  documentNumber: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
}

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminKYCPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
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

    async function loadSubmissions() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/kyc?status=${statusFilter}`, {
          headers: { 'x-wallet-address': address || '' },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Error loading KYC submissions');
        }

        setSubmissions(data.data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSubmissions();
  }, [isAdmin, address, statusFilter]);

  const handleUpdateStatus = async (submissionId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(submissionId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/kyc/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      // Reload submissions
      const reloadRes = await fetch(`/api/admin/kyc?status=${statusFilter}`, {
        headers: { 'x-wallet-address': address || '' },
      });
      const reloadData = await reloadRes.json();
      if (reloadData.success) {
        setSubmissions(reloadData.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating KYC status');
    } finally {
      setProcessingId(null);
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
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Verificación KYC</h1>
        <p className="text-gray-500">Revisa y aprueba solicitudes de verificación de identidad</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'PENDING'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-primary-600'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'APPROVED'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-green-600'
          }`}
        >
          Aprobados
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-4 py-2 rounded-[10px] font-medium transition ${
            statusFilter === 'REJECTED'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-red-600'
          }`}
        >
          Rechazados
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {statusFilter === 'PENDING' ? (
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ) : statusFilter === 'APPROVED' ? (
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">No hay solicitudes {statusFilter.toLowerCase()}</h3>
          <p className="text-gray-500">
            {statusFilter === 'PENDING'
              ? 'No hay solicitudes de KYC pendientes de revisión'
              : `No hay solicitudes ${statusFilter === 'APPROVED' ? 'aprobadas' : 'rechazadas'}`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Documento</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-primary-600 font-medium">{submission.user.name}</p>
                      <p className="text-sm text-gray-500">{submission.user.email}</p>
                      <p className="text-xs text-gray-400 font-mono">{submission.user.walletAddress}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-800">{submission.documentType}</p>
                      <p className="text-sm text-gray-500">{submission.documentNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{formatDate(submission.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(submission.status)}`}>
                      {submission.status === 'PENDING' ? 'Pendiente' : submission.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {statusFilter === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(submission.id, 'APPROVED')}
                          disabled={processingId === submission.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-[10px] transition disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(submission.id, 'REJECTED')}
                          disabled={processingId === submission.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-[10px] transition disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    <Link
                      href={`/admin/kyc/${submission.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-[#0b3d66] text-white text-sm rounded-[10px] transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver detalle
                    </Link>
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
