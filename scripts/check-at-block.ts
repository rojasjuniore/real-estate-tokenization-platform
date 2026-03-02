import { ethers } from 'ethers';

const MARKETPLACE_ADDRESS = '0x205969FB45AC1992Ca1c99839e57297EF4C057d6';
const PROPERTY_TOKEN_ADDRESS = '0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0';
const YOUR_WALLET = '0x928a4f3231056b8081E0BdD1F83A07fC446f6CD0';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const BLOCK_NUMBER = 0x4cdda3c; // Block where tx failed

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function isApprovedForAll(address account, address operator) view returns (bool)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const propertyToken = new ethers.Contract(PROPERTY_TOKEN_ADDRESS, ERC1155_ABI, provider);

  console.log('=== CHECKING STATE AT BLOCK', BLOCK_NUMBER, '===\n');

  // Check approval at that block
  const isApproved = await propertyToken.isApprovedForAll(YOUR_WALLET, MARKETPLACE_ADDRESS, {
    blockTag: BLOCK_NUMBER - 1  // Check 1 block before the failed tx
  });
  console.log('Marketplace approved (before tx):', isApproved);

  // Check balance at that block
  const balance = await propertyToken.balanceOf(YOUR_WALLET, 3, {
    blockTag: BLOCK_NUMBER - 1
  });
  console.log('Balance of token 3 (before tx):', balance.toString());
}

main().catch(console.error);
