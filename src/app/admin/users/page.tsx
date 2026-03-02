'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3Auth } from '@/lib/web3auth';

interface User {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
  kycStatus: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isConnected, address, isLoading: authLoading } = useWeb3Auth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

    async function loadUsers() {
      try {
        const response = await fetch('/api/users', {
          headers: { 'x-wallet-address': address || '' },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Error loading users');
        }

        setUsers(data.data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [isAdmin, address]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.walletAddress.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.kycStatus === 'APPROVED').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    return { total, verified, admins };
  }, [users]);

  const getKycBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      APPROVED: 'bg-green-100 text-green-700 border border-green-300',
      REJECTED: 'bg-red-100 text-red-700 border border-red-300',
      NOT_SUBMITTED: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-primary-600/10 text-primary-600 border border-primary-600/30',
      USER: 'bg-gray-100 text-gray-600',
    };
    return colors[role] || 'bg-gray-100 text-gray-600';
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
        <h1 className="text-3xl font-bold text-primary-600 mb-2">Usuarios</h1>
        <p className="text-gray-500">Gestiona los usuarios de la plataforma</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[15px] p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Total Usuarios</p>
          <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Verificados (KYC)</p>
          <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-[15px] p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Administradores</p>
          <p className="text-3xl font-bold text-primary-600">{stats.admins}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, email o wallet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-3 bg-white border border-gray-200 rounded-[15px] text-gray-800 placeholder-gray-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-[15px] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary-600 mb-2">No hay usuarios</h3>
          <p className="text-gray-500">
            {searchQuery ? 'No se encontraron usuarios con esos criterios' : 'Aún no hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Wallet</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">KYC</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Registro</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-primary-600 font-medium">{user.name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{user.email || 'Sin email'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 font-mono text-sm">
                      {truncateAddress(user.walletAddress)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getKycBadge(user.kycStatus)}`}>
                      {user.kycStatus || 'NOT_SUBMITTED'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.walletAddress}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-[10px] transition"
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
