'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/lib/web3auth';
import { brandConfig } from '@/config/brand.config';

interface ContractInfo {
  name: string;
  address: string;
  network: string;
  chainId: number;
  description: string;
  explorerUrl: string;
  abi?: string;
}

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137');
const EXPLORER_BASE = CHAIN_ID === 137
  ? 'https://polygonscan.com'
  : 'https://amoy.polygonscan.com';

const CONTRACTS_INFO: ContractInfo[] = [
  {
    name: 'PropertyToken',
    address: process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS || '',
    network: CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy',
    chainId: CHAIN_ID,
    description: 'Contrato ERC-1155 para tokens de fracciones de propiedades. Funciones principales: mint() para crear tokens de nuevas propiedades, safeTransferFrom() para transferir fracciones, balanceOf() para consultar holdings. El admin puede pausar/despausar y configurar URIs de metadata.',
    explorerUrl: `${EXPLORER_BASE}/address/${process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS}`,
  },
  {
    name: 'PropertyMarketplace',
    address: process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS || '',
    network: CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy',
    chainId: CHAIN_ID,
    description: 'Mercado secundario P2P. Funciones: createListing() para listar tokens en venta, buyTokens() para comprar, cancelListing() para cancelar. El admin puede configurar la comisión del marketplace, pausar operaciones y retirar fondos acumulados.',
    explorerUrl: `${EXPLORER_BASE}/address/${process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS}`,
  },
  {
    name: 'RoyaltyDistributor',
    address: process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS || '',
    network: CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy',
    chainId: CHAIN_ID,
    description: 'Distribuye dividendos a holders. Funciones: createDistribution() para crear nueva distribución de rendimientos, claim() para que usuarios reclamen su parte, getClaimableAmount() para consultar montos. El admin deposita fondos y crea distribuciones periódicas.',
    explorerUrl: `${EXPLORER_BASE}/address/${process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS}`,
  },
  {
    name: 'PaymentProcessor',
    address: process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS || '',
    network: CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy',
    chainId: CHAIN_ID,
    description: 'Procesa pagos en stablecoins. Funciones: processPayment() para pagos de compra de tokens, refund() para reembolsos. Soporta USDT y USDC. El admin puede configurar tokens aceptados y la wallet del treasury.',
    explorerUrl: `${EXPLORER_BASE}/address/${process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS}`,
  },
];

const TOKENS_INFO: ContractInfo[] = [
  {
    name: 'USDT',
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS || '',
    network: CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy',
    chainId: CHAIN_ID,
    description: 'Tether USD - Stablecoin principal para pagos',
    explorerUrl: `${EXPLORER_BASE}/token/${process.env.NEXT_PUBLIC_USDT_ADDRESS}`,
  },
  {
    name: 'USDC',
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
    network: CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy',
    chainId: CHAIN_ID,
    description: 'USD Coin - Stablecoin alternativo para pagos',
    explorerUrl: `${EXPLORER_BASE}/token/${process.env.NEXT_PUBLIC_USDC_ADDRESS}`,
  },
];

