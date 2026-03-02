import { prisma } from '../src/lib/prisma';

async function main() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: { name: true, tokenId: true }
      }
    }
  });

  console.log('=== LISTINGS EN LA BASE DE DATOS ===\n');

  if (listings.length === 0) {
    console.log('No hay listings en la base de datos.');
  } else {
    listings.forEach((listing, i) => {
      console.log(`${i + 1}. ID: ${listing.id}`);
      console.log(`   Propiedad: ${listing.property.name} (tokenId: ${listing.property.tokenId})`);
      console.log(`   Vendedor: ${listing.seller}`);
      console.log(`   Cantidad: ${listing.amount} tokens`);
      console.log(`   Precio: $${listing.pricePerToken}`);
      console.log(`   Status: ${listing.status}`);
      console.log(`   onChainListingId: ${listing.onChainListingId || 'NULL (no firmado)'}`);
      console.log(`   txHash: ${listing.txHash || 'NULL'}`);
      console.log(`   approvalTxHash: ${listing.approvalTxHash || 'NULL'}`);
      console.log(`   Creado: ${listing.createdAt}`);
      console.log('');
    });
  }

  console.log(`Total: ${listings.length} listings`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
