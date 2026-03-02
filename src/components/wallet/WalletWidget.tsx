"use client";

import { useWeb3Auth } from "@/lib/web3auth";
import { useEffect, useState, useRef } from "react";
import { TokenBalance } from "./TokenBalance";

export function WalletWidget() {
  const { isConnected, address, getBalance, logout } = useWeb3Auth();
  const [maticBalance, setMaticBalance] = useState("0");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected) {
        const balance = await getBalance();
        setMaticBalance(balance);
      }
    };

    fetchBalance();
  }, [isConnected, getBalance]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setIsMenuOpen(false);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-[280px]">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full mb-3 pb-3 border-b border-gray-700 hover:bg-gray-700/50 rounded px-2 py-1 transition"
        >
          <div className="text-sm text-gray-400">Wallet</div>
          <div className="text-sm font-medium text-white">{formatAddress(address)}</div>
        </button>

        <div className="space-y-1">
          <TokenBalance symbol="MATIC" balance={maticBalance} />
          <TokenBalance symbol="USDT" balance="0" />
          <TokenBalance symbol="USDC" balance="0" />
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[200px] z-50">
          <button
            onClick={handleCopyAddress}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition"
          >
            Copiar dirección
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition"
          >
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
}
