'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/web3auth';
import { brandConfig } from '@/config/brand.config';

interface RoleResult {
  contract: string;
  address: string;
  hasAdminRole?: boolean;
  hasDefaultAdminRole?: boolean;
  error?: string;
}

interface ActionResult {
  contract: string;
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  message?: string;
  error?: string;
  skipped?: boolean;
}

interface RoleTransaction {
  id: string;
  targetAddress: string;
  executedBy: string;
  action: 'GRANT' | 'REVOKE';
  contractName: string;
  contractAddress: string;
  txHash: string;
  blockNumber?: number;
  gasUsed?: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

const AVAILABLE_CONTRACTS = [
  { name: 'PropertyToken', label: 'Property Token (ERC-1155)' },
  { name: 'PropertyMarketplace', label: 'Property Marketplace' },
];

export default function RolesPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [targetAddress, setTargetAddress] = useState('');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [action, setAction] = useState<'grant' | 'revoke'>('grant');

  // Check state
  const [checkResults, setCheckResults] = useState<RoleResult[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Action state
  const [actionResults, setActionResults] = useState<ActionResult[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<RoleTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  // Cargar historial
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/admin/roles/history', {
        headers: { 'x-wallet-address': address || '' },
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data.transactions);
      }
    } catch {
      console.error('Error loading history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isAdmin && address) {
      loadHistory();
    }
  }, [isAdmin, address]);

  const handleCheckRoles = async () => {
    if (!targetAddress) return;

    setIsChecking(true);
    setCheckResults(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/roles?address=${targetAddress}`, {
        headers: { 'x-wallet-address': address || '' },
      });
      const data = await response.json();

      if (data.success) {
        setCheckResults(data.data.roles);
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Error al verificar roles');
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleContract = (contractName: string) => {
    setSelectedContracts((prev) =>
      prev.includes(contractName)
        ? prev.filter((c) => c !== contractName)
        : [...prev, contractName]
    );
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === AVAILABLE_CONTRACTS.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(AVAILABLE_CONTRACTS.map((c) => c.name));
    }
  };

  const handleExecuteAction = async () => {
    if (!targetAddress || selectedContracts.length === 0) return;

    setIsProcessing(true);
    setActionResults(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || '',
        },
        body: JSON.stringify({
          targetAddress,
          action,
          contracts: selectedContracts,
        }),
      });

      const data = await response.json();

      if (data.success || data.data) {
        setActionResults(data.data.results);
        // Refresh check results and history
        handleCheckRoles();
        loadHistory();
      } else {
        setError(data.error.message);
      }
    } catch {
      setError('Error al ejecutar la acción');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
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
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:text-primary-600">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-primary-600">Gestión de Roles</span>
        </div>
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Gestión de Roles</h1>
        <p className="text-gray-500">
          Administra los roles de admin en los smart contracts
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
        {/* Address Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección de Wallet
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none font-mono"
            />
            <button
              onClick={handleCheckRoles}
              disabled={!isValidAddress(targetAddress) || isChecking}
              className="px-6 py-3 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[10px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Verificando...' : 'Verificar Roles'}
            </button>
          </div>
          {targetAddress && !isValidAddress(targetAddress) && (
            <p className="text-red-500 text-sm mt-2">Dirección inválida</p>
          )}
        </div>

        {/* Check Results */}
        {checkResults && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-[15px] p-4">
            <h3 className="font-medium text-gray-700 mb-3">Roles Actuales</h3>
            <div className="space-y-2">
              {checkResults.map((result) => (
                <div
                  key={result.contract}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className="font-medium text-gray-800">{result.contract}</span>
                    <span className="text-gray-400 text-xs ml-2 font-mono">
                      {result.address?.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {result.error ? (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                        Error
                      </span>
                    ) : (
                      <>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            result.hasAdminRole
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {result.hasAdminRole ? 'ADMIN' : 'No Admin'}
                        </span>
                        {result.hasDefaultAdminRole && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            DEFAULT_ADMIN
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-700 mb-4">Modificar Roles</h3>

          {/* Action Type */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={action === 'grant'}
                onChange={() => setAction('grant')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-gray-700">Otorgar ADMIN_ROLE</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={action === 'revoke'}
                onChange={() => setAction('revoke')}
                className="w-4 h-4 text-red-500"
              />
              <span className="text-gray-700">Revocar ADMIN_ROLE</span>
            </label>
          </div>

          {/* Contract Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Seleccionar Contratos
              </label>
              <button
                onClick={handleSelectAll}
                className="text-sm text-primary-600 hover:underline"
              >
                {selectedContracts.length === AVAILABLE_CONTRACTS.length
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
            </div>
            <div className="space-y-2">
              {AVAILABLE_CONTRACTS.map((contract) => (
                <label
                  key={contract.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-[10px] cursor-pointer hover:bg-gray-100 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedContracts.includes(contract.name)}
                    onChange={() => handleToggleContract(contract.name)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-700">{contract.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecuteAction}
            disabled={
              !isValidAddress(targetAddress) ||
              selectedContracts.length === 0 ||
              isProcessing
            }
            className={`w-full py-3 rounded-[10px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'grant'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isProcessing
              ? 'Procesando transacciones...'
              : action === 'grant'
              ? 'Otorgar ADMIN_ROLE'
              : 'Revocar ADMIN_ROLE'}
          </button>
        </div>

        {/* Action Results */}
        {actionResults && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-[15px] p-4">
            <h3 className="font-medium text-gray-700 mb-3">Resultados</h3>
            <div className="space-y-3">
              {actionResults.map((result) => (
                <div
                  key={result.contract}
                  className={`p-3 rounded-[10px] ${
                    result.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{result.contract}</span>
                    <span
                      className={`text-sm ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.success ? (result.skipped ? 'Sin cambios' : 'Exitoso') : 'Error'}
                    </span>
                  </div>
                  {result.txHash && (
                    <a
                      href={`https://polygonscan.com/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline font-mono"
                    >
                      {result.txHash.slice(0, 20)}...{result.txHash.slice(-8)}
                    </a>
                  )}
                  {result.message && (
                    <p className="text-sm text-gray-500">{result.message}</p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-[15px] p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-blue-700 font-medium">Sobre los Roles</h4>
            <ul className="text-blue-600 text-sm mt-1 space-y-1">
              <li>
                <strong>ADMIN_ROLE:</strong> Permite crear propiedades, gestionar el marketplace y
                distribuir dividendos.
              </li>
              <li>
                <strong>DEFAULT_ADMIN_ROLE:</strong> Puede otorgar y revocar cualquier rol.
              </li>
              <li>Las transacciones requieren gas en MATIC.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="mt-6 bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-600">Historial de Transacciones</h3>
          <button
            onClick={loadHistory}
            disabled={isLoadingHistory}
            className="text-sm text-primary-600 hover:underline disabled:opacity-50"
          >
            {isLoadingHistory ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay transacciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Acción</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Contrato</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Wallet</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">TX Hash</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-600">
                      {new Date(tx.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          tx.action === 'GRANT'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.action === 'GRANT' ? 'Otorgado' : 'Revocado'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-800">{tx.contractName}</td>
                    <td className="py-3 px-2 font-mono text-xs text-gray-600">
                      {tx.targetAddress.slice(0, 6)}...{tx.targetAddress.slice(-4)}
                    </td>
                    <td className="py-3 px-2">
                      {tx.txHash.startsWith('failed') ? (
                        <span className="text-gray-400 text-xs">-</span>
                      ) : (
                        <a
                          href={`https://polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tx.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.status === 'SUCCESS' ? 'Exitoso' : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
