"use client";

import { useCallback } from "react";
import { useWeb3Auth } from "@/lib/web3auth/Web3AuthContext";
import { CONTRACT_ADDRESSES, ROLES } from "./abis";

type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<string | null>;
};

interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Utility to encode function calls
function encodeAddress(address: string): string {
  return address.slice(2).toLowerCase().padStart(64, "0");
}

function encodeUint256(value: bigint | number | string): string {
  const bigValue = typeof value === "bigint" ? value : BigInt(value);
  return bigValue.toString(16).padStart(64, "0");
}

function encodeBytes32(value: string): string {
  // If already 66 chars (0x + 64), just remove 0x
  if (value.startsWith("0x") && value.length === 66) {
    return value.slice(2);
  }
  return value.padStart(64, "0");
}

export function useContractInteraction() {
  const { provider, address, isConnected } = useWeb3Auth();

  const sendTransaction = useCallback(
    async (
      contractAddress: string,
      data: string
    ): Promise<TransactionResult> => {
      if (!provider || !address || !isConnected) {
        return { success: false, error: "Wallet no conectada" };
      }

      if (!contractAddress) {
        return { success: false, error: "Dirección de contrato no configurada" };
      }

      try {
        const typedProvider = provider as Provider;

        const txHash = await typedProvider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: contractAddress,
              data: data,
            },
          ],
        });

        if (txHash) {
          return { success: true, txHash };
        }

        return { success: false, error: "Transacción fallida" };
      } catch (error) {
        console.error("Transaction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return { success: false, error: errorMessage };
      }
    },
    [provider, address, isConnected]
  );

  const callContract = useCallback(
    async (contractAddress: string, data: string): Promise<string | null> => {
      if (!provider) return null;

      try {
        const typedProvider = provider as Provider;
        const result = await typedProvider.request({
          method: "eth_call",
          params: [{ to: contractAddress, data }, "latest"],
        });
        return result;
      } catch (error) {
        console.error("Call error:", error);
        return null;
      }
    },
    [provider]
  );

  // ============ PropertyToken Functions ============

  const mintTokens = useCallback(
    async (
      _to: string, // Not used - tokens go to treasury defined in contract
      propertyId: number,
      amount: number,
      propertyUri: string = "",
      royaltyFee: number = 250 // 2.5% default
    ): Promise<TransactionResult> => {
      // createProperty(uint256 tokenId, uint256 supply, string propertyUri, uint96 royaltyFee)
      // Selector: 0x14813659

      // Encode string parameter (dynamic type)
      // Convert string to hex without Buffer (browser compatible)
      const encoder = new TextEncoder();
      const uriBytes = encoder.encode(propertyUri);
      const uriLength = uriBytes.length;
      let uriHex = '';
      for (let i = 0; i < uriBytes.length; i++) {
        uriHex += uriBytes[i].toString(16).padStart(2, '0');
      }
      // Pad uri to 32-byte boundary
      const paddedLength = Math.max(32, Math.ceil(uriLength / 32) * 32);
      const uriPadded = uriHex.padEnd(paddedLength * 2, '0');

      const data =
        "0x14813659" +
        encodeUint256(propertyId) +          // tokenId
        encodeUint256(amount) +               // supply
        "0000000000000000000000000000000000000000000000000000000000000080" + // string offset (128)
        encodeUint256(royaltyFee) +           // royaltyFee (uint96, but padded to 32 bytes)
        encodeUint256(uriLength) +            // string length
        uriPadded;                            // string data

      return sendTransaction(CONTRACT_ADDRESSES.propertyToken, data);
    },
    [sendTransaction]
  );

  const burnTokens = useCallback(
    async (
      from: string,
      propertyId: number,
      amount: number
    ): Promise<TransactionResult> => {
      // burn(address,uint256,uint256) = 0xf5298aca
      const data =
        "0xf5298aca" +
        encodeAddress(from) +
        encodeUint256(propertyId) +
        encodeUint256(amount);

      return sendTransaction(CONTRACT_ADDRESSES.propertyToken, data);
    },
    [sendTransaction]
  );

  const pausePropertyToken = useCallback(async (): Promise<TransactionResult> => {
    // pause() = 0x8456cb59
    return sendTransaction(CONTRACT_ADDRESSES.propertyToken, "0x8456cb59");
  }, [sendTransaction]);

  const unpausePropertyToken = useCallback(async (): Promise<TransactionResult> => {
    // unpause() = 0x3f4ba83a
    return sendTransaction(CONTRACT_ADDRESSES.propertyToken, "0x3f4ba83a");
  }, [sendTransaction]);

  const grantMinterRole = useCallback(
    async (account: string): Promise<TransactionResult> => {
      // grantRole(bytes32,address) = 0x2f2ff15d
      const data =
        "0x2f2ff15d" +
        encodeBytes32(ROLES.MINTER_ROLE) +
        encodeAddress(account);

      return sendTransaction(CONTRACT_ADDRESSES.propertyToken, data);
    },
    [sendTransaction]
  );

  const revokeMinterRole = useCallback(
    async (account: string): Promise<TransactionResult> => {
      // revokeRole(bytes32,address) = 0xd547741f
      const data =
        "0xd547741f" +
        encodeBytes32(ROLES.MINTER_ROLE) +
        encodeAddress(account);

      return sendTransaction(CONTRACT_ADDRESSES.propertyToken, data);
    },
    [sendTransaction]
  );

  // ============ Marketplace Functions ============

  const pauseMarketplace = useCallback(async (): Promise<TransactionResult> => {
    return sendTransaction(CONTRACT_ADDRESSES.marketplace, "0x8456cb59");
  }, [sendTransaction]);

  const unpauseMarketplace = useCallback(async (): Promise<TransactionResult> => {
    return sendTransaction(CONTRACT_ADDRESSES.marketplace, "0x3f4ba83a");
  }, [sendTransaction]);

  const setMarketplaceFee = useCallback(
    async (feePercent: number): Promise<TransactionResult> => {
      // Fee is in basis points (100 = 1%)
      const feeBasisPoints = Math.floor(feePercent * 100);
      // setMarketplaceFee(uint96) = 0x22eb6c3e (need to verify)
      const data = "0x22eb6c3e" + encodeUint256(feeBasisPoints);
      return sendTransaction(CONTRACT_ADDRESSES.marketplace, data);
    },
    [sendTransaction]
  );

  const addPaymentTokenToMarketplace = useCallback(
    async (tokenAddress: string): Promise<TransactionResult> => {
      // addPaymentToken(address) = 0x4b0ee02a (need to verify)
      const data = "0x4b0ee02a" + encodeAddress(tokenAddress);
      return sendTransaction(CONTRACT_ADDRESSES.marketplace, data);
    },
    [sendTransaction]
  );

  const removePaymentTokenFromMarketplace = useCallback(
    async (tokenAddress: string): Promise<TransactionResult> => {
      // removePaymentToken(address) = 0x6a8b9c92
      const data = "0x6a8b9c92" + encodeAddress(tokenAddress);
      return sendTransaction(CONTRACT_ADDRESSES.marketplace, data);
    },
    [sendTransaction]
  );

  const setMarketplaceTreasury = useCallback(
    async (treasuryAddress: string): Promise<TransactionResult> => {
      // setTreasury(address) = 0xf0f44260
      const data = "0xf0f44260" + encodeAddress(treasuryAddress);
      return sendTransaction(CONTRACT_ADDRESSES.marketplace, data);
    },
    [sendTransaction]
  );

  // ============ RoyaltyDistributor Functions ============

  const pauseRoyaltyDistributor = useCallback(async (): Promise<TransactionResult> => {
    return sendTransaction(CONTRACT_ADDRESSES.royaltyDistributor, "0x8456cb59");
  }, [sendTransaction]);

  const unpauseRoyaltyDistributor = useCallback(async (): Promise<TransactionResult> => {
    return sendTransaction(CONTRACT_ADDRESSES.royaltyDistributor, "0x3f4ba83a");
  }, [sendTransaction]);

  const createDistribution = useCallback(
    async (
      propertyId: number,
      totalAmount: bigint,
      paymentToken: string
    ): Promise<TransactionResult> => {
      // createDistribution(uint256,uint256,address) = 0x4a0f5ef2
      const data =
        "0x4a0f5ef2" +
        encodeUint256(propertyId) +
        encodeUint256(totalAmount) +
        encodeAddress(paymentToken);

      return sendTransaction(CONTRACT_ADDRESSES.royaltyDistributor, data);
    },
    [sendTransaction]
  );

  // ============ Read Functions ============

  const isPropertyTokenPaused = useCallback(async (): Promise<boolean> => {
    // paused() = 0x5c975abb
    const result = await callContract(CONTRACT_ADDRESSES.propertyToken, "0x5c975abb");
    return result ? parseInt(result, 16) === 1 : false;
  }, [callContract]);

  const isMarketplacePaused = useCallback(async (): Promise<boolean> => {
    const result = await callContract(CONTRACT_ADDRESSES.marketplace, "0x5c975abb");
    return result ? parseInt(result, 16) === 1 : false;
  }, [callContract]);

  const isRoyaltyDistributorPaused = useCallback(async (): Promise<boolean> => {
    const result = await callContract(CONTRACT_ADDRESSES.royaltyDistributor, "0x5c975abb");
    return result ? parseInt(result, 16) === 1 : false;
  }, [callContract]);

  const getMarketplaceFee = useCallback(async (): Promise<number> => {
    // marketplaceFee() = 0x6a166964
    const result = await callContract(CONTRACT_ADDRESSES.marketplace, "0x6a166964");
    return result ? parseInt(result, 16) / 100 : 0; // Convert from basis points to percent
  }, [callContract]);

  const getMarketplaceTreasury = useCallback(async (): Promise<string> => {
    // treasury() = 0x61d027b3
    const result = await callContract(CONTRACT_ADDRESSES.marketplace, "0x61d027b3");
    if (!result || result === "0x") return "";
    // Result is a 32-byte padded address, extract last 40 chars
    return "0x" + result.slice(-40);
  }, [callContract]);

  const isPaymentTokenAccepted = useCallback(
    async (tokenAddress: string): Promise<boolean> => {
      // isPaymentTokenAccepted(address) = 0x4a8c1fb7
      const data = "0x4a8c1fb7" + encodeAddress(tokenAddress);
      const result = await callContract(CONTRACT_ADDRESSES.marketplace, data);
      return result ? parseInt(result, 16) === 1 : false;
    },
    [callContract]
  );

  const getTokenBalance = useCallback(
    async (account: string, propertyId: number): Promise<bigint> => {
      // balanceOf(address,uint256) = 0x00fdd58e
      const data =
        "0x00fdd58e" +
        encodeAddress(account) +
        encodeUint256(propertyId);

      const result = await callContract(CONTRACT_ADDRESSES.propertyToken, data);
      return result ? BigInt(result) : BigInt(0);
    },
    [callContract]
  );

  const getTotalSupply = useCallback(
    async (propertyId: number): Promise<bigint> => {
      // totalSupply(uint256) = 0xbd85b039
      const data = "0xbd85b039" + encodeUint256(propertyId);
      const result = await callContract(CONTRACT_ADDRESSES.propertyToken, data);
      return result ? BigInt(result) : BigInt(0);
    },
    [callContract]
  );

  return {
    // Connection state
    isConnected,
    address,
    // PropertyToken
    mintTokens,
    burnTokens,
    pausePropertyToken,
    unpausePropertyToken,
    grantMinterRole,
    revokeMinterRole,
    isPropertyTokenPaused,
    getTokenBalance,
    getTotalSupply,
    // Marketplace
    pauseMarketplace,
    unpauseMarketplace,
    setMarketplaceFee,
    setMarketplaceTreasury,
    addPaymentTokenToMarketplace,
    removePaymentTokenFromMarketplace,
    isMarketplacePaused,
    getMarketplaceFee,
    getMarketplaceTreasury,
    isPaymentTokenAccepted,
    // RoyaltyDistributor
    pauseRoyaltyDistributor,
    unpauseRoyaltyDistributor,
    createDistribution,
    isRoyaltyDistributorPaused,
  };
}
