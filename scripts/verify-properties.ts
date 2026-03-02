import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany({
    select: {
      tokenId: true,
      name: true,
      pricePerFraction: true,
      totalFractions: true,
      status: true,
    },
  });

  console.log("\n=== Propiedades en Base de Datos ===\n");
  console.table(properties.map(p => ({
    tokenId: p.tokenId,
    name: p.name,
    precio: `$${p.pricePerFraction}`,
    fracciones: p.totalFractions,
    status: p.status,
  })));

  await prisma.$disconnect();
}

main();
