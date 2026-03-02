"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/lib/web3auth";
import { useState } from "react";
import { brandConfig } from "@/config/brand.config";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Header() {
  const { isConnected, isLoading, address, userInfo, login, logout } = useWeb3Auth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const isAdmin = address && process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES?.split(',')
    .map(addr => addr.trim().toLowerCase())
    .includes(address.toLowerCase());

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleLogin = async () => {
    const success = await login();
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BrandLogo variant="icon-only" width={32} height={32} />
            <span className="text-xl font-bold text-white">{brandConfig.identity.companyName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/properties" className="text-gray-300 hover:text-white transition">
              Propiedades
            </Link>
            <Link href="/marketplace" className="text-gray-300 hover:text-white transition">
              Marketplace
            </Link>
            {isConnected && (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                  Dashboard
                </Link>
                <Link href="/portfolio" className="text-gray-300 hover:text-white transition">
                  Portfolio
                </Link>
                <Link href="/dividends" className="text-gray-300 hover:text-white transition">
                  Dividendos
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-purple-400 hover:text-purple-300 transition font-medium">
                    Admin
                  </Link>
                )}
                {brandConfig.features.enableFaucet && (
                  <Link href="/faucet" className="text-green-400 hover:text-green-300 transition font-medium">
                    Faucet
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="px-4 py-2 bg-gray-800 rounded-lg animate-pulse">
                <div className="h-5 w-24 bg-gray-700 rounded" />
              </div>
            ) : isConnected ? (
              <div className="flex items-center space-x-3">
                {userInfo?.profileImage && (
                  <img
                    src={userInfo.profileImage}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="hidden sm:block text-right">
                  {userInfo?.name && (
                    <p className="text-sm text-white">{userInfo.name}</p>
                  )}
                  <p className="text-xs text-gray-400">{formatAddress(address!)}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition font-medium"
              >
                Conectar Wallet
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-3">
              <Link href="/properties" className="text-gray-300 hover:text-white transition px-2 py-1">
                Propiedades
              </Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition px-2 py-1">
                Marketplace
              </Link>
              {isConnected && (
                <>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition px-2 py-1">
                    Dashboard
                  </Link>
                  <Link href="/portfolio" className="text-gray-300 hover:text-white transition px-2 py-1">
                    Portfolio
                  </Link>
                  <Link href="/dividends" className="text-gray-300 hover:text-white transition px-2 py-1">
                    Dividendos
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-purple-400 hover:text-purple-300 transition px-2 py-1 font-medium">
                      Admin
                    </Link>
                  )}
                  <Link href="/faucet" className="text-green-400 hover:text-green-300 transition px-2 py-1 font-medium">
                    Faucet
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
