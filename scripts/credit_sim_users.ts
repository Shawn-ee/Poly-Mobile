import { prisma } from '@/lib/db';
import { applyDeposit } from '@/server/services/ledger';

const amountArg = process.argv.find((x) => x.startsWith('--amount='));
const amount = amountArg ? amountArg.split('=')[1] : '1000';

async function main() {
  const simUsers = await prisma.user.findMany({
    where: {
      apiCredentials: {
        some: {
          name: { startsWith: 'sim-bot-' },
        },
      },
    },
    select: { id: true, username: true },
  });

  console.log(`[credit_sim_users] found ${simUsers.length} sim users`);
  for (const user of simUsers) {
    const eventKey = `manual-sim-topup:${user.id}:${Date.now()}`;
    await applyDeposit({
      eventKey,
      userId: user.id,
      amount,
      chainId: 8453,
      txHash: `manual-sim-topup-${user.id}-${Date.now()}`,
      logIndex: 0,
      token: 'FAUCET_USDC',
      referenceType: 'MANUAL_SIM_TOPUP',
      referenceId: user.id,
    });
    console.log(`[credit_sim_users] credited ${user.username} +${amount}`);
  }
}

main()
  .catch((err) => {
    console.error('[credit_sim_users] fatal', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
