"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Web3Auth, WEB3AUTH_NETWORK, WALLET_CONNECTORS } from "@web3auth/modal";
import { WEB3AUTH_CLIENT_ID, USDT_CONTRACT_ADDRESS, ROYALTY_DISTRIBUTOR_ADDRESS, PROPERTY_MARKETPLACE_ADDRESS, PROPERTY_TOKEN_ADDRESS } from "./config";
import { brandConfig } from "@/config/brand.config";

// Payment token addresses on Polygon
const PAYMENT_TOKENS: Record<string, { address: string; decimals: number }> = {
  USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
  USDC: { address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", decimals: 6 },
  MATIC: { address: "0x0000000000000000000000000000000000000000", decimals: 18 },
};

// Treasury wallet to receive payments
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";

interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  verifier?: string;
  verifierId?: string;
}

interface Balances {
  matic: string;
  usdt: string;
}

interface PurchaseParams {
  paymentToken: string; // USDT, USDC, MATIC
  amount: number; // Amount in USD
}

interface PurchaseResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface LoginResult {
  success: boolean;
  provider?: unknown;
  address?: string;
}

interface CreateDistributionParams {
  propertyTokenId: number;
  amount: number;
  paymentToken: string; // USDT, USDC
}

interface DistributionResult {
  success: boolean;
  txHash?: string;
  distributionId?: number;
  error?: string;
}

interface DistributionInfo {
  propertyId: number;
  totalAmount: string;
  paymentToken: string;
  totalSupplySnapshot: string;
  createdAt: number;
}

interface ClaimableInfo {
  distributionId: number;
  amount: string;
  hasClaimed: boolean;
}

interface MarketplaceBuyParams {
  listingId: number;
  amount: number; // Number of tokens to buy
  paymentToken: string; // USDT, USDC, MATIC
  pricePerToken: number; // Price per token in payment token units
}

interface MarketplaceBuyResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface CreateListingParams {
  propertyId: number;
  amount: number; // Number of tokens to list
  pricePerToken: number; // Price per token in USD (will convert to smallest unit)
  paymentToken: string; // USDT, USDC, MATIC
}

interface CreateListingResult {
  success: boolean;
  txHash?: string;
  approvalTxHash?: string;
  listingId?: number;
  error?: string;
}

interface CancelListingResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface BuyDirectParams {
  propertyId: number; // The token ID on-chain
  amount: number; // Number of tokens to buy
  paymentToken: string; // USDT, USDC
}

