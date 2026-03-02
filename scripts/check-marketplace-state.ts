import { ethers } from 'ethers';

const MARKETPLACE_ADDRESS = '0x205969FB45AC1992Ca1c99839e57297EF4C057d6';
const PROPERTY_TOKEN_ADDRESS = '0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0';
const YOUR_WALLET = '0x928a4f3231056b8081E0BdD1F83A07fC446f6CD0';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const MARKETPLACE_ABI = [
  'function paused() view returns (bool)',
  'function propertyToken() view returns (address)',
  'function isPaymentTokenAccepted(address) view returns (bool)',
  'function treasury() view returns (address)',
  'function marketplaceFee() view returns (uint96)'
];

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function isApprovedForAll(address account, address operator) view returns (bool)'
];

const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const propertyToken = new ethers.Contract(PROPERTY_TOKEN_ADDRESS, ERC1155_ABI, provider);

  console.log('=== MARKETPLACE STATE ===\n');

  // Check if paused
  const paused = await marketplace.paused();
  console.log('Marketplace paused:', paused);

  // Check property token address configured
  const configuredToken = await marketplace.propertyToken();
  console.log('Configured PropertyToken:', configuredToken);
  console.log('Expected PropertyToken:', PROPERTY_TOKEN_ADDRESS);
  console.log('Match:', configuredToken.toLowerCase() === PROPERTY_TOKEN_ADDRESS.toLowerCase());

  // Check treasury
  const treasury = await marketplace.treasury();
  console.log('Treasury:', treasury);

  // Check fee
  const fee = await marketplace.marketplaceFee();
  console.log('Marketplace fee:', fee.toString(), 'basis points');

  // Check USDT accepted
  const usdtAccepted = await marketplace.isPaymentTokenAccepted(USDT_ADDRESS);
  console.log('USDT accepted:', usdtAccepted);

  console.log('\n=== YOUR WALLET STATE ===\n');

  // Check approval - THIS IS CRITICAL
  const isApproved = await propertyToken.isApprovedForAll(YOUR_WALLET, MARKETPLACE_ADDRESS);
  console.log('Marketplace approved for your wallet:', isApproved);

  // Check balances
  for (const tokenId of [1, 2, 3]) {
    const balance = await propertyToken.balanceOf(YOUR_WALLET, tokenId);
    console.log(`Token ${tokenId} balance:`, balance.toString());
  }

  // Try to simulate the exact call
  console.log('\n=== SIMULATING createListing ===\n');

  const iface = new ethers.Interface([
    'function createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken) returns (uint256)'
  ]);

  const calldata = iface.encodeFunctionData('createListing', [
    3,          // propertyId
    1,          // amount
    1000000,    // pricePerToken (1 USDT)
    USDT_ADDRESS
  ]);

  console.log('Calldata:', calldata);

  try {
    const result = await provider.call({
      from: YOUR_WALLET,
      to: MARKETPLACE_ADDRESS,
      data: calldata
    });
    console.log('Simulation result:', result);
    if (result && result !== '0x') {
      const listingId = ethers.toBigInt(result);
      console.log('Would create listing ID:', listingId.toString());
    }
  } catch (error: unknown) {
    console.log('Simulation FAILED!');
    if (error instanceof Error) {
      console.log('Error:', error.message);

      // Try to get more details
      const errAny = error as { data?: string; error?: { data?: string } };
      if (errAny.data) {
        console.log('Error data:', errAny.data);
      }
      if (errAny.error?.data) {
        console.log('Inner error data:', errAny.error.data);
      }
    }
  }
}

main().catch(console.error);
