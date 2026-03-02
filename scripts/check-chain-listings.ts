import { ethers } from 'ethers';

const MARKETPLACE_ADDRESS = '0x205969FB45AC1992Ca1c99839e57297EF4C057d6';
const YOUR_WALLET = '0x928a4f3231056b8081E0BdD1F83A07fC446f6CD0';
const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const MARKETPLACE_ABI = [
  'function getListing(uint256 listingId) view returns (tuple(address seller, uint256 propertyId, uint256 amount, uint256 pricePerToken, address paymentToken, bool active))',
  'function getSellerListings(address seller) view returns (uint256[])',
  'function getActiveListingsCount() view returns (uint256)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

  try {
    // Check active listings count
    const activeCount = await marketplace.getActiveListingsCount();
    console.log('Total listings activos en blockchain:', activeCount.toString());

    // Check seller listings for your wallet
    const sellerListings = await marketplace.getSellerListings(YOUR_WALLET);
    console.log(`\nListings de tu wallet (${YOUR_WALLET}):`);
    console.log('IDs:', sellerListings.map((id: bigint) => id.toString()));

    // Get details of each listing
    for (const listingId of sellerListings) {
      try {
        const listing = await marketplace.getListing(listingId);
        console.log(`\nListing ${listingId}:`);
        console.log(`  seller: ${listing.seller}`);
        console.log(`  propertyId: ${listing.propertyId}`);
        console.log(`  amount: ${listing.amount}`);
        console.log(`  pricePerToken: ${ethers.formatUnits(listing.pricePerToken, 6)} USDT`);
        console.log(`  active: ${listing.active}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.log(`Listing ${listingId}: Error - ${msg}`);
      }
    }

    // Also check listings 1, 2, 3 from DB
    console.log('\n--- Verificando listings 1, 2, 3 de la DB ---');
    for (const id of [1, 2, 3]) {
      try {
        const listing = await marketplace.getListing(id);
        console.log(`\nListing ${id}:`);
        console.log(`  seller: ${listing.seller}`);
        console.log(`  propertyId: ${listing.propertyId}`);
        console.log(`  amount: ${listing.amount}`);
        console.log(`  active: ${listing.active}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.log(`Listing ${id}: Error - ${msg}`);
      }
    }

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.log('Error:', msg);
  }
}

main();
