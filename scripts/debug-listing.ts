import { ethers } from 'ethers';

const MARKETPLACE_ADDRESS = '0x205969FB45AC1992Ca1c99839e57297EF4C057d6';
const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS || '';
const YOUR_WALLET = '0x928a4f3231056b8081E0BdD1F83A07fC446f6CD0';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function isApprovedForAll(address account, address operator) view returns (bool)'
];

const MARKETPLACE_ABI = [
  'function isPaymentTokenAccepted(address token) view returns (bool)',
  'function propertyToken() view returns (address)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

  console.log('=== DEBUG LISTING ===\n');

  // Check property token address
  const propertyTokenAddr = await marketplace.propertyToken();
  console.log('PropertyToken en contrato:', propertyTokenAddr);
  console.log('PropertyToken en .env:', PROPERTY_TOKEN_ADDRESS);
  console.log('Match:', propertyTokenAddr.toLowerCase() === PROPERTY_TOKEN_ADDRESS.toLowerCase());

  const propertyToken = new ethers.Contract(propertyTokenAddr, ERC1155_ABI, provider);

  // Check balances for tokens 1, 2, 3
  console.log('\n--- Balances de tu wallet ---');
  for (const tokenId of [1, 2, 3]) {
    const balance = await propertyToken.balanceOf(YOUR_WALLET, tokenId);
    console.log(`Token ${tokenId}: ${balance.toString()} tokens`);
  }

  // Check approval
  console.log('\n--- Approval status ---');
  const isApproved = await propertyToken.isApprovedForAll(YOUR_WALLET, MARKETPLACE_ADDRESS);
  console.log(`Marketplace approved: ${isApproved}`);

  // Check payment tokens
  console.log('\n--- Payment tokens aceptados ---');
  const usdtAccepted = await marketplace.isPaymentTokenAccepted(USDT_ADDRESS);
  console.log(`USDT (${USDT_ADDRESS}): ${usdtAccepted}`);
}

main().catch(console.error);