export default function AdminContractsPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contracts' | 'tokens' | 'config'>('contracts');

  useEffect(() => {
    if (authLoading) return;

    if (!isConnected) {
      router.replace('/login?redirect=/admin/contracts');
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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const openExplorer = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Smart Contracts</h1>
        <p className="text-gray-500">Gestiona y monitorea los contratos inteligentes desplegados</p>
      </div>

      {/* Network Info */}
      <div className="bg-gradient-to-r from-primary-600/10 to-blue-100/50 border border-primary-600/20 rounded-[15px] p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-primary-600 font-semibold text-lg">
                {CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Amoy Testnet'}
              </p>
              <p className="text-gray-500 text-sm">Chain ID: {CHAIN_ID}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/contracts/interact')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[10px] transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Interactuar con Contratos
            </button>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-600 text-sm">Conectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-6 py-3 rounded-[10px] font-medium transition ${
            activeTab === 'contracts'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-600'
          }`}
        >
          Contratos ({CONTRACTS_INFO.filter(c => c.address).length})
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-6 py-3 rounded-[10px] font-medium transition ${
            activeTab === 'tokens'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-600'
          }`}
        >
          Tokens ({TOKENS_INFO.filter(t => t.address).length})
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 rounded-[10px] font-medium transition ${
            activeTab === 'config'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-600'
          }`}
        >
          Configuración
        </button>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="grid gap-4">
          {CONTRACTS_INFO.map((contract) => (
            <div
              key={contract.name}
              className="bg-white border border-gray-200 rounded-[15px] p-6 hover:border-primary-600/30 transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-600/10 rounded-[10px] flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-lg">
                        {contract.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary-600">{contract.name}</h3>
                      <p className="text-gray-500 text-sm">{contract.network}</p>
                    </div>
                    {contract.address ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                        Desplegado
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium">
                        No configurado
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{contract.description}</p>

                  {contract.address && (
                    <div className="flex items-center gap-2 mb-4">
                      <code className="bg-gray-100 px-3 py-2 rounded-[10px] text-sm text-gray-700 font-mono flex-1">
                        {contract.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(contract.address)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-[10px] transition"
                        title="Copiar dirección"
                      >
                        {copiedAddress === contract.address ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => openExplorer(contract.explorerUrl)}
                        className="p-2 bg-primary-600 hover:bg-[#0b3d66] rounded-[10px] transition"
                        title="Ver en PolygonScan"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {contract.address && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openExplorer(contract.explorerUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver en Explorer
                  </button>
                  <button
                    onClick={() => openExplorer(`${contract.explorerUrl}#readContract`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Leer Contrato
                  </button>
                  <button
                    onClick={() => openExplorer(`${contract.explorerUrl}#writeContract`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Escribir Contrato
                  </button>
                  <button
                    onClick={() => openExplorer(`${contract.explorerUrl}#events`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Ver Eventos
                  </button>
                  <button
                    onClick={() => setSelectedContract(contract)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Detalles
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="grid gap-4">
          {TOKENS_INFO.map((token) => (
            <div
              key={token.name}
              className="bg-white border border-gray-200 rounded-[15px] p-6 hover:border-primary-600/30 transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      token.name === 'USDT' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <span className={`font-bold text-sm ${
                        token.name === 'USDT' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {token.name}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary-600">{token.name}</h3>
                      <p className="text-gray-500 text-sm">{token.description}</p>
                    </div>
                  </div>

                  {token.address && (
                    <div className="flex items-center gap-2 mb-4">
                      <code className="bg-gray-100 px-3 py-2 rounded-[10px] text-sm text-gray-700 font-mono flex-1">
                        {token.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(token.address)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-[10px] transition"
                        title="Copiar dirección"
                      >
                        {copiedAddress === token.address ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => openExplorer(token.explorerUrl)}
                        className="p-2 bg-primary-600 hover:bg-[#0b3d66] rounded-[10px] transition"
                        title="Ver en PolygonScan"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {token.address && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openExplorer(token.explorerUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver Token
                  </button>
                  <button
                    onClick={() => openExplorer(`${token.explorerUrl}#balances`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[10px] transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Ver Holders
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary-600 mb-4">Variables de Entorno</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[10px]">
                <span className="text-gray-600 font-mono text-sm">NEXT_PUBLIC_CHAIN_ID</span>
                <span className="text-primary-600 font-mono">{CHAIN_ID}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[10px]">
                <span className="text-gray-600 font-mono text-sm">NEXT_PUBLIC_RPC_URL</span>
                <span className="text-green-600 text-sm">Configurado</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[10px]">
                <span className="text-gray-600 font-mono text-sm">TREASURY_WALLET</span>
                <code className="text-gray-700 font-mono text-sm">
                  {process.env.NEXT_PUBLIC_TREASURY_WALLET
                    ? `${process.env.NEXT_PUBLIC_TREASURY_WALLET.slice(0, 6)}...${process.env.NEXT_PUBLIC_TREASURY_WALLET.slice(-4)}`
                    : 'No configurado'}
                </code>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary-600 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => openExplorer(`${EXPLORER_BASE}/address/${address}`)}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-[10px] transition text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-[10px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-primary-600 font-medium">Ver Mi Wallet</p>
                  <p className="text-gray-500 text-sm">En PolygonScan</p>
                </div>
              </button>
              <button
                onClick={() => openExplorer(EXPLORER_BASE)}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-[10px] transition text-left"
              >
                <div className="w-10 h-10 bg-primary-600/10 rounded-[10px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <p className="text-primary-600 font-medium">Polygon Explorer</p>
                  <p className="text-gray-500 text-sm">{CHAIN_ID === 137 ? 'Mainnet' : 'Amoy Testnet'}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Interact CTA */}
          <div className="bg-primary-600/5 border border-primary-600/20 rounded-[15px] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary-600/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-primary-600 font-medium text-lg">Interactuar con Contratos</h4>
                  <p className="text-primary-600/70 text-sm mt-1">
                    Ejecuta funciones administrativas directamente desde la app usando tu wallet Web3Auth.
                    Mint tokens, pausar contratos, crear distribuciones y más.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/contracts/interact')}
                className="px-6 py-3 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[10px] transition font-medium whitespace-nowrap"
              >
                Ir a Interacción
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-[15px] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-yellow-700 font-medium">Nota sobre Gas</h4>
                <p className="text-yellow-600 text-sm mt-1">
                  Para ejecutar transacciones necesitas MATIC suficiente para gas en tu wallet de administrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-[20px] max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary-600">{selectedContract.name}</h2>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-2 hover:bg-gray-100 rounded-[10px] transition"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-500 text-sm">Descripción</label>
                <p className="text-gray-800 mt-1">{selectedContract.description}</p>
              </div>
              <div>
                <label className="text-gray-500 text-sm">Dirección del Contrato</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded-[10px] text-sm text-gray-700 font-mono flex-1 break-all">
                    {selectedContract.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedContract.address)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-[10px] transition"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-sm">Red</label>
                <p className="text-gray-800 mt-1">{selectedContract.network} (Chain ID: {selectedContract.chainId})</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => openExplorer(selectedContract.explorerUrl)}
                  className="w-full py-3 bg-primary-600 hover:bg-[#0b3d66] text-white rounded-[10px] transition font-medium"
                >
                  Abrir en PolygonScan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
