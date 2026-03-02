import { ethers } from 'ethers';

const MARKETPLACE_ADDRESS = '0x205969FB45AC1992Ca1c99839e57297EF4C057d6';
const YOUR_WALLET = '0x928a4f3231056b8081E0BdD1F83A07fC446f6CD0';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const MARKETPLACE_ABI = [
  'function createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken) returns (uint256)',
  'function isPaymentTokenAccepted(address token) view returns (bool)',
  'function propertyToken() view returns (address)'
];

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function isApprovedForAll(address account, address operator) view returns (bool)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

  // Test params - listing token 3, amount 1, price 1 USDT (same as failed tx)
  const propertyId = 3;
  const amount = 1;
  const pricePerToken = 1_000_000; // 1 USDT (6 decimals)
  const paymentToken = USDT_ADDRESS;

  console.log('=== SIMULATING createListing ===\n');
  console.log('Params:');
  console.log('  propertyId:', propertyId);
  console.log('  amount:', amount);
  console.log('  pricePerToken:', pricePerToken, '(1 USDT)');
  console.log('  paymentToken:', paymentToken);
  console.log('');

  // Check property token and balance
  const propertyTokenAddr = await marketplace.propertyToken();
  console.log('PropertyToken address:', propertyTokenAddr);

  const propertyToken = new ethers.Contract(propertyTokenAddr, ERC1155_ABI, provider);
  const balance = await propertyToken.balanceOf(YOUR_WALLET, propertyId);
  console.log('Your balance of token', propertyId + ':', balance.toString());

  const isApproved = await propertyToken.isApprovedForAll(YOUR_WALLET, MARKETPLACE_ADDRESS);
  console.log('Marketplace approved:', isApproved);

  const isAccepted = await marketplace.isPaymentTokenAccepted(paymentToken);
  console.log('Payment token accepted:', isAccepted);

  console.log('\n--- Simulating transaction (staticCall) ---');

  try {
    // Try to call the function as a static call (simulation)
    const result = await marketplace.createListing.staticCall(
      propertyId,
      amount,
      pricePerToken,
      paymentToken,
      { from: YOUR_WALLET }
    );
    console.log('Simulation SUCCESS! Listing ID would be:', result.toString());
  } catch (error: unknown) {
    console.log('\nSimulation FAILED!');
    if (error instanceof Error) {
      console.log('Error message:', error.message);

      // Try to decode the error
      const errData = (error as { data?: string }).data;
      if (errData) {
        console.log('Error data:', errData);

        // Common error signatures
        const errors: Record<string, string> = {
          '0x': 'Empty revert (require failed)',
          '0x08c379a0': 'Error(string)',
          '0x4e487b71': 'Panic(uint256)',
        };

        const sig = errData.slice(0, 10);
        if (errors[sig]) {
          console.log('Error type:', errors[sig]);
        }
      }
    }
  }
}

main().catch(console.error);
