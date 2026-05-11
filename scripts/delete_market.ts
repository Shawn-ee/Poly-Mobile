import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const marketId = process.argv[2];
  if (!marketId) throw new Error('Usage: npx tsx scripts/delete_market.ts <marketId>');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to delete market in production.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.fill.deleteMany({ where: { marketId } });
    await tx.trade.deleteMany({ where: { marketId } });
    await tx.order.deleteMany({ where: { marketId } });
    await tx.position.deleteMany({ where: { marketId } });
    await tx.outcome.deleteMany({ where: { marketId } });
    await tx.market.delete({ where: { id: marketId } });
  });

  console.log(`Deleted market ${marketId}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
