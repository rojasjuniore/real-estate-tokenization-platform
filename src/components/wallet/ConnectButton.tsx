"use client";

import { useWeb3Auth } from "@/lib/web3auth";

export function ConnectButton() {
  const { isLoading, isConnected, address, login, logout } = useWeb3Auth();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
      >
        Cargando...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={handleDisconnect}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        {formatAddress(address)} - Desconectar
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition font-medium"
    >
      Conectar Wallet
    </button>
  );
}
