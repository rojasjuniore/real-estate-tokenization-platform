'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/lib/web3auth';
import Link from 'next/link';
import { brandConfig } from '@/config/brand.config';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  pendingKyc: number;
  tvl: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  // Debug log
  console.log('[Admin Page] State:', { authLoading, isConnected, address, isLoading, checkComplete });

  const fetchDashboardData = useCallback(async () => {
    console.log('[Admin Page] fetchDashboardData called, address:', address);
    if (!address) {
      setIsLoading(false);
      setCheckComplete(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[Admin Page] Fetching dashboard...');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'x-wallet-address': address,
        },
      });

      const result = await response.json();
      console.log('[Admin Page] Dashboard response:', result);

      if (response.status === 403 || !result.success) {
        setIsAdmin(false);
        setError('No tienes permisos de administrador');
      } else {
        setStats(result.data);
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('[Admin Page] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
    } finally {
      setIsLoading(false);
      setCheckComplete(true);
    }
  }, [address]);

  useEffect(() => {
    console.log('[Admin Page] useEffect - authLoading:', authLoading, 'address:', address);
    if (authLoading) return;
    fetchDashboardData();
  }, [authLoading, fetchDashboardData]);

  // Loading state - with timeout to prevent infinite loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!checkComplete && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Not connected - redirect to login
  if (!isConnected) {
    router.replace('/login?redirect=/admin');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Not admin or error
  if (!isAdmin || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary-600 mb-2">Sin Autorización</h2>
          <p className="text-gray-500 mb-2">{error || 'Tu wallet no tiene permisos de administrador.'}</p>
          <p className="text-xs text-gray-400 font-mono mb-6">{address}</p>
          <Link
            href="/#home"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-[10px] hover:bg-[#0b3d66] transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">Dashboard</h1>
            <p className="text-sm text-gray-500">Panel de Administración - {brandConfig.identity.appName}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <Link
              href="/#home"
              className="px-4 py-2 text-sm text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-600/5 transition-colors"
            >
              Volver al Sitio
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* TVL */}
          <div className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Total Tokenizado</p>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">
              ${stats?.tvl?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Usuarios */}
          <div className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Usuarios Totales</p>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalUsers || 0}</p>
          </div>

          {/* Propiedades */}
          <div className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Propiedades</p>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalProperties || 0}</p>
          </div>

          {/* KYC Pendientes */}
          <div className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">KYC Pendientes</p>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats?.pendingKyc || 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-6">
        <h3 className="font-semibold text-primary-600 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/properties/new"
            className="flex items-center gap-3 p-4 rounded-xl bg-primary-600 text-white hover:bg-[#2d4a6f] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Crear Propiedad</span>
          </Link>
          <Link
            href="/admin/dividends"
            className="flex items-center gap-3 p-4 rounded-xl border border-primary-600 text-primary-600 hover:bg-primary-600/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span>Distribuir Rendimiento</span>
          </Link>
          <Link
            href="/admin/kyc"
            className="flex items-center gap-3 p-4 rounded-xl border border-primary-600 text-primary-600 hover:bg-primary-600/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Aprobar KYC ({stats?.pendingKyc || 0})</span>
          </Link>
{/* Propiedades Pendientes - Hidden from dashboard */}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-8 pb-8">
        <h3 className="font-semibold text-primary-600 mb-4">Módulos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/properties" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">Propiedades</h4>
            <p className="text-sm text-gray-500">Gestionar propiedades</p>
          </Link>

          <Link href="/admin/dividends" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">Rendimientos</h4>
            <p className="text-sm text-gray-500">Distribuir dividendos</p>
          </Link>

          <Link href="/admin/users" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">Usuarios</h4>
            <p className="text-sm text-gray-500">Gestionar usuarios</p>
          </Link>

          <Link href="/admin/kyc" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">KYC</h4>
            <p className="text-sm text-gray-500">Verificaciones</p>
          </Link>

          <Link href="/admin/marketplace" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">Marketplace</h4>
            <p className="text-sm text-gray-500">Control de trading</p>
          </Link>

          <Link href="/admin/contracts" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">Contratos</h4>
            <p className="text-sm text-gray-500">Smart contracts</p>
          </Link>

          <Link href="/admin/settings" className="bg-white rounded-[15px] p-6 shadow-sm border border-gray-100 hover:border-primary-600 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-primary-600">Configuración</h4>
            <p className="text-sm text-gray-500">Ajustes del sistema</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
