import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== RESETTING TABLES ===\n');

  // Delete in order due to foreign keys
  console.log('Deleting DividendClaim...');
  const deletedClaims = await prisma.dividendClaim.deleteMany({});
  console.log(`  Deleted ${deletedClaims.count} claims`);

  console.log('Deleting Dividend...');
  const deletedDividends = await prisma.dividend.deleteMany({});
  console.log(`  Deleted ${deletedDividends.count} dividends`);

  console.log('Deleting Transaction...');
  const deletedTransactions = await prisma.transaction.deleteMany({});
  console.log(`  Deleted ${deletedTransactions.count} transactions`);

  console.log('Deleting Portfolio...');
  const deletedPortfolios = await prisma.portfolio.deleteMany({});
  console.log(`  Deleted ${deletedPortfolios.count} portfolios`);

  console.log('\n=== DONE ===');
  console.log('Tables reset: DividendClaim, Dividend, Transaction, Portfolio');
}

main().catch(console.error).finally(() => prisma.$disconnect());
