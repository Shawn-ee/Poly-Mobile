import { prisma } from '@/lib/db';

async function main() {
  const result = await prisma.apiCredential.updateMany({
    where: {
      name: { startsWith: 'sim-bot-' },
    },
    data: {
      maxDailySubmittedNotional: null,
    },
  });
  console.log(`[clear_sim_daily_notional_caps] updated ${result.count} api credentials`);
}

main()
  .catch((err) => {
    console.error('[clear_sim_daily_notional_caps] fatal', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
