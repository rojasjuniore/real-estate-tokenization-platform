'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWeb3Auth } from '@/lib/web3auth';
import { motion, AnimatePresence } from 'framer-motion';
import { brandConfig } from '@/config/brand.config';

type AdminTab = 'dashboard' | 'properties' | 'dividends' | 'users' | 'kyc' | 'marketplace' | 'contracts' | 'settings';

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'properties', label: 'Propiedades', icon: '🏢' },
  { id: 'dividends', label: 'Distribuciones', icon: '💰' },
  { id: 'users', label: 'Usuarios', icon: '👥' },
  { id: 'kyc', label: 'KYC', icon: '🔐' },
  { id: 'marketplace', label: 'Marketplace', icon: '🏪' },
  { id: 'contracts', label: 'Contratos', icon: '📜' },
  { id: 'settings', label: 'Configuración', icon: '⚙️' },
];

export function AdminSection() {
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [error, setError] = useState<string | null>(null);

  // Check admin status
  useEffect(() => {
    if (authLoading) return;

    if (!isConnected || !address) {
      setIsCheckingAdmin(false);
      setIsAdmin(false);
      return;
    }

    async function checkAdmin() {
      try {
        const response = await fetch('/api/admin/check', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();
        setIsAdmin(data.success && data.data?.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    checkAdmin();
  }, [isConnected, address, authLoading]);

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto mb-4" />
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">Conecta tu wallet para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Sin Autorización</h2>
          <p className="text-gray-500">Tu wallet no tiene permisos de administrador.</p>
          <p className="text-xs text-gray-400 mt-4 font-mono">{address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Panel de Administración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona la plataforma {brandConfig.identity.appName}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#1e3a5f]'
                  : 'text-gray-500 hover:text-[#1e3a5f]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="adminTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e3a5f]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <DashboardContent address={address} setError={setError} />}
            {activeTab === 'properties' && <PropertiesContent address={address} setError={setError} />}
            {activeTab === 'dividends' && <DividendsContent address={address} setError={setError} />}
            {activeTab === 'users' && <UsersContent address={address} setError={setError} />}
            {activeTab === 'kyc' && <KYCContent address={address} setError={setError} />}
            {activeTab === 'marketplace' && <MarketplaceContent address={address} setError={setError} />}
            {activeTab === 'contracts' && <ContractsContent address={address} setError={setError} />}
            {activeTab === 'settings' && <SettingsContent address={address} setError={setError} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Dashboard Content
function DashboardContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalProperties: number;
    pendingKyc: number;
    totalInvested: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/admin/dashboard', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        setError('Error cargando estadísticas');
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [address, setError]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Usuarios" value={stats?.totalUsers || 0} icon="👥" color="blue" />
        <StatCard label="Propiedades" value={stats?.totalProperties || 0} icon="🏢" color="green" />
        <StatCard label="KYC Pendientes" value={stats?.pendingKyc || 0} icon="🔐" color="yellow" />
        <StatCard label="Total Invertido" value={`$${stats?.totalInvested || '0'}`} icon="💰" color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#1e3a5f] mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton label="Nueva Propiedad" icon="🏢" />
          <QuickActionButton label="Distribuir Dividendos" icon="💰" />
          <QuickActionButton label="Revisar KYC" icon="🔐" />
          <QuickActionButton label="Ver Contratos" icon="📜" />
        </div>
      </div>
    </div>
  );
}

// Properties Content
function PropertiesContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const [properties, setProperties] = useState<Array<{
    id: string;
    name: string;
    status: string;
    totalFractions: number;
    availableFractions: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const response = await fetch('/api/properties');
        const data = await response.json();
        if (data.success) {
          setProperties(data.data?.properties || data.data || []);
        }
      } catch (err) {
        setError('Error cargando propiedades');
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
  }, [setError]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#1e3a5f]">Propiedades</h2>
        <button className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f] transition">
          + Nueva Propiedad
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Nombre</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Fracciones</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No hay propiedades registradas
                </td>
              </tr>
            ) : (
              properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-[#1e3a5f] font-medium">{prop.name}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={prop.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {prop.availableFractions} / {prop.totalFractions}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[#1e3a5f] hover:underline">Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Dividends Content
function DividendsContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const [dividends, setDividends] = useState<Array<{
    id: string;
    property: { name: string };
    totalAmount: number;
    status: string;
    period: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDividends() {
      try {
        const response = await fetch('/api/admin/dividends', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();
        if (data.success) {
          setDividends(data.data || []);
        }
      } catch (err) {
        setError('Error cargando distribuciones');
      } finally {
        setIsLoading(false);
      }
    }
    loadDividends();
  }, [address, setError]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#1e3a5f]">Distribuciones</h2>
        <button className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f] transition">
          + Nueva Distribución
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {dividends.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">💰</div>
            <p>No hay distribuciones registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Propiedad</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Período</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dividends.map((div) => (
                <tr key={div.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-[#1e3a5f] font-medium">{div.property?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{div.period}</td>
                  <td className="px-6 py-4 text-gray-600">${div.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4"><StatusBadge status={div.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Users Content
function UsersContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    kycStatus: string;
    role: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch('/api/users', {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (err) {
        setError('Error cargando usuarios');
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, [address, setError]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.walletAddress?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#1e3a5f]">Usuarios</h2>
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Usuario</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Wallet</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">KYC</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No hay usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[#1e3a5f] font-medium">{user.name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{user.email || 'Sin email'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={user.kycStatus} /></td>
                  <td className="px-6 py-4"><StatusBadge status={user.role} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// KYC Content
function KYCContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const [submissions, setSubmissions] = useState<Array<{
    id: string;
    user: { name: string; email: string };
    documentType: string;
    status: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  useEffect(() => {
    async function loadKYC() {
      try {
        const response = await fetch(`/api/admin/kyc?status=${statusFilter}`, {
          headers: { 'x-wallet-address': address || '' },
        });
        const data = await response.json();
        if (data.success) {
          setSubmissions(data.data || []);
        }
      } catch (err) {
        setError('Error cargando KYC');
      } finally {
        setIsLoading(false);
      }
    }
    loadKYC();
  }, [address, statusFilter, setError]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1e3a5f]">Verificación KYC</h2>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === status
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'PENDING' ? 'Pendientes' : status === 'APPROVED' ? 'Aprobados' : 'Rechazados'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">🔐</div>
            <p>No hay solicitudes {statusFilter.toLowerCase()}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Documento</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[#1e3a5f] font-medium">{sub.user?.name}</p>
                      <p className="text-sm text-gray-500">{sub.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sub.documentType}</td>
                  <td className="px-6 py-4"><StatusBadge status={sub.status} /></td>
                  <td className="px-6 py-4">
                    {sub.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                          Aprobar
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                          Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Marketplace Content
function MarketplaceContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1e3a5f]">Control del Marketplace</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
        <div className="text-4xl mb-4">🏪</div>
        <p>Gestión del marketplace próximamente</p>
      </div>
    </div>
  );
}

// Contracts Content
function ContractsContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const contracts = [
    { name: 'PropertyToken', address: '0xC8a72f1ACDE55c7192e7c5F0b7FF48fce18d7D30', status: 'active' },
    { name: 'RoyaltyDistributor', address: '0xD4a82f2BCEF66c8293e8d6F1c8FF49gce29e8E41', status: 'active' },
    { name: 'PropertyMarketplace', address: '0xE5b93g3CDFG77d9394f9e7G2d9GG50hdf3af9F52', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1e3a5f]">Smart Contracts</h2>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <div key={contract.name} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-[#1e3a5f]">{contract.name}</h3>
                <p className="text-sm font-mono text-gray-500 mt-1">{contract.address}</p>
              </div>
              <div className="flex items-center space-x-3">
                <StatusBadge status={contract.status === 'active' ? 'ACTIVE' : 'PAUSED'} />
                <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  {contract.status === 'active' ? 'Pausar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settings Content
function SettingsContent({ address, setError }: { address: string | null; setError: (e: string | null) => void }) {
  const [settings, setSettings] = useState({
    platformName: brandConfig.identity.appName,
    platformFee: 2.5,
    minInvestment: 100,
    kycRequired: true,
    maintenanceMode: false,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1e3a5f]">Configuración</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Plataforma</label>
          <input
            type="text"
            value={settings.platformName}
            onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comisión de la Plataforma (%)</label>
          <input
            type="number"
            value={settings.platformFee}
            onChange={(e) => setSettings({ ...settings, platformFee: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <p className="font-medium text-gray-700">KYC Requerido</p>
            <p className="text-sm text-gray-500">Requiere verificación para invertir</p>
          </div>
          <ToggleSwitch checked={settings.kycRequired} onChange={(v) => setSettings({ ...settings, kycRequired: v })} />
        </div>

        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <p className="font-medium text-gray-700">Modo Mantenimiento</p>
            <p className="text-sm text-gray-500">Desactiva todas las operaciones</p>
          </div>
          <ToggleSwitch checked={settings.maintenanceMode} onChange={(v) => setSettings({ ...settings, maintenanceMode: v })} />
        </div>

        <button className="w-full px-4 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f] transition font-medium">
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

// Helper Components
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-[#1e3a5f] mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition">
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo' },
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobado' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' },
    PAUSED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pausado' },
    ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
    USER: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Usuario' },
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Borrador' },
    SOLD_OUT: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Agotado' },
  };

  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}
      />
    </button>
  );
}
