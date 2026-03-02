'use client';

import { usePanelsStore } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';
import { useKYC } from '@/hooks/useKYC';

/**
 * AccountPanel - Panel de cuenta de usuario logueado
 *
 * Muestra:
 * - Avatar y nombre/email
 * - Wallet address
 * - Estado KYC
 * - Balance (USDT, MATIC)
 * - Botón Cerrar Sesión
 */
export function AccountPanel() {
  const { closePanel, openPanel } = usePanelsStore();
  const { userInfo, address, logout, getBalances } = useWeb3Auth();
  const { status: kycStatus, isApproved, isPending, isRejected, needsKYC } = useKYC();

  const handleLogout = async () => {
    await logout();
    closePanel();
  };

  const handleKYCClick = () => {
    closePanel();
    setTimeout(() => openPanel('kyc'), 100);
  };

  // Get initials for avatar
  const initial = userInfo?.name?.charAt(0)?.toUpperCase() ||
                  userInfo?.email?.charAt(0)?.toUpperCase() ||
                  address?.slice(2, 4)?.toUpperCase() ||
                  '?';

  // Format address
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // KYC status config
  const kycConfig = {
    NONE: { label: 'No Verificado', color: 'text-gray-500', bg: 'bg-gray-100', action: 'Verificar' },
    PENDING: { label: 'En Revisión', color: 'text-blue-600', bg: 'bg-blue-100', action: null },
    APPROVED: { label: 'Verificado', color: 'text-green-600', bg: 'bg-green-100', action: null },
    REJECTED: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-100', action: 'Reintentar' },
  };

  const currentKYC = kycConfig[kycStatus] || kycConfig.NONE;

  return (
    <div className="flex flex-col items-center max-w-[280px] mx-auto min-h-full justify-center">
      {/* Avatar */}
      <div className="relative mb-4">
        {userInfo?.profileImage ? (
          <img
            src={userInfo.profileImage}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-[#3d5a80] flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-white font-bold text-2xl">{initial}</span>
          </div>
        )}
        {/* Verified badge */}
        {isApproved && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#16d63d] rounded-full flex items-center justify-center border-2 border-white">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Name/Email */}
      <h2 className="text-xl font-bold text-primary-600 mb-1">
        {userInfo?.name || 'Usuario'}
      </h2>
      {userInfo?.email && (
        <p className="text-sm text-gray-500 mb-2">{userInfo.email}</p>
      )}

      {/* Wallet Address */}
      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-4">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="text-sm font-mono text-gray-600">{shortAddress}</span>
        <button
          onClick={() => navigator.clipboard.writeText(address || '')}
          className="text-gray-400 hover:text-gray-600"
          title="Copiar dirección"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* KYC Status */}
      <div className="w-full mb-4">
        <div className={`flex items-center justify-between p-3 rounded-[15px] ${currentKYC.bg}`}>
          <div className="flex items-center gap-2">
            {isApproved ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : isPending ? (
              <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span className={`text-sm font-medium ${currentKYC.color}`}>
              KYC: {currentKYC.label}
            </span>
          </div>
          {currentKYC.action && (
            <button
              onClick={handleKYCClick}
              className="text-xs font-medium text-primary-600 hover:underline"
            >
              {currentKYC.action}
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-gray-200 my-4" />

      {/* Quick Actions */}
      <div className="w-full space-y-2 mb-4">
        <button
          onClick={() => {
            closePanel();
            setTimeout(() => openPanel('portfolio'), 100);
          }}
          className="w-full flex items-center gap-3 p-3 rounded-[15px] hover:bg-gray-50 transition-colors text-left"
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm text-gray-700">Mi Portafolio</span>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => {
            closePanel();
            setTimeout(() => openPanel('dividends'), 100);
          }}
          className="w-full flex items-center gap-3 p-3 rounded-[15px] hover:bg-gray-50 transition-colors text-left"
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-700">Mis Dividendos</span>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => {
            closePanel();
            setTimeout(() => openPanel('settings'), 100);
          }}
          className="w-full flex items-center gap-3 p-3 rounded-[15px] hover:bg-gray-50 transition-colors text-left"
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-gray-700">Configuración</span>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 border border-red-300 text-red-500 font-medium rounded-[20px] hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Cerrar Sesión
      </button>
    </div>
  );
}
