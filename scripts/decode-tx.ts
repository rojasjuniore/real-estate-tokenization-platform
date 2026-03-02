import { ethers } from 'ethers';

const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const TX_HASH = '0x06602e4ab641377ecf5ac79b4eae0cd4c0621b328e225de7f7dc5804633c895b';

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const tx = await provider.getTransaction(TX_HASH);

  if (!tx) {
    console.log('Transaction not found');
    return;
  }

  console.log('=== DECODING FAILED TRANSACTION ===\n');
  console.log('To:', tx.to);
  console.log('From:', tx.from);
  console.log('Data:', tx.data);
  console.log('');

  // Decode the data
  // createListing(uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken)
  // Selector: 0x3de8fa8e

  const data = tx.data;
  const selector = data.slice(0, 10);
  console.log('Function selector:', selector);

  if (selector === '0x3de8fa8e') {
    const params = data.slice(10);
    const propertyId = BigInt('0x' + params.slice(0, 64));
    const amount = BigInt('0x' + params.slice(64, 128));
    const pricePerToken = BigInt('0x' + params.slice(128, 192));
    const paymentToken = '0x' + params.slice(192 + 24, 256); // address is 20 bytes, padded to 32

    console.log('\nDecoded params:');
    console.log('  propertyId:', propertyId.toString());
    console.log('  amount:', amount.toString());
    console.log('  pricePerToken:', pricePerToken.toString());
    console.log('  pricePerToken (USDT):', Number(pricePerToken) / 1_000_000, 'USDT');
    console.log('  paymentToken:', paymentToken);

    // Check if payment token is valid
    const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase();
    console.log('\n  Expected USDT:', USDT_ADDRESS);
    console.log('  Match:', paymentToken.toLowerCase() === USDT_ADDRESS);
  }
}

main().catch(console.error);
