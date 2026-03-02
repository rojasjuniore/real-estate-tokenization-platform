import { renderHook, act } from '@testing-library/react';
import { useContractInteraction } from '../useContractInteraction';

// Polyfill TextEncoder for Node environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock Web3Auth context
const mockProvider = {
  request: jest.fn(),
};

const mockUseWeb3Auth = jest.fn();
jest.mock('@/lib/web3auth/Web3AuthContext', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

// Mock contract addresses
jest.mock('../abis', () => ({
  CONTRACT_ADDRESSES: {
    propertyToken: '0xPropertyToken123456789012345678901234567890',
    marketplace: '0xMarketplace1234567890123456789012345678901',
    royaltyDistributor: '0xRoyaltyDist12345678901234567890123456789',
  },
  ROLES: {
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
  },
}));

describe('useContractInteraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when not connected', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        provider: null,
        address: null,
        isConnected: false,
      });
    });

    it('should return isConnected false', () => {
      const { result } = renderHook(() => useContractInteraction());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
    });

    it('should return error when trying to mint tokens', async () => {
      const { result } = renderHook(() => useContractInteraction());

      const response = await result.current.mintTokens('0xRecipient', 1, 100);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Wallet no conectada');
    });

    it('should return error when trying to pause property token', async () => {
      const { result } = renderHook(() => useContractInteraction());

      const response = await result.current.pausePropertyToken();

      expect(response.success).toBe(false);
      expect(response.error).toBe('Wallet no conectada');
    });
  });

  describe('when connected', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        provider: mockProvider,
        address: '0xUserAddress123456789012345678901234567890',
        isConnected: true,
      });
    });

    describe('PropertyToken functions', () => {
      it('should mint tokens successfully', async () => {
        mockProvider.request.mockResolvedValue('0xTransactionHash123');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.mintTokens('0xRecipient', 1, 100, 'ipfs://metadata', 250);
        });

        expect(response).toEqual({ success: true, txHash: '0xTransactionHash123' });
        expect(mockProvider.request).toHaveBeenCalledWith({
          method: 'eth_sendTransaction',
          params: [expect.objectContaining({
            from: '0xUserAddress123456789012345678901234567890',
            to: '0xPropertyToken123456789012345678901234567890',
          })],
        });
      });

      it('should burn tokens', async () => {
        mockProvider.request.mockResolvedValue('0xBurnTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.burnTokens('0xFrom123', 1, 50);
        });

        expect(response).toEqual({ success: true, txHash: '0xBurnTxHash' });
      });

      it('should pause property token', async () => {
        mockProvider.request.mockResolvedValue('0xPauseTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.pausePropertyToken();
        });

        expect(response).toEqual({ success: true, txHash: '0xPauseTxHash' });
        expect(mockProvider.request).toHaveBeenCalledWith({
          method: 'eth_sendTransaction',
          params: [expect.objectContaining({
            data: '0x8456cb59',
          })],
        });
      });

      it('should unpause property token', async () => {
        mockProvider.request.mockResolvedValue('0xUnpauseTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.unpausePropertyToken();
        });

        expect(response).toEqual({ success: true, txHash: '0xUnpauseTxHash' });
      });

      it('should grant minter role', async () => {
        mockProvider.request.mockResolvedValue('0xGrantRoleTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.grantMinterRole('0xMinterAddress');
        });

        expect(response).toEqual({ success: true, txHash: '0xGrantRoleTxHash' });
      });

      it('should revoke minter role', async () => {
        mockProvider.request.mockResolvedValue('0xRevokeTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.revokeMinterRole('0xMinterAddress');
        });

        expect(response).toEqual({ success: true, txHash: '0xRevokeTxHash' });
      });
    });

    describe('Marketplace functions', () => {
      it('should pause marketplace', async () => {
        mockProvider.request.mockResolvedValue('0xPauseMarketplaceTx');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.pauseMarketplace();
        });

        expect(response).toEqual({ success: true, txHash: '0xPauseMarketplaceTx' });
      });

      it('should unpause marketplace', async () => {
        mockProvider.request.mockResolvedValue('0xUnpauseMarketplaceTx');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.unpauseMarketplace();
        });

        expect(response).toEqual({ success: true, txHash: '0xUnpauseMarketplaceTx' });
      });

      it('should set marketplace fee', async () => {
        mockProvider.request.mockResolvedValue('0xSetFeeTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.setMarketplaceFee(2.5);
        });

        expect(response).toEqual({ success: true, txHash: '0xSetFeeTxHash' });
      });

      it('should add payment token to marketplace', async () => {
        mockProvider.request.mockResolvedValue('0xAddTokenTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.addPaymentTokenToMarketplace('0xTokenAddress');
        });

        expect(response).toEqual({ success: true, txHash: '0xAddTokenTxHash' });
      });

      it('should remove payment token from marketplace', async () => {
        mockProvider.request.mockResolvedValue('0xRemoveTokenTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.removePaymentTokenFromMarketplace('0xTokenAddress');
        });

        expect(response).toEqual({ success: true, txHash: '0xRemoveTokenTxHash' });
      });

      it('should set marketplace treasury', async () => {
        mockProvider.request.mockResolvedValue('0xSetTreasuryTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.setMarketplaceTreasury('0xTreasuryAddress');
        });

        expect(response).toEqual({ success: true, txHash: '0xSetTreasuryTxHash' });
      });
    });

    describe('RoyaltyDistributor functions', () => {
      it('should pause royalty distributor', async () => {
        mockProvider.request.mockResolvedValue('0xPauseRoyaltyTx');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.pauseRoyaltyDistributor();
        });

        expect(response).toEqual({ success: true, txHash: '0xPauseRoyaltyTx' });
      });

      it('should unpause royalty distributor', async () => {
        mockProvider.request.mockResolvedValue('0xUnpauseRoyaltyTx');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.unpauseRoyaltyDistributor();
        });

        expect(response).toEqual({ success: true, txHash: '0xUnpauseRoyaltyTx' });
      });

      it('should create distribution', async () => {
        mockProvider.request.mockResolvedValue('0xCreateDistTxHash');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.createDistribution(1, BigInt(1000000), '0xPaymentToken');
        });

        expect(response).toEqual({ success: true, txHash: '0xCreateDistTxHash' });
      });
    });

    describe('Read functions', () => {
      it('should check if property token is paused', async () => {
        // Return 1 (true) padded to 32 bytes
        mockProvider.request.mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000001');

        const { result } = renderHook(() => useContractInteraction());

        let isPaused;
        await act(async () => {
          isPaused = await result.current.isPropertyTokenPaused();
        });

        expect(isPaused).toBe(true);
      });

      it('should return false when property token is not paused', async () => {
        mockProvider.request.mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000000');

        const { result } = renderHook(() => useContractInteraction());

        let isPaused;
        await act(async () => {
          isPaused = await result.current.isPropertyTokenPaused();
        });

        expect(isPaused).toBe(false);
      });

      it('should get marketplace fee', async () => {
        // 250 basis points = 2.5%
        mockProvider.request.mockResolvedValue('0x00000000000000000000000000000000000000000000000000000000000000fa');

        const { result } = renderHook(() => useContractInteraction());

        let fee;
        await act(async () => {
          fee = await result.current.getMarketplaceFee();
        });

        expect(fee).toBe(2.5);
      });

      it('should get marketplace treasury address', async () => {
        mockProvider.request.mockResolvedValue('0x000000000000000000000000TreasuryAddress12345678901234567890');

        const { result } = renderHook(() => useContractInteraction());

        let treasury;
        await act(async () => {
          treasury = await result.current.getMarketplaceTreasury();
        });

        expect(treasury).toContain('0x');
      });

      it('should return empty string for empty treasury', async () => {
        mockProvider.request.mockResolvedValue('0x');

        const { result } = renderHook(() => useContractInteraction());

        let treasury;
        await act(async () => {
          treasury = await result.current.getMarketplaceTreasury();
        });

        expect(treasury).toBe('');
      });

      it('should check if payment token is accepted', async () => {
        mockProvider.request.mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000001');

        const { result } = renderHook(() => useContractInteraction());

        let isAccepted;
        await act(async () => {
          isAccepted = await result.current.isPaymentTokenAccepted('0xTokenAddress');
        });

        expect(isAccepted).toBe(true);
      });

      it('should get token balance', async () => {
        // 1000 tokens
        mockProvider.request.mockResolvedValue('0x00000000000000000000000000000000000000000000000000000000000003e8');

        const { result } = renderHook(() => useContractInteraction());

        let balance;
        await act(async () => {
          balance = await result.current.getTokenBalance('0xOwnerAddress', 1);
        });

        expect(balance).toBe(BigInt(1000));
      });

      it('should return 0 balance when call fails', async () => {
        mockProvider.request.mockResolvedValue(null);

        const { result } = renderHook(() => useContractInteraction());

        let balance;
        await act(async () => {
          balance = await result.current.getTokenBalance('0xOwnerAddress', 1);
        });

        expect(balance).toBe(BigInt(0));
      });

      it('should get total supply', async () => {
        mockProvider.request.mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000002710');

        const { result } = renderHook(() => useContractInteraction());

        let supply;
        await act(async () => {
          supply = await result.current.getTotalSupply(1);
        });

        expect(supply).toBe(BigInt(10000));
      });
    });

    describe('Error handling', () => {
      it('should handle transaction failure (null response)', async () => {
        mockProvider.request.mockResolvedValue(null);

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.pausePropertyToken();
        });

        expect(response).toEqual({ success: false, error: 'Transacción fallida' });
      });

      it('should handle provider errors', async () => {
        mockProvider.request.mockRejectedValue(new Error('User rejected transaction'));

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.pausePropertyToken();
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe('User rejected transaction');
      });

      it('should handle unknown errors', async () => {
        mockProvider.request.mockRejectedValue('Unknown error');

        const { result } = renderHook(() => useContractInteraction());

        let response;
        await act(async () => {
          response = await result.current.pausePropertyToken();
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe('Error desconocido');
      });

      it('should handle read call errors gracefully', async () => {
        mockProvider.request.mockRejectedValue(new Error('Call failed'));

        const { result } = renderHook(() => useContractInteraction());

        let isPaused;
        await act(async () => {
          isPaused = await result.current.isPropertyTokenPaused();
        });

        expect(isPaused).toBe(false);
      });
    });
  });

});
