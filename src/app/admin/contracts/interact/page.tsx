"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/lib/web3auth/Web3AuthContext";
import { useContractInteraction } from "@/lib/contracts/useContractInteraction";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { CONTRACT_ADDRESSES, PAYMENT_TOKENS } from "@/lib/contracts/abis";

type ContractTab = "propertyToken" | "marketplace" | "royaltyDistributor";

interface TransactionLog {
  id: string;
  action: string;
  status: "pending" | "success" | "error";
  txHash?: string;
  error?: string;
  timestamp: Date;
}

export default function ContractInteractPage() {
  const router = useRouter();
  const { address, isLoading: authLoading, isConnected, login } = useWeb3Auth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const contract = useContractInteraction();

  const [activeTab, setActiveTab] = useState<ContractTab>("propertyToken");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);

  // Contract states
  const [propertyTokenPaused, setPropertyTokenPaused] = useState<boolean | null>(null);
  const [marketplacePaused, setMarketplacePaused] = useState<boolean | null>(null);
  const [royaltyPaused, setRoyaltyPaused] = useState<boolean | null>(null);

  // Form states
  const [mintForm, setMintForm] = useState({ to: "", propertyId: "", amount: "" });
  const [burnForm, setBurnForm] = useState({ from: "", propertyId: "", amount: "" });
  const [roleForm, setRoleForm] = useState({ account: "" });
  const [feeForm, setFeeForm] = useState({ fee: "" });
  const [paymentTokenForm, setPaymentTokenForm] = useState({ token: "" });
  const [distributionForm, setDistributionForm] = useState({
    propertyId: "",
    amount: "",
    paymentToken: PAYMENT_TOKENS.USDT as string,
  });

  // Check admin access
  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!isConnected) return;
    if (!isAdmin) {
      router.push("/admin");
    }
  }, [authLoading, adminLoading, isConnected, isAdmin, router]);

  // Load contract states
  useEffect(() => {
    const loadStates = async () => {
      if (!isConnected) return;

      try {
        const [ptPaused, mpPaused, rdPaused] = await Promise.all([
          contract.isPropertyTokenPaused(),
          contract.isMarketplacePaused(),
          contract.isRoyaltyDistributorPaused(),
        ]);
        setPropertyTokenPaused(ptPaused);
        setMarketplacePaused(mpPaused);
        setRoyaltyPaused(rdPaused);
      } catch (error) {
        console.error("Error loading contract states:", error);
      }
    };

    loadStates();
  }, [isConnected, contract]);

  const addLog = (action: string, status: "pending" | "success" | "error", txHash?: string, error?: string) => {
    const log: TransactionLog = {
      id: Date.now().toString(),
      action,
      status,
      txHash,
      error,
      timestamp: new Date(),
    };
    setTransactionLogs((prev) => [log, ...prev].slice(0, 10));
  };

  const handleTransaction = async (
    action: string,
    transactionFn: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  ) => {
    setIsProcessing(true);
    addLog(action, "pending");

    try {
      const result = await transactionFn();

      if (result.success) {
        addLog(action, "success", result.txHash);
      } else {
        addLog(action, "error", undefined, result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      addLog(action, "error", undefined, errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  // Render loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Render connect prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conectar Wallet</h2>
          <p className="text-gray-600 mb-6">
            Conecta tu wallet de administrador para interactuar con los contratos.
          </p>
          <button
            onClick={login}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Conectar con Web3Auth
          </button>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!address || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos de administrador.</p>
        </div>
      </div>
    );
  }

  const EXPLORER_URL = "https://polygonscan.com";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/admin/contracts")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Interactuar con Contratos
            </h1>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-blue-800">
                Conectado como: <span className="font-mono">{address}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {[
                    { id: "propertyToken", label: "PropertyToken", address: CONTRACT_ADDRESSES.propertyToken },
                    { id: "marketplace", label: "Marketplace", address: CONTRACT_ADDRESSES.marketplace },
                    { id: "royaltyDistributor", label: "RoyaltyDistributor", address: CONTRACT_ADDRESSES.royaltyDistributor },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ContractTab)}
                      className={`flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm transition ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* PropertyToken Tab */}
                {activeTab === "propertyToken" && (
                  <div className="space-y-8">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-600">Estado del contrato:</span>
                        <span className={`ml-2 font-medium ${propertyTokenPaused ? "text-red-600" : "text-green-600"}`}>
                          {propertyTokenPaused === null ? "Cargando..." : propertyTokenPaused ? "PAUSADO" : "ACTIVO"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTransaction("Pausar PropertyToken", contract.pausePropertyToken)}
                          disabled={isProcessing || propertyTokenPaused === true}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => handleTransaction("Reanudar PropertyToken", contract.unpausePropertyToken)}
                          disabled={isProcessing || propertyTokenPaused === false}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reanudar
                        </button>
                      </div>
                    </div>

                    {/* Mint Tokens */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Mint Tokens</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Crea nuevos tokens de propiedad para una dirección específica.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Dirección (0x...)"
                          value={mintForm.to}
                          onChange={(e) => setMintForm({ ...mintForm, to: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Property ID"
                          value={mintForm.propertyId}
                          onChange={(e) => setMintForm({ ...mintForm, propertyId: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={mintForm.amount}
                          onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() =>
                          handleTransaction(
                            `Mint ${mintForm.amount} tokens para ${mintForm.to}`,
                            () => contract.mintTokens(mintForm.to, parseInt(mintForm.propertyId), parseInt(mintForm.amount))
                          )
                        }
                        disabled={isProcessing || !mintForm.to || !mintForm.propertyId || !mintForm.amount}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ejecutar Mint
                      </button>
                    </div>

                    {/* Burn Tokens */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Burn Tokens</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Destruye tokens existentes de una dirección.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Dirección (0x...)"
                          value={burnForm.from}
                          onChange={(e) => setBurnForm({ ...burnForm, from: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Property ID"
                          value={burnForm.propertyId}
                          onChange={(e) => setBurnForm({ ...burnForm, propertyId: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={burnForm.amount}
                          onChange={(e) => setBurnForm({ ...burnForm, amount: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() =>
                          handleTransaction(
                            `Burn ${burnForm.amount} tokens de ${burnForm.from}`,
                            () => contract.burnTokens(burnForm.from, parseInt(burnForm.propertyId), parseInt(burnForm.amount))
                          )
                        }
                        disabled={isProcessing || !burnForm.from || !burnForm.propertyId || !burnForm.amount}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ejecutar Burn
                      </button>
                    </div>

                    {/* Role Management */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Gestión de Roles (MINTER_ROLE)</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Otorga o revoca permisos de minteo a direcciones.
                      </p>
                      <div className="flex gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Dirección (0x...)"
                          value={roleForm.account}
                          onChange={(e) => setRoleForm({ account: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleTransaction(
                              `Otorgar MINTER_ROLE a ${roleForm.account}`,
                              () => contract.grantMinterRole(roleForm.account)
                            )
                          }
                          disabled={isProcessing || !roleForm.account}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Otorgar Rol
                        </button>
                        <button
                          onClick={() =>
                            handleTransaction(
                              `Revocar MINTER_ROLE de ${roleForm.account}`,
                              () => contract.revokeMinterRole(roleForm.account)
                            )
                          }
                          disabled={isProcessing || !roleForm.account}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Revocar Rol
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Marketplace Tab */}
                {activeTab === "marketplace" && (
                  <div className="space-y-8">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-600">Estado del contrato:</span>
                        <span className={`ml-2 font-medium ${marketplacePaused ? "text-red-600" : "text-green-600"}`}>
                          {marketplacePaused === null ? "Cargando..." : marketplacePaused ? "PAUSADO" : "ACTIVO"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTransaction("Pausar Marketplace", contract.pauseMarketplace)}
                          disabled={isProcessing || marketplacePaused === true}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => handleTransaction("Reanudar Marketplace", contract.unpauseMarketplace)}
                          disabled={isProcessing || marketplacePaused === false}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reanudar
                        </button>
                      </div>
                    </div>

                    {/* Set Fee */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Configurar Comisión</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Establece la comisión del marketplace (en porcentaje, ej: 2.5 = 2.5%).
                      </p>
                      <div className="flex gap-4 mb-4">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Comisión (%)"
                          value={feeForm.fee}
                          onChange={(e) => setFeeForm({ fee: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() =>
                          handleTransaction(
                            `Establecer comisión a ${feeForm.fee}%`,
                            () => contract.setMarketplaceFee(parseFloat(feeForm.fee))
                          )
                        }
                        disabled={isProcessing || !feeForm.fee}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Actualizar Comisión
                      </button>
                    </div>

                    {/* Add Payment Token */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Agregar Token de Pago</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Añade un nuevo token ERC-20 como método de pago aceptado.
                      </p>
                      <div className="flex gap-4 mb-4">
                        <select
                          value={paymentTokenForm.token}
                          onChange={(e) => setPaymentTokenForm({ token: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Seleccionar token...</option>
                          <option value={PAYMENT_TOKENS.USDT}>USDT ({PAYMENT_TOKENS.USDT.slice(0, 10)}...)</option>
                          <option value={PAYMENT_TOKENS.USDC}>USDC ({PAYMENT_TOKENS.USDC.slice(0, 10)}...)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="O ingresa dirección..."
                          onChange={(e) => setPaymentTokenForm({ token: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        onClick={() =>
                          handleTransaction(
                            `Agregar token de pago ${paymentTokenForm.token}`,
                            () => contract.addPaymentTokenToMarketplace(paymentTokenForm.token)
                          )
                        }
                        disabled={isProcessing || !paymentTokenForm.token}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Agregar Token
                      </button>
                    </div>
                  </div>
                )}

                {/* RoyaltyDistributor Tab */}
                {activeTab === "royaltyDistributor" && (
                  <div className="space-y-8">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-600">Estado del contrato:</span>
                        <span className={`ml-2 font-medium ${royaltyPaused ? "text-red-600" : "text-green-600"}`}>
                          {royaltyPaused === null ? "Cargando..." : royaltyPaused ? "PAUSADO" : "ACTIVO"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTransaction("Pausar RoyaltyDistributor", contract.pauseRoyaltyDistributor)}
                          disabled={isProcessing || royaltyPaused === true}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => handleTransaction("Reanudar RoyaltyDistributor", contract.unpauseRoyaltyDistributor)}
                          disabled={isProcessing || royaltyPaused === false}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reanudar
                        </button>
                      </div>
                    </div>

                    {/* Create Distribution */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Crear Distribución de Dividendos</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Crea una nueva distribución de dividendos para los holders de una propiedad.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                          type="number"
                          placeholder="Property ID"
                          value={distributionForm.propertyId}
                          onChange={(e) => setDistributionForm({ ...distributionForm, propertyId: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Monto total (USDT)"
                          value={distributionForm.amount}
                          onChange={(e) => setDistributionForm({ ...distributionForm, amount: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <select
                          value={distributionForm.paymentToken}
                          onChange={(e) => setDistributionForm({ ...distributionForm, paymentToken: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value={PAYMENT_TOKENS.USDT}>USDT</option>
                          <option value={PAYMENT_TOKENS.USDC}>USDC</option>
                        </select>
                      </div>
                      <button
                        onClick={() =>
                          handleTransaction(
                            `Crear distribución de ${distributionForm.amount} para propiedad ${distributionForm.propertyId}`,
                            () =>
                              contract.createDistribution(
                                parseInt(distributionForm.propertyId),
                                BigInt(parseFloat(distributionForm.amount) * 1e6), // USDT has 6 decimals
                                distributionForm.paymentToken
                              )
                          )
                        }
                        disabled={isProcessing || !distributionForm.propertyId || !distributionForm.amount}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Crear Distribución
                      </button>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> Antes de crear una distribución, asegúrate de que el contrato tenga
                        suficiente balance del token de pago. Puedes transferir tokens al contrato desde tu wallet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Transaction Logs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Registro de Transacciones
              </h2>

              {transactionLogs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Las transacciones aparecerán aquí.
                </p>
              ) : (
                <div className="space-y-3">
                  {transactionLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${
                        log.status === "success"
                          ? "bg-green-50 border-green-200"
                          : log.status === "error"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {log.status === "pending" && (
                          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
                        )}
                        {log.status === "success" && (
                          <span className="text-green-600">✓</span>
                        )}
                        {log.status === "error" && (
                          <span className="text-red-600">✗</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {log.action}
                      </p>
                      {log.txHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${log.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver en PolygonScan →
                        </a>
                      )}
                      {log.error && (
                        <p className="text-xs text-red-600 mt-1">{log.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Contract Addresses Quick Reference */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Direcciones de Contratos
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { name: "PropertyToken", address: CONTRACT_ADDRESSES.propertyToken },
                    { name: "Marketplace", address: CONTRACT_ADDRESSES.marketplace },
                    { name: "RoyaltyDistributor", address: CONTRACT_ADDRESSES.royaltyDistributor },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <span className="text-gray-600">{c.name}:</span>
                      {c.address ? (
                        <a
                          href={`${EXPLORER_URL}/address/${c.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:underline"
                        >
                          {c.address.slice(0, 6)}...{c.address.slice(-4)}
                        </a>
                      ) : (
                        <span className="text-gray-400">No configurado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