interface BuyDirectResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: unknown;
  isLoading: boolean;
  isConnected: boolean;
  address: string | null;
  userInfo: UserInfo | null;
  login: () => Promise<LoginResult>;
  logout: () => Promise<void>;
  getBalance: () => Promise<string>;
  getBalances: () => Promise<Balances>;
  claimRoyalty: (distributionId: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  purchaseTokens: (params: PurchaseParams, overrideProvider?: unknown, overrideAddress?: string) => Promise<PurchaseResult>;
  approveTokensForDistributor: (paymentToken: string, amount: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  createDistribution: (params: CreateDistributionParams) => Promise<DistributionResult>;
  getDistributionInfo: (distributionId: number) => Promise<DistributionInfo | null>;
  getClaimableAmount: (distributionId: number, userAddress?: string) => Promise<ClaimableInfo | null>;
  buyFromMarketplace: (params: MarketplaceBuyParams, overrideProvider?: unknown, overrideAddress?: string) => Promise<MarketplaceBuyResult>;
  buyDirect: (params: BuyDirectParams, overrideProvider?: unknown, overrideAddress?: string) => Promise<BuyDirectResult>;
  approveMarketplace: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  isMarketplaceApproved: () => Promise<boolean>;
  createMarketplaceListing: (params: CreateListingParams) => Promise<CreateListingResult>;
  cancelMarketplaceListing: (listingId: number) => Promise<CancelListingResult>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  isLoading: true,
  isConnected: false,
  address: null,
  userInfo: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  getBalance: async () => "0",
  getBalances: async () => ({ matic: "0", usdt: "0" }),
  claimRoyalty: async () => ({ success: false, error: "Not initialized" }),
  purchaseTokens: async () => ({ success: false, error: "Not initialized" }),
  approveTokensForDistributor: async () => ({ success: false, error: "Not initialized" }),
  createDistribution: async () => ({ success: false, error: "Not initialized" }),
  getDistributionInfo: async () => null,
  getClaimableAmount: async () => null,
  buyFromMarketplace: async () => ({ success: false, error: "Not initialized" }),
  buyDirect: async () => ({ success: false, error: "Not initialized" }),
  approveMarketplace: async () => ({ success: false, error: "Not initialized" }),
  isMarketplaceApproved: async () => false,
  createMarketplaceListing: async () => ({ success: false, error: "Not initialized" }),
  cancelMarketplaceListing: async () => ({ success: false, error: "Not initialized" }),
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

interface Web3AuthProviderProps {
  children: ReactNode;
}

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("=== Web3Auth Init Starting ===");
        console.log("Client ID:", WEB3AUTH_CLIENT_ID ? "SET" : "NOT SET");

        if (!WEB3AUTH_CLIENT_ID) {
          console.warn("Web3Auth client ID not configured");
          setIsLoading(false);
          return;
        }

        // Web3Auth Modal v10 configuration
        const web3authInstance = new Web3Auth({
          clientId: WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          // Session persistence: 7 days (in seconds)
          sessionTime: 86400 * 7,
          uiConfig: {
            appName: brandConfig.identity.appName,
            theme: {
              primary: brandConfig.colors.primary[600],
            },
            mode: "light",
            defaultLanguage: "es",
          },
          modalConfig: {
            connectors: {
              [WALLET_CONNECTORS.AUTH]: {
                label: "auth",
                loginMethods: {
                  google: {
                    name: "Google",
                    showOnModal: true,
                  },
                  apple: {
                    name: "Apple",
                    showOnModal: true,
                  },
                  facebook: {
                    name: "Facebook",
                    showOnModal: true,
                  },
                  email_passwordless: {
                    name: "Email",
                    showOnModal: true,
                  },
                },
                showOnModal: true,
              },
            },
          },
        });

        console.log("Web3Auth instance created, calling init...");
        await web3authInstance.init();
        console.log("=== Web3Auth init SUCCESS ===");
        console.log("web3auth.connected:", web3authInstance.connected);
        console.log("web3auth.status:", web3authInstance.status);
        console.log("web3auth.provider:", web3authInstance.provider ? "EXISTS" : "NULL");

        setWeb3auth(web3authInstance);

        // Restore session if connected
        if (web3authInstance.connected && web3authInstance.provider) {
          console.log("Session restored! Fetching account details...");
          setProvider(web3authInstance.provider);
          await fetchAccountDetails(web3authInstance);
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("=== Web3Auth init ERROR ===", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const fetchAccountDetails = async (web3authInstance: Web3Auth) => {
    if (!web3authInstance.provider) return;

    try {
      // Get user info
      const user = await web3authInstance.getUserInfo();
      setUserInfo(user as UserInfo);

      // Get address using the provider
      const accounts = (await (web3authInstance.provider as { request: (args: { method: string }) => Promise<string[]> }).request({
        method: "eth_accounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);

        // Register or update user in database
        try {
          await fetch(`/api/users/${userAddress}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user?.email,
              name: user?.name,
            }),
          });
        } catch (err) {
          console.warn("Could not register user:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching account details:", error);
    }
  };

  const login = useCallback(async (): Promise<{ success: boolean; provider?: unknown; address?: string }> => {
    console.log("=== Login called ===");
    console.log("web3auth instance:", web3auth ? "EXISTS" : "NULL");

    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return { success: false };
    }

    try {
      setIsLoading(true);
      console.log("Calling web3auth.connect()...");
      const web3authProvider = await web3auth.connect();
      console.log("web3auth.connect() returned:", web3authProvider ? "PROVIDER" : "NULL");

      if (web3authProvider) {
        setProvider(web3authProvider);

        // Get address directly to return it
        const accounts = (await (web3authProvider as { request: (args: { method: string }) => Promise<string[]> }).request({
          method: "eth_accounts",
        })) as string[];

        const userAddress = accounts?.[0] || null;
        if (userAddress) {
          setAddress(userAddress);
        }

        // Fetch full account details (async, don't wait)
        fetchAccountDetails(web3auth);

        console.log("=== Login SUCCESS ===");
        return { success: true, provider: web3authProvider, address: userAddress || undefined };
      }
      return { success: false };
    } catch (error) {
      console.error("=== Login ERROR ===", error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [web3auth]);

  const logout = useCallback(async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }

    try {
      setIsLoading(true);
      await web3auth.logout();
      setProvider(null);
      setAddress(null);
      setUserInfo(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [web3auth]);

  const getBalance = useCallback(async (): Promise<string> => {
    if (!provider || !address) return "0";

    try {
      const balance = await (provider as { request: (args: { method: string; params: string[] }) => Promise<string | null> }).request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      if (balance) {
        // Convert from wei to MATIC
        const balanceInMatic = parseInt(balance, 16) / 1e18;
        return balanceInMatic.toFixed(4);
      }
    } catch (error) {
      console.error("Error getting balance:", error);
    }

    return "0";
  }, [provider, address]);

  const getBalances = useCallback(async (): Promise<Balances> => {
    if (!provider || !address) return { matic: "0", usdt: "0" };

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // Get MATIC balance
      const maticBalance = await typedProvider.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      // Get USDT balance using eth_call
      // balanceOf(address) function signature: 0x70a08231
      const balanceOfData = "0x70a08231000000000000000000000000" + address.slice(2);

      const usdtBalanceHex = await typedProvider.request({
        method: "eth_call",
        params: [
          {
            to: USDT_CONTRACT_ADDRESS,
            data: balanceOfData,
          },
          "latest",
        ],
      });

      // Parse balances
      const maticValue = maticBalance ? parseInt(maticBalance, 16) / 1e18 : 0;
      // USDT on Polygon has 6 decimals
      const usdtValue = usdtBalanceHex ? parseInt(usdtBalanceHex, 16) / 1e6 : 0;

      return {
        matic: maticValue.toFixed(4),
        usdt: usdtValue.toFixed(2),
      };
    } catch (error) {
      console.error("Error getting balances:", error);
      return { matic: "0", usdt: "0" };
    }
  }, [provider, address]);

  const claimRoyalty = useCallback(async (distributionId: number): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!provider || !address) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!ROYALTY_DISTRIBUTOR_ADDRESS) {
      return { success: false, error: "RoyaltyDistributor contract address not configured" };
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // Encode claim(uint256 distributionId) function call
      // Function selector: claim(uint256) = 0x379607f5
      const distributionIdHex = distributionId.toString(16).padStart(64, "0");
      const data = "0x379607f5" + distributionIdHex;

      // Send transaction
      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: ROYALTY_DISTRIBUTOR_ADDRESS,
          data: data,
          // Let the wallet estimate gas
        }],
      });

      if (txHash) {
        console.log("Claim transaction sent:", txHash);
        return { success: true, txHash };
      }

      return { success: false, error: "Transaction failed" };
    } catch (error) {
      console.error("Error claiming royalty:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  const purchaseTokens = useCallback(async (
    { paymentToken, amount }: PurchaseParams,
    overrideProvider?: unknown,
    overrideAddress?: string
  ): Promise<PurchaseResult> => {
    // Use override values if provided (for fresh login scenarios)
    const activeProvider = overrideProvider || provider;
    const activeAddress = overrideAddress || address;

    if (!activeProvider || !activeAddress) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!TREASURY_ADDRESS) {
      return { success: false, error: "Treasury address not configured" };
    }

    const tokenConfig = PAYMENT_TOKENS[paymentToken.toUpperCase()];
    if (!tokenConfig) {
      return { success: false, error: `Invalid payment token: ${paymentToken}` };
    }

    try {
      const typedProvider = activeProvider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      let txHash: string | null = null;

      if (paymentToken.toUpperCase() === "MATIC") {
        // Native MATIC transfer
        const amountInWei = BigInt(Math.floor(amount * 10 ** 18)).toString(16);

        txHash = await typedProvider.request({
          method: "eth_sendTransaction",
          params: [{
            from: activeAddress,
            to: TREASURY_ADDRESS,
            value: "0x" + amountInWei,
          }],
        });
      } else {
        // ERC20 transfer (USDT/USDC)
        // transfer(address to, uint256 amount) = 0xa9059cbb
        const amountInSmallestUnit = BigInt(Math.floor(amount * 10 ** tokenConfig.decimals));
        const amountHex = amountInSmallestUnit.toString(16).padStart(64, "0");
        const toAddressHex = TREASURY_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
        const data = "0xa9059cbb" + toAddressHex + amountHex;

        txHash = await typedProvider.request({
          method: "eth_sendTransaction",
          params: [{
            from: activeAddress,
            to: tokenConfig.address,
            data: data,
          }],
        });
      }

      if (txHash) {
        console.log("Purchase transaction sent:", txHash);
        return { success: true, txHash };
      }

      return { success: false, error: "Transaction failed" };
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  // Buy tokens from the PropertyMarketplace contract
  const buyFromMarketplace = useCallback(async (
    { listingId, amount, paymentToken, pricePerToken }: MarketplaceBuyParams,
    overrideProvider?: unknown,
    overrideAddress?: string
  ): Promise<MarketplaceBuyResult> => {
    const activeProvider = overrideProvider || provider;
    const activeAddress = overrideAddress || address;

    if (!activeProvider || !activeAddress) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!PROPERTY_MARKETPLACE_ADDRESS) {
      return { success: false, error: "PropertyMarketplace contract address not configured" };
    }

    const tokenConfig = PAYMENT_TOKENS[paymentToken.toUpperCase()];
    if (!tokenConfig) {
      return { success: false, error: `Invalid payment token: ${paymentToken}` };
    }

    try {
      const typedProvider = activeProvider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      const totalCost = pricePerToken * amount;
      const totalCostInSmallestUnit = BigInt(Math.floor(totalCost * 10 ** tokenConfig.decimals));

      // For ERC20 tokens (USDT/USDC), we need to approve first
      if (paymentToken.toUpperCase() !== "MATIC") {
        // Step 1: Approve tokens to marketplace
        // approve(address spender, uint256 amount) = 0x095ea7b3
        const amountHex = totalCostInSmallestUnit.toString(16).padStart(64, "0");
        const spenderHex = PROPERTY_MARKETPLACE_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
        const approveData = "0x095ea7b3" + spenderHex + amountHex;

        console.log("Step 1: Approving tokens to marketplace...");
        const approveTxHash = await typedProvider.request({
          method: "eth_sendTransaction",
          params: [{
            from: activeAddress,
            to: tokenConfig.address,
            data: approveData,
          }],
        });

        if (!approveTxHash) {
          return { success: false, error: "Token approval failed" };
        }
        console.log("Approval tx:", approveTxHash);

        // Wait for approval confirmation - no fixed timeouts
        console.log("Waiting for approval confirmation...");
        let approvalConfirmed = false;
        const maxAttempts = 60; // Max 60 attempts (roughly 60 seconds)

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const receipt = await typedProvider.request({
            method: "eth_getTransactionReceipt",
            params: [approveTxHash],
          });

          if (receipt) {
            const receiptObj = receipt as unknown as { status: string };
            if (receiptObj.status === "0x1") {
              console.log("Approval confirmed after", attempt + 1, "attempts");
              approvalConfirmed = true;
              break;
            } else if (receiptObj.status === "0x0") {
              return { success: false, error: "Approval transaction reverted" };
            }
          }

          // Wait 1 second before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!approvalConfirmed) {
          return { success: false, error: "Approval confirmation timeout - try again" };
        }
      }

      // Step 2: Call marketplace.buy(listingId, amount)
      // buy(uint256 listingId, uint256 amount) = 0xd6febde8
      console.log("Step 2: Buying from marketplace...");
      console.log("[buyFromMarketplace] Parameters:", {
        listingId,
        amount,
        pricePerToken,
        paymentToken,
        totalCost,
        totalCostInSmallestUnit: totalCostInSmallestUnit.toString(),
        marketplaceAddress: PROPERTY_MARKETPLACE_ADDRESS,
        buyerAddress: activeAddress,
      });

      const listingIdHex = listingId.toString(16).padStart(64, "0");
      const amountHex = amount.toString(16).padStart(64, "0");
      const buyData = "0xd6febde8" + listingIdHex + amountHex;

      console.log("[buyFromMarketplace] Encoded data:", {
        listingIdHex,
        amountHex,
        buyData,
      });

      const txParams: Record<string, string> = {
        from: activeAddress,
        to: PROPERTY_MARKETPLACE_ADDRESS,
        data: buyData,
        // If paying with MATIC, include value
        ...(paymentToken.toUpperCase() === "MATIC" && {
          value: "0x" + totalCostInSmallestUnit.toString(16),
        }),
      };

      console.log("[buyFromMarketplace] Transaction params:", txParams);

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      if (txHash) {
        console.log("Buy transaction sent:", txHash);
        return { success: true, txHash };
      }

      return { success: false, error: "Transaction failed" };
    } catch (error) {
      console.error("Error buying from marketplace:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  // Buy tokens directly from treasury (primary sale - no listing required)
  const buyDirect = useCallback(async (
    { propertyId, amount, paymentToken }: BuyDirectParams,
    overrideProvider?: unknown,
    overrideAddress?: string
  ): Promise<BuyDirectResult> => {
    const activeProvider = overrideProvider || provider;
    const activeAddress = overrideAddress || address;

    if (!activeProvider || !activeAddress) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!PROPERTY_MARKETPLACE_ADDRESS) {
      return { success: false, error: "PropertyMarketplace contract address not configured" };
    }

    const tokenConfig = PAYMENT_TOKENS[paymentToken.toUpperCase()];
    if (!tokenConfig || paymentToken.toUpperCase() === "MATIC") {
      return { success: false, error: "Invalid payment token. Use USDT or USDC for direct purchase" };
    }

    try {
      const typedProvider = activeProvider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // First get the price from the contract
      // getPropertyPrice(uint256 propertyId) returns (uint256 pricePerToken, address paymentToken)
      const propertyIdHex = propertyId.toString(16).padStart(64, "0");
      const getPriceData = "0x0789752c" + propertyIdHex; // getPropertyPrice(uint256) selector

      console.log("[buyDirect] Getting property price...");
      const priceResult = await typedProvider.request({
        method: "eth_call",
        params: [{
          to: PROPERTY_MARKETPLACE_ADDRESS,
          data: getPriceData,
        }, "latest"],
      });

      if (!priceResult || priceResult === "0x") {
        return { success: false, error: "Property price not set. Contact admin." };
      }

      // Parse price result: (uint256 pricePerToken, address paymentToken)
      const pricePerToken = BigInt("0x" + priceResult.slice(2, 66));
      const configuredPaymentToken = "0x" + priceResult.slice(90, 130);

      console.log("[buyDirect] Price per token:", pricePerToken.toString());
      console.log("[buyDirect] Configured payment token:", configuredPaymentToken);

      if (pricePerToken === BigInt(0)) {
        return { success: false, error: "Property price not configured. Contact admin." };
      }

      // Verify the payment token matches
      if (configuredPaymentToken.toLowerCase() !== tokenConfig.address.toLowerCase()) {
        return { success: false, error: `This property requires payment in a different token` };
      }

      const totalCost = pricePerToken * BigInt(amount);
      console.log("[buyDirect] Total cost:", totalCost.toString());

      // Step 1: Approve tokens to marketplace
      const amountHex = totalCost.toString(16).padStart(64, "0");
      const spenderHex = PROPERTY_MARKETPLACE_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
      const approveData = "0x095ea7b3" + spenderHex + amountHex;

      console.log("[buyDirect] Step 1: Approving tokens to marketplace...");
      const approveTxHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: activeAddress,
          to: tokenConfig.address,
          data: approveData,
        }],
      });

      if (!approveTxHash) {
        return { success: false, error: "Token approval failed" };
      }
      console.log("[buyDirect] Approval tx:", approveTxHash);

      // Wait for approval confirmation
      console.log("[buyDirect] Waiting for approval confirmation...");
      let approvalConfirmed = false;
      const maxAttempts = 60;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const receipt = await typedProvider.request({
          method: "eth_getTransactionReceipt",
          params: [approveTxHash],
        });

        if (receipt) {
          const receiptObj = receipt as unknown as { status: string };
          if (receiptObj.status === "0x1") {
            console.log("[buyDirect] Approval confirmed after", attempt + 1, "attempts");
            approvalConfirmed = true;
            break;
          } else if (receiptObj.status === "0x0") {
            return { success: false, error: "Approval transaction reverted" };
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!approvalConfirmed) {
        return { success: false, error: "Approval confirmation timeout - try again" };
      }

      // Step 2: Call buyDirect(uint256 propertyId, uint256 amount)
      console.log("[buyDirect] Step 2: Calling buyDirect...");
      const amountTokensHex = amount.toString(16).padStart(64, "0");
      // buyDirect(uint256,uint256) selector = 0x6214f36a
      const buyDirectData = "0x6214f36a" + propertyIdHex + amountTokensHex;

      console.log("[buyDirect] Parameters:", {
        propertyId,
        amount,
        totalCost: totalCost.toString(),
        marketplaceAddress: PROPERTY_MARKETPLACE_ADDRESS,
        buyerAddress: activeAddress,
      });

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: activeAddress,
          to: PROPERTY_MARKETPLACE_ADDRESS,
          data: buyDirectData,
        }],
      });

      if (txHash) {
        console.log("[buyDirect] Transaction sent:", txHash);
        return { success: true, txHash };
      }

      return { success: false, error: "Transaction failed" };
    } catch (error) {
      console.error("[buyDirect] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  const approveTokensForDistributor = useCallback(async (
    paymentToken: string,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!provider || !address) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!ROYALTY_DISTRIBUTOR_ADDRESS) {
      return { success: false, error: "RoyaltyDistributor contract address not configured" };
    }

    const tokenConfig = PAYMENT_TOKENS[paymentToken.toUpperCase()];
    if (!tokenConfig || paymentToken.toUpperCase() === "MATIC") {
      return { success: false, error: "Invalid payment token for approval. Use USDT or USDC" };
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // approve(address spender, uint256 amount) = 0x095ea7b3
      const amountInSmallestUnit = BigInt(Math.floor(amount * 10 ** tokenConfig.decimals));
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, "0");
      const spenderHex = ROYALTY_DISTRIBUTOR_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
      const data = "0x095ea7b3" + spenderHex + amountHex;

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: tokenConfig.address,
          data: data,
        }],
      });

      if (txHash) {
        console.log("Approval transaction sent:", txHash);

        // Wait for transaction confirmation
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;

          const receipt = await typedProvider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });

          if (receipt) {
            const receiptObj = receipt as unknown as { status: string };
            if (receiptObj.status === "0x1") {
              console.log("Approval confirmed after", attempts, "seconds");
              return { success: true, txHash };
            } else {
              return { success: false, error: "Approval transaction reverted", txHash };
            }
          }
        }

        // Timeout but tx was sent - return success anyway
        console.log("Approval tx sent but confirmation timeout");
        return { success: true, txHash };
      }

      return { success: false, error: "Approval transaction failed" };
    } catch (error) {
      console.error("Error approving tokens:", error);
      // Handle wallet-specific errors
      const walletError = error as { code?: number; message?: string };
      if (walletError.code === 4100) {
        return { success: false, error: "La wallet no está autorizada. Reconecta desde MetaMask > Sitios conectados." };
      } else if (walletError.code === 4001) {
        return { success: false, error: "Transacción rechazada por el usuario." };
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  const createDistribution = useCallback(async (
    { propertyTokenId, amount, paymentToken }: CreateDistributionParams
  ): Promise<DistributionResult> => {
    if (!provider || !address) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!ROYALTY_DISTRIBUTOR_ADDRESS) {
      return { success: false, error: "RoyaltyDistributor contract address not configured" };
    }

    const tokenConfig = PAYMENT_TOKENS[paymentToken.toUpperCase()];
    if (!tokenConfig || paymentToken.toUpperCase() === "MATIC") {
      return { success: false, error: "Invalid payment token. Use USDT or USDC" };
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // createDistribution(uint256 propertyId, uint256 amount, address paymentToken)
      // Function selector: keccak256("createDistribution(uint256,uint256,address)") = 0x4a0f5ef2
      const propertyIdHex = propertyTokenId.toString(16).padStart(64, "0");
      const amountInSmallestUnit = BigInt(Math.floor(amount * 10 ** tokenConfig.decimals));
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, "0");
      const tokenAddressHex = tokenConfig.address.slice(2).toLowerCase().padStart(64, "0");

      const data = "0x4a0f5ef2" + propertyIdHex + amountHex + tokenAddressHex;

      // Debug logs
      console.log("=== createDistribution DEBUG ===");
      console.log("Input params:", { propertyTokenId, amount, paymentToken });
      console.log("Token config:", tokenConfig);
      console.log("Amount in smallest unit:", amountInSmallestUnit.toString());
      console.log("RoyaltyDistributor address:", ROYALTY_DISTRIBUTOR_ADDRESS);
      console.log("From address:", address);
      console.log("Encoded data:", data);
      console.log("Decoded params check:");
      console.log("  - propertyId (hex):", propertyIdHex, "=", parseInt(propertyIdHex, 16));
      console.log("  - amount (hex):", amountHex, "=", BigInt("0x" + amountHex).toString());
      console.log("  - paymentToken:", "0x" + tokenAddressHex.slice(24));

      // Check allowance before proceeding
      const ownerHex = address.slice(2).toLowerCase().padStart(64, "0");
      const spenderHex = ROYALTY_DISTRIBUTOR_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
      const allowanceData = "0xdd62ed3e" + ownerHex + spenderHex; // allowance(owner, spender)

      const allowanceResult = await typedProvider.request({
        method: "eth_call",
        params: [{ to: tokenConfig.address, data: allowanceData }, "latest"],
      });

      const currentAllowance = allowanceResult ? BigInt(allowanceResult) : BigInt(0);
      console.log("Current allowance:", currentAllowance.toString());
      console.log("Required amount:", amountInSmallestUnit.toString());
      console.log("Allowance sufficient?", currentAllowance >= amountInSmallestUnit);

      if (currentAllowance < amountInSmallestUnit) {
        return {
          success: false,
          error: `Allowance insuficiente. Tienes ${currentAllowance.toString()} pero necesitas ${amountInSmallestUnit.toString()}`
        };
      }

      // Check user's token balance
      const balanceData = "0x70a08231" + ownerHex; // balanceOf(owner)
      const balanceResult = await typedProvider.request({
        method: "eth_call",
        params: [{ to: tokenConfig.address, data: balanceData }, "latest"],
      });

      const currentBalance = balanceResult ? BigInt(balanceResult) : BigInt(0);
      console.log("Current balance:", currentBalance.toString());
      console.log("Balance sufficient?", currentBalance >= amountInSmallestUnit);

      if (currentBalance < amountInSmallestUnit) {
        const balanceFormatted = Number(currentBalance) / (10 ** tokenConfig.decimals);
        return {
          success: false,
          error: `Balance insuficiente. Tienes ${balanceFormatted.toFixed(2)} ${paymentToken} pero necesitas ${amount}`
        };
      }

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: ROYALTY_DISTRIBUTOR_ADDRESS,
          data: data,
        }],
      });

      if (txHash) {
        console.log("Distribution creation transaction sent:", txHash);

        // Wait for transaction confirmation and get the distributionId from logs
        let distributionId: number | undefined;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;

          const receipt = await typedProvider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });

          if (receipt) {
            // Parse the DistributionCreated event
            // Event: DistributionCreated(uint256 indexed distributionId, uint256 indexed propertyId, uint256 amount, address paymentToken)
            // Topic0 = keccak256("DistributionCreated(uint256,uint256,uint256,address)")
            // = 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0 (example, need to verify)
            const receiptObj = receipt as unknown as {
              status: string;
              logs: Array<{ address: string; topics: string[]; data: string }>;
            };

            if (receiptObj.status === "0x1") {
              // Find the DistributionCreated event from the RoyaltyDistributor contract
              const royaltyDistributorAddress = ROYALTY_DISTRIBUTOR_ADDRESS?.toLowerCase();

              for (const log of receiptObj.logs || []) {
                // Only look at logs from our contract
                if (log.address?.toLowerCase() !== royaltyDistributorAddress) {
                  continue;
                }

                // The log should have at least 3 topics: topic0 (event sig), distributionId, propertyId
                if (log.topics && log.topics.length >= 3) {
                  // topics[1] is the indexed distributionId
                  const distributionIdHex = log.topics[1];
                  if (distributionIdHex) {
                    // Parse as BigInt first to handle large hex values, then convert to number
                    const bigIntValue = BigInt(distributionIdHex);
                    // Distribution IDs should be small sequential numbers
                    if (bigIntValue <= BigInt(Number.MAX_SAFE_INTEGER)) {
                      distributionId = Number(bigIntValue);
                      console.log("Extracted distributionId from event:", distributionId);
                      break;
                    }
                  }
                }
              }
              return { success: true, txHash, distributionId };
            } else {
              return { success: false, error: "Transaction failed", txHash };
            }
          }
        }

        // If we couldn't get receipt in time, still return success with txHash
        console.log("Could not get receipt in time, returning without distributionId");
        return { success: true, txHash };
      }

      return { success: false, error: "Distribution creation failed" };
    } catch (error) {
      console.error("Error creating distribution:", error);
      // Handle wallet-specific errors
      const walletError = error as { code?: number; message?: string };
      if (walletError.code === 4100) {
        return { success: false, error: "La wallet no está autorizada. Reconecta desde MetaMask > Sitios conectados." };
      } else if (walletError.code === 4001) {
        return { success: false, error: "Transacción rechazada por el usuario." };
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  const getDistributionInfo = useCallback(async (
    distributionId: number
  ): Promise<DistributionInfo | null> => {
    if (!provider) {
      return null;
    }

    if (!ROYALTY_DISTRIBUTOR_ADDRESS) {
      return null;
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // getDistribution(uint256 distributionId) = 0x3b345a87
      const distributionIdHex = distributionId.toString(16).padStart(64, "0");
      const data = "0x3b345a87" + distributionIdHex;

      const result = await typedProvider.request({
        method: "eth_call",
        params: [{
          to: ROYALTY_DISTRIBUTOR_ADDRESS,
          data: data,
        }, "latest"],
      });

      if (result && result !== "0x") {
        // Parse the returned tuple (propertyId, totalAmount, paymentToken, totalSupplySnapshot, createdAt)
        const propertyId = parseInt(result.slice(2, 66), 16);
        const totalAmount = BigInt("0x" + result.slice(66, 130)).toString();
        const paymentToken = "0x" + result.slice(130, 194).slice(24);
        const totalSupplySnapshot = BigInt("0x" + result.slice(194, 258)).toString();
        const createdAt = parseInt(result.slice(258, 322), 16);

        return {
          propertyId,
          totalAmount,
          paymentToken,
          totalSupplySnapshot,
          createdAt,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting distribution info:", error);
      return null;
    }
  }, [provider]);

  const getClaimableAmount = useCallback(async (
    distributionId: number,
    userAddress?: string
  ): Promise<ClaimableInfo | null> => {
    const targetAddress = userAddress || address;
    if (!provider || !targetAddress) {
      return null;
    }

    if (!ROYALTY_DISTRIBUTOR_ADDRESS) {
      return null;
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // getClaimableAmount(uint256 distributionId, address holder) = 0x78c5195e
      const distributionIdHex = distributionId.toString(16).padStart(64, "0");
      const addressHex = targetAddress.slice(2).toLowerCase().padStart(64, "0");
      const data = "0x78c5195e" + distributionIdHex + addressHex;

      const result = await typedProvider.request({
        method: "eth_call",
        params: [{
          to: ROYALTY_DISTRIBUTOR_ADDRESS,
          data: data,
        }, "latest"],
      });

      // Check if user has claimed - hasClaimed(uint256 distributionId, address holder) = 0x873f6f9e
      const hasClaimedData = "0x873f6f9e" + distributionIdHex + addressHex;
      const hasClaimedResult = await typedProvider.request({
        method: "eth_call",
        params: [{
          to: ROYALTY_DISTRIBUTOR_ADDRESS,
          data: hasClaimedData,
        }, "latest"],
      });

      const amount = result ? BigInt("0x" + result.slice(2)).toString() : "0";
      const hasClaimed = hasClaimedResult ? parseInt(hasClaimedResult, 16) === 1 : false;

      return {
        distributionId,
        amount,
        hasClaimed,
      };
    } catch (error) {
      console.error("Error getting claimable amount:", error);
      return null;
    }
  }, [provider, address]);

  // Check if marketplace is approved for PropertyToken
  const isMarketplaceApproved = useCallback(async (): Promise<boolean> => {
    if (!provider || !address) {
      return false;
    }

    if (!PROPERTY_TOKEN_ADDRESS || !PROPERTY_MARKETPLACE_ADDRESS) {
      return false;
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // isApprovedForAll(address owner, address operator) = 0xe985e9c5
      const ownerHex = address.slice(2).toLowerCase().padStart(64, "0");
      const operatorHex = PROPERTY_MARKETPLACE_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
      const data = "0xe985e9c5" + ownerHex + operatorHex;

      const result = await typedProvider.request({
        method: "eth_call",
        params: [{
          to: PROPERTY_TOKEN_ADDRESS,
          data: data,
        }, "latest"],
      });

      return result ? parseInt(result, 16) === 1 : false;
    } catch (error) {
      console.error("Error checking marketplace approval:", error);
      return false;
    }
  }, [provider, address]);

  // Approve PropertyToken for Marketplace (ERC-1155 setApprovalForAll)
  const approveMarketplace = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!provider || !address) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!PROPERTY_TOKEN_ADDRESS || !PROPERTY_MARKETPLACE_ADDRESS) {
      return { success: false, error: "Contract addresses not configured" };
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // setApprovalForAll(address operator, bool approved) = 0xa22cb465
      const operatorHex = PROPERTY_MARKETPLACE_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
      const approvedHex = "1".padStart(64, "0"); // true
      const data = "0xa22cb465" + operatorHex + approvedHex;

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: PROPERTY_TOKEN_ADDRESS,
          data: data,
        }],
      });

      if (txHash) {
        console.log("Marketplace approval transaction sent:", txHash);
        return { success: true, txHash };
      }

      return { success: false, error: "Approval transaction failed" };
    } catch (error) {
      console.error("Error approving marketplace:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  // Create a marketplace listing
  const createMarketplaceListing = useCallback(async (
    { propertyId, amount, pricePerToken, paymentToken }: CreateListingParams
  ): Promise<CreateListingResult> => {
    if (!provider || !address) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!PROPERTY_MARKETPLACE_ADDRESS) {
      return { success: false, error: "Marketplace contract address not configured" };
    }

    const tokenConfig = PAYMENT_TOKENS[paymentToken.toUpperCase()];
    if (!tokenConfig) {
      return { success: false, error: "Invalid payment token" };
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // First check if marketplace is approved
      let approvalTxHash: string | undefined;
      console.log("Checking marketplace approval...");
      console.log("PROPERTY_TOKEN_ADDRESS:", PROPERTY_TOKEN_ADDRESS);
      console.log("PROPERTY_MARKETPLACE_ADDRESS:", PROPERTY_MARKETPLACE_ADDRESS);

      const approved = await isMarketplaceApproved();
      console.log("Marketplace approved:", approved);

      if (!approved) {
        console.log("Marketplace not approved, requesting approval...");
        const approvalResult = await approveMarketplace();
        console.log("Approval result:", approvalResult);
        if (!approvalResult.success) {
          return { success: false, error: "Failed to approve marketplace: " + approvalResult.error };
        }
        approvalTxHash = approvalResult.txHash;

        // Wait for approval confirmation - poll until confirmed
        if (approvalTxHash) {
          console.log("Waiting for approval confirmation...", approvalTxHash);
          let approvalConfirmed = false;
          const maxAttempts = 60;

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const receipt = await typedProvider.request({
              method: "eth_getTransactionReceipt",
              params: [approvalTxHash],
            });

            if (receipt) {
              const receiptObj = receipt as unknown as { status: string };
              if (receiptObj.status === "0x1") {
                console.log("Approval confirmed after", attempt + 1, "attempts");
                approvalConfirmed = true;
                break;
              } else if (receiptObj.status === "0x0") {
                return { success: false, error: "Approval transaction reverted" };
              }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          if (!approvalConfirmed) {
            return { success: false, error: "Approval confirmation timeout - try again" };
          }
        }

        // Verify approval was successful
        const verifyApproved = await isMarketplaceApproved();
        console.log("Verified approval after confirmation:", verifyApproved);
        if (!verifyApproved) {
          return { success: false, error: "Approval transaction confirmed but state not updated. Please try again." };
        }
      }

      // createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken)
      // Function selector: 0x8ebaae08 (keccak256 first 4 bytes of "createListing(uint256,uint256,uint256,address)")
      const propertyIdHex = propertyId.toString(16).padStart(64, "0");
      const amountHex = amount.toString(16).padStart(64, "0");
      // Price in smallest unit (6 decimals for USDT/USDC)
      const priceInSmallestUnit = BigInt(Math.floor(pricePerToken * 10 ** tokenConfig.decimals));
      const priceHex = priceInSmallestUnit.toString(16).padStart(64, "0");
      const paymentTokenHex = tokenConfig.address.slice(2).toLowerCase().padStart(64, "0");

      const data = "0x8ebaae08" + propertyIdHex + amountHex + priceHex + paymentTokenHex;

      console.log("Creating listing with params:", {
        propertyId,
        amount,
        pricePerToken,
        priceInSmallestUnit: priceInSmallestUnit.toString(),
        paymentToken: tokenConfig.address,
      });

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: PROPERTY_MARKETPLACE_ADDRESS,
          data: data,
        }],
      });

      if (txHash) {
        console.log("Create listing transaction sent:", txHash);

        // Wait for transaction confirmation and extract listingId from logs
        let listingId: number | undefined;
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;

          const receipt = await typedProvider.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });

          if (receipt) {
            const receiptObj = receipt as unknown as {
              status: string;
              logs: Array<{ address: string; topics: string[]; data: string }>;
            };

            console.log("Transaction receipt:", JSON.stringify(receiptObj, null, 2));

            if (receiptObj.status === "0x1") {
              // Parse ListingCreated event
              // Event: ListingCreated(uint256 indexed listingId, address indexed seller, uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken)
              for (const log of receiptObj.logs) {
                if (log.address.toLowerCase() === PROPERTY_MARKETPLACE_ADDRESS.toLowerCase()) {
                  // listingId is in topics[1]
                  if (log.topics.length > 1) {
                    listingId = parseInt(log.topics[1], 16);
                    break;
                  }
                }
              }
              return { success: true, txHash, approvalTxHash, listingId };
            } else {
              return { success: false, error: "Transaction failed", txHash };
            }
          }
        }

        // Timeout but tx was sent
        return { success: true, txHash, approvalTxHash };
      }

      return { success: false, error: "Transaction failed" };
    } catch (error) {
      console.error("Error creating listing:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address, isMarketplaceApproved, approveMarketplace]);

  // Cancel a marketplace listing
  const cancelMarketplaceListing = useCallback(async (
    listingId: number
  ): Promise<CancelListingResult> => {
    if (!provider || !address) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!PROPERTY_MARKETPLACE_ADDRESS) {
      return { success: false, error: "Marketplace contract address not configured" };
    }

    try {
      const typedProvider = provider as {
        request: (args: { method: string; params?: unknown[] }) => Promise<string | null>
      };

      // cancelListing(uint256 listingId) = 0x305a67a8
      const listingIdHex = listingId.toString(16).padStart(64, "0");
      const data = "0x305a67a8" + listingIdHex;

      const txHash = await typedProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: PROPERTY_MARKETPLACE_ADDRESS,
          data: data,
        }],
      });

      if (txHash) {
        console.log("Cancel listing transaction sent:", txHash);
        return { success: true, txHash };
      }

      return { success: false, error: "Transaction failed" };
    } catch (error) {
      console.error("Error cancelling listing:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [provider, address]);

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        isLoading,
        isConnected: !!provider && !!address,
        address,
        userInfo,
        login,
        logout,
        getBalance,
        getBalances,
        claimRoyalty,
        purchaseTokens,
        approveTokensForDistributor,
        createDistribution,
        getDistributionInfo,
        getClaimableAmount,
        buyFromMarketplace,
        buyDirect,
        approveMarketplace,
        isMarketplaceApproved,
        createMarketplaceListing,
        cancelMarketplaceListing,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}
