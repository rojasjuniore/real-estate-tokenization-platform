"use client";

import { ReactNode } from "react";

interface TokenBalanceProps {
  symbol: string;
  balance: string;
  icon?: ReactNode;
}

export function TokenBalance({ symbol, balance, icon }: TokenBalanceProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon && <div className="w-6 h-6 flex items-center justify-center">{icon}</div>}
        <span className="text-sm font-medium text-gray-300">{symbol}</span>
      </div>
      <span className="text-sm font-semibold text-white">{balance}</span>
    </div>
  );
}
