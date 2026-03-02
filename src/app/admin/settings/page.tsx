'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/lib/web3auth';
import { useContractInteraction } from '@/lib/contracts/useContractInteraction';
import { PAYMENT_TOKENS } from '@/lib/contracts/abis';

interface Settings {
  platformName: string;
  platformFee: number;
  minInvestment: number;
  maxInvestment: number;
  kycRequired: boolean;
  maintenanceMode: boolean;
  contactEmail: string;
  treasuryWallet: string;
  acceptedTokens: string[];
  defaultFractions: number;
}

interface BlockchainState {
  fee: number;
  treasury: string;
  isPaused: boolean;
  acceptedTokens: string[];
}

const AVAILABLE_TOKENS = Object.keys(PAYMENT_TOKENS);

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const {
    setMarketplaceFee,
    setMarketplaceTreasury,
    addPaymentTokenToMarketplace,
    removePaymentTokenFromMarketplace,
    pauseMarketplace,
    unpauseMarketplace,
    getMarketplaceFee,
    getMarketplaceTreasury,
    isMarketplacePaused,
    isPaymentTokenAccepted,
  } = useContractInteraction();

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingBlockchain, setIsSyncingBlockchain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [blockchainState, setBlockchainState] = useState<BlockchainState | null>(null);
  const [pendingTxs, setPendingTxs] = useState<string[]>([]);

  const [settings, setSettings] = useState<Settings>({
    platformName: '',
    platformFee: 0,
    minInvestment: 0,
    maxInvestment: 0,
    kycRequired: true,
    maintenanceMode: false,
    contactEmail: '',
    treasuryWallet: '',
    acceptedTokens: [],
    defaultFractions: 10000,
  });

  // Check admin status
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

  // Load blockchain state
  const loadBlockchainState = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const [fee, treasury, isPaused] = await Promise.all([
        getMarketplaceFee(),
        getMarketplaceTreasury(),
        isMarketplacePaused(),
      ]);

      // Check which tokens are accepted
      const tokenChecks = await Promise.all(
        AVAILABLE_TOKENS.map(async (token) => {
          const tokenAddress = PAYMENT_TOKENS[token];
          const isAccepted = await isPaymentTokenAccepted(tokenAddress);
          return { token, isAccepted };
        })
      );

      const acceptedTokens = tokenChecks
        .filter(({ isAccepted }) => isAccepted)
        .map(({ token }) => token);

      setBlockchainState({
        fee,
        treasury,
        isPaused,
        acceptedTokens,
      });
    } catch (err) {
      console.error('Error loading blockchain state:', err);
    }
  }, [isAdmin, getMarketplaceFee, getMarketplaceTreasury, isMarketplacePaused, isPaymentTokenAccepted]);

  // Load settings from DB
  useEffect(() => {
    if (!isAdmin) return;

    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings', {
          headers: { 'x-wallet-address': address || '' },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Error loading settings');
        }

        setSettings(data.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
    loadBlockchainState();
  }, [isAdmin, address, loadBlockchainState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleTokenToggle = (token: string) => {
    setSettings((prev) => ({
      ...prev,
      acceptedTokens: prev.acceptedTokens.includes(token)
        ? prev.acceptedTokens.filter(t => t !== token)
        : [...prev.acceptedTokens, token]
    }));
  };

  // Save to database only
  const handleSaveDB = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSuccessMessage('Configuración guardada en base de datos');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Sync settings to blockchain
  const handleSyncBlockchain = async () => {
    setIsSyncingBlockchain(true);
    setError(null);
    setPendingTxs([]);

    const txList: string[] = [];

    try {
      // 1. Update fee if different
      if (blockchainState && settings.platformFee !== blockchainState.fee) {
        txList.push('Actualizando comisión...');
        setPendingTxs([...txList]);
        const result = await setMarketplaceFee(settings.platformFee);
        if (!result.success) {
          throw new Error(`Error actualizando comisión: ${result.error}`);
        }
        txList[txList.length - 1] = `✓ Comisión actualizada (${result.txHash?.slice(0, 10)}...)`;
        setPendingTxs([...txList]);
      }

      // 2. Update treasury if different
      if (blockchainState && settings.treasuryWallet &&
          settings.treasuryWallet.toLowerCase() !== blockchainState.treasury.toLowerCase()) {
        txList.push('Actualizando wallet del tesoro...');
        setPendingTxs([...txList]);
        const result = await setMarketplaceTreasury(settings.treasuryWallet);
        if (!result.success) {
          throw new Error(`Error actualizando treasury: ${result.error}`);
        }
        txList[txList.length - 1] = `✓ Treasury actualizado (${result.txHash?.slice(0, 10)}...)`;
        setPendingTxs([...txList]);
      }

      // 3. Add new tokens
      if (blockchainState) {
        const tokensToAdd = settings.acceptedTokens.filter(
          t => !blockchainState.acceptedTokens.includes(t)
        );
        for (const token of tokensToAdd) {
          txList.push(`Agregando token ${token}...`);
          setPendingTxs([...txList]);
          const tokenAddress = PAYMENT_TOKENS[token];
          const result = await addPaymentTokenToMarketplace(tokenAddress);
          if (!result.success) {
            throw new Error(`Error agregando ${token}: ${result.error}`);
          }
          txList[txList.length - 1] = `✓ ${token} agregado (${result.txHash?.slice(0, 10)}...)`;
          setPendingTxs([...txList]);
        }

        // 4. Remove tokens
        const tokensToRemove = blockchainState.acceptedTokens.filter(
          t => !settings.acceptedTokens.includes(t)
        );
        for (const token of tokensToRemove) {
          txList.push(`Removiendo token ${token}...`);
          setPendingTxs([...txList]);
          const tokenAddress = PAYMENT_TOKENS[token];
          const result = await removePaymentTokenFromMarketplace(tokenAddress);
          if (!result.success) {
            throw new Error(`Error removiendo ${token}: ${result.error}`);
          }
          txList[txList.length - 1] = `✓ ${token} removido (${result.txHash?.slice(0, 10)}...)`;
          setPendingTxs([...txList]);
        }
      }

      // 5. Handle maintenance mode (pause/unpause)
      if (blockchainState) {
        if (settings.maintenanceMode && !blockchainState.isPaused) {
          txList.push('Pausando marketplace...');
          setPendingTxs([...txList]);
          const result = await pauseMarketplace();
          if (!result.success) {
            throw new Error(`Error pausando marketplace: ${result.error}`);
          }
          txList[txList.length - 1] = `✓ Marketplace pausado (${result.txHash?.slice(0, 10)}...)`;
          setPendingTxs([...txList]);
        } else if (!settings.maintenanceMode && blockchainState.isPaused) {
          txList.push('Despausando marketplace...');
          setPendingTxs([...txList]);
          const result = await unpauseMarketplace();
          if (!result.success) {
            throw new Error(`Error despausando marketplace: ${result.error}`);
          }
          txList[txList.length - 1] = `✓ Marketplace activo (${result.txHash?.slice(0, 10)}...)`;
          setPendingTxs([...txList]);
        }
      }

      if (txList.length === 0) {
        setSuccessMessage('La blockchain ya está sincronizada');
      } else {
        setSuccessMessage('Blockchain sincronizada correctamente');
      }

      // Reload blockchain state
      await loadBlockchainState();

      setTimeout(() => {
        setSuccessMessage(null);
        setPendingTxs([]);
      }, 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error syncing to blockchain');
    } finally {
      setIsSyncingBlockchain(false);
    }
  };

  // Check if there are differences between DB and blockchain
  const hasDifferences = blockchainState && (
    settings.platformFee !== blockchainState.fee ||
    (settings.treasuryWallet && settings.treasuryWallet.toLowerCase() !== blockchainState.treasury.toLowerCase()) ||
    settings.maintenanceMode !== blockchainState.isPaused ||
    JSON.stringify(settings.acceptedTokens.sort()) !== JSON.stringify(blockchainState.acceptedTokens.sort())
  );

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Configuración</h1>
        <p className="text-gray-500">Ajusta la configuración global de la plataforma</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-[15px] p-4">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Pending transactions */}
      {pendingTxs.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-[15px] p-4">
          <p className="text-blue-700 font-medium mb-2">Transacciones en progreso:</p>
          <ul className="space-y-1">
            {pendingTxs.map((tx, i) => (
              <li key={i} className="text-sm text-blue-600 font-mono">{tx}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Blockchain sync status */}
      {blockchainState && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-[15px] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">Estado en Blockchain</h3>
            {hasDifferences && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                Hay diferencias
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Comisión</p>
              <p className="font-medium">{blockchainState.fee}%</p>
            </div>
            <div>
              <p className="text-gray-500">Treasury</p>
              <p className="font-mono text-xs truncate">{blockchainState.treasury || 'No configurado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Estado</p>
              <p className={`font-medium ${blockchainState.isPaused ? 'text-yellow-600' : 'text-green-600'}`}>
                {blockchainState.isPaused ? 'Pausado' : 'Activo'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tokens</p>
              <p className="font-medium">{blockchainState.acceptedTokens.join(', ') || 'Ninguno'}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* General Settings */}
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-600 mb-6">General</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="platformName" className="block text-sm font-medium text-gray-600 mb-2">
                  Nombre de la Plataforma
                </label>
                <input
                  type="text"
                  id="platformName"
                  name="platformName"
                  value={settings.platformName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-600 mb-2">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary-600">Finanzas</h2>
              {blockchainState && settings.platformFee !== blockchainState.fee && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  On-chain: {blockchainState.fee}%
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="platformFee" className="block text-sm font-medium text-gray-600 mb-2">
                  Comisión de la Plataforma (%)
                </label>
                <input
                  type="number"
                  id="platformFee"
                  name="platformFee"
                  value={settings.platformFee}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Máximo 10% (1000 basis points)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minInvestment" className="block text-sm font-medium text-gray-600 mb-2">
                    Inversión Mínima (USD)
                  </label>
                  <input
                    type="number"
                    id="minInvestment"
                    name="minInvestment"
                    value={settings.minInvestment}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="maxInvestment" className="block text-sm font-medium text-gray-600 mb-2">
                    Inversión Máxima (USD)
                  </label>
                  <input
                    type="number"
                    id="maxInvestment"
                    name="maxInvestment"
                    value={settings.maxInvestment}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="defaultFractions" className="block text-sm font-medium text-gray-600 mb-2">
                  Fracciones por Defecto
                </label>
                <input
                  type="number"
                  id="defaultFractions"
                  name="defaultFractions"
                  value={settings.defaultFractions}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Número de fracciones por defecto al crear propiedades</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="treasuryWallet" className="block text-sm font-medium text-gray-600">
                    Wallet del Tesoro
                  </label>
                  {blockchainState && settings.treasuryWallet &&
                   settings.treasuryWallet.toLowerCase() !== blockchainState.treasury.toLowerCase() && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      On-chain diferente
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  id="treasuryWallet"
                  name="treasuryWallet"
                  value={settings.treasuryWallet}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Dirección donde se reciben las comisiones del marketplace</p>
              </div>
            </div>
          </div>

          {/* Payment Tokens */}
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary-600">Tokens Aceptados</h2>
              {blockchainState && JSON.stringify(settings.acceptedTokens.sort()) !== JSON.stringify(blockchainState.acceptedTokens.sort()) && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  On-chain: {blockchainState.acceptedTokens.join(', ') || 'Ninguno'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {AVAILABLE_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => handleTokenToggle(token)}
                  className={`px-4 py-2 rounded-full border-2 transition font-medium ${
                    settings.acceptedTokens.includes(token)
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-primary-600'
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Selecciona los tokens que los usuarios pueden usar para comprar fracciones</p>
          </div>

          {/* Security Settings */}
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-600 mb-6">Seguridad</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-gray-800 font-medium">KYC Requerido</p>
                  <p className="text-sm text-gray-500">
                    Requiere verificación de identidad para invertir
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="kycRequired"
                    checked={settings.kycRequired}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-600/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 font-medium">Modo Mantenimiento</p>
                    {blockchainState && settings.maintenanceMode !== blockchainState.isPaused && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        On-chain: {blockchainState.isPaused ? 'Pausado' : 'Activo'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Desactiva todas las operaciones de la plataforma (pausa el smart contract)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button
              onClick={handleSaveDB}
              disabled={isSaving || isSyncingBlockchain}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-[10px] transition font-medium disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar en BD'}
            </button>
            <button
              onClick={handleSyncBlockchain}
              disabled={isSaving || isSyncingBlockchain || !hasDifferences}
              className={`px-8 py-3 rounded-[10px] transition font-medium disabled:opacity-50 ${
                hasDifferences
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSyncingBlockchain ? 'Sincronizando...' : hasDifferences ? 'Sincronizar Blockchain' : 'Sincronizado'}
            </button>
          </div>
        </div>
      )}

      {/* Warning for Maintenance Mode */}
      {settings.maintenanceMode && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-[15px] p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-yellow-700 font-medium">Modo Mantenimiento Activo</h4>
              <p className="text-yellow-600 text-sm mt-1">
                La plataforma está actualmente en modo mantenimiento. Los usuarios no pueden realizar operaciones.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
