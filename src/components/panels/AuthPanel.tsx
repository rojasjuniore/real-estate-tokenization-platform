'use client';

import { useEffect, useCallback } from 'react';
import { useWeb3Auth } from '@/lib/web3auth';
import { usePanelsStore } from '@/store';
import { brandConfig } from '@/config/brand.config';

/**
 * AuthPanel - Panel de autenticación con Web3Auth
 *
 * Abre el modal de Web3Auth que permite:
 * - Login social (Google, Apple, Facebook, etc.)
 * - Login con wallet (MetaMask, WalletConnect, etc.)
 * - Login con email
 */
export function AuthPanel() {
  const { login, isLoading, isConnected } = useWeb3Auth();
  const { closePanel, openPanel } = usePanelsStore();

  const checkKYCStatus = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch('/api/kyc/status', {
        headers: {
          'x-wallet-address': walletAddress,
        },
      });
      const data = await response.json();

      if (data.success) {
        const status = data.data.kycStatus;
        // Solo abrir KYC si el usuario NO tiene KYC aprobado o pendiente
        if (status === 'NONE' || status === 'REJECTED') {
          openPanel('kyc');
        } else {
          closePanel();
        }
      } else {
        // Usuario no encontrado = nuevo usuario, abrir KYC
        openPanel('kyc');
      }
    } catch {
      // En caso de error, abrir KYC para ser conservador
      openPanel('kyc');
    }
  }, [openPanel, closePanel]);

  const handleLogin = async () => {
    const result = await login();
    if (result.success && result.address) {
      // Verificar estado KYC usando el address retornado por el login
      await checkKYCStatus(result.address);
    }
  };

  // Si ya está conectado, cerrar el panel
  useEffect(() => {
    if (isConnected) {
      closePanel();
    }
  }, [isConnected, closePanel]);

  return (
    <div className="flex flex-col items-center text-center max-w-[280px] mx-auto">
      {/* Title */}
      <h2 className="text-2xl font-bold text-primary-600 mb-2">
        Iniciar Sesión
      </h2>

      <p className="text-gray-500 text-sm mb-6">
        Conecta tu wallet para acceder a {brandConfig.identity.appName}
      </p>

      {/* Login Button - Opens Web3Auth Modal */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-[20px] hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Conectando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Conectar Wallet
          </>
        )}
      </button>

      {/* Divider */}
      <div className="w-full border-t border-gray-200 my-6" />

      {/* Social Follow */}
      <div>
        <p className="text-gray-500 text-sm mb-3">Síguenos</p>
        <div className="flex gap-4 justify-center">
          <a href="#" className="text-primary-600 hover:opacity-70 transition-opacity" aria-label="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="#" className="text-primary-600 hover:opacity-70 transition-opacity" aria-label="YouTube">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a href="#" className="text-primary-600 hover:opacity-70 transition-opacity" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" className="text-primary-600 hover:opacity-70 transition-opacity" aria-label="LinkedIn">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
