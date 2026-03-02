'use client';

import { useState, useEffect } from 'react';
import { usePanelsStore } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';
import { brandConfig } from '@/config/brand.config';

export function SettingsPanel() {
  const { closePanel, openPanel } = usePanelsStore();
  const { address, userInfo } = useWeb3Auth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from DB on mount
  useEffect(() => {
    if (!address) return;

    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${address}`);
        const data = await response.json();

        if (data.success && data.data?.name) {
          setSavedName(data.data.name);
          setName(data.data.name);
        } else {
          // Use Web3Auth name as fallback
          setName(userInfo?.name || '');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setName(userInfo?.name || '');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [address, userInfo?.name]);

  const handleBack = () => {
    closePanel();
    setTimeout(() => openPanel('account'), 100);
  };

  const handleSaveName = async () => {
    if (!address || !name.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedName(name.trim());
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(savedName || userInfo?.name || '');
    setIsEditingName(false);
  };

  const displayName = savedName || userInfo?.name || 'No configurado';

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
        <h2 className="text-xl font-bold text-primary-600">Configuración</h2>
      </div>

      {/* Profile Section */}
      <div className="bg-white border border-gray-200 rounded-[15px] p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Perfil</h3>

        <div className="space-y-3">
          {/* Editable Name Field */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3 flex-1">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Nombre</p>
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Tu nombre"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    {isLoading ? 'Cargando...' : displayName}
                  </p>
                )}
              </div>
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                  title="Cancelar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={isSaving || !name.trim()}
                  className="p-1.5 text-green-500 hover:text-green-600 transition disabled:opacity-50"
                  title="Guardar"
                >
                  {isSaving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1.5 text-primary-600 hover:bg-gray-100 rounded-full transition"
                title="Editar nombre"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          {/* Email - Read only from Web3Auth */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-xs text-gray-500">{userInfo?.email || 'No configurado'}</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">Web3Auth</span>
          </div>

          {/* Wallet - Read only */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700">Wallet</p>
                <p className="text-xs text-gray-500 font-mono">
                  {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : 'No conectada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white border border-gray-200 rounded-[15px] p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Seguridad</h3>

        <button
          onClick={() => {
            closePanel();
            setTimeout(() => openPanel('kyc'), 100);
          }}
          className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition px-2"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">Verificación KYC</p>
              <p className="text-xs text-gray-500">Verifica tu identidad</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">{brandConfig.identity.appName} v1.0.0</p>
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} {brandConfig.identity.appName}. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
