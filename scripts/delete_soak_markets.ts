import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to delete soak markets in production.');
  }

  const markets = await prisma.market.findMany({
    where: { title: { startsWith: 'HTTP Soak Market' } },
    select: { id: true, title: true },
  });

  console.log(`Found ${markets.length} soak markets`);

  for (const market of markets) {
    await prisma.$transaction(async (tx) => {
      await tx.fill.deleteMany({ where: { marketId: market.id } });
      await tx.trade.deleteMany({ where: { marketId: market.id } });
      await tx.order.deleteMany({ where: { marketId: market.id } });
      await tx.position.deleteMany({ where: { marketId: market.id } });
      await tx.outcome.deleteMany({ where: { marketId: market.id } });
      await tx.market.delete({ where: { id: market.id } });
    });
    console.log(`Deleted soak market ${market.id} :: ${market.title}`);
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
