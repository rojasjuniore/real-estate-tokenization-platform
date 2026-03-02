'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/web3auth';
import { brandConfig } from '@/config/brand.config';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, isLoading, login } = useWeb3Auth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const redirectUrl = searchParams?.get('redirect') || '/#home';

  useEffect(() => {
    if (isConnected && !isLoading) {
      router.replace(redirectUrl);
    }
  }, [isConnected, isLoading, router, redirectUrl]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto mb-4" />
          <p className="text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#0f1f33] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#3d5a80] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{brandConfig.identity.appName}</h1>
          <p className="text-gray-500 mt-2">Inversión inmobiliaria tokenizada</p>
        </div>

        {/* Login Card */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-500 text-sm">
              Conecta tu wallet para acceder a la plataforma
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 px-6 bg-[#1e3a5f] hover:bg-[#2d4a6f] disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
                <span>Conectar Wallet</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Soportamos Web3Auth, MetaMask, WalletConnect y más
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link
            href="/"
            className="text-sm text-[#1e3a5f] hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
