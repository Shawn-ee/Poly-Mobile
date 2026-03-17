import { prisma } from "../src/lib/db";
import {
  applyDeposit,
  applyFill,
  createWithdrawalRequest,
  getOrCreateUserBalance,
  lockFundsForOrder,
  unlockFundsForCancel,
} from "../src/server/services/ledger";

async function main() {
  const runId = Date.now().toString();
  const user = await prisma.user.create({
    data: {
      username: `phase3_sanity_${runId}`,
      email: `phase3_sanity_${runId}@example.test`,
    },
  });

  await getOrCreateUserBalance(user.id);

  await applyDeposit({
    eventKey: `sanity:${runId}:deposit`,
    userId: user.id,
    amount: "100",
    chainId: 8453,
    txHash: `sanity-deposit-${runId}`,
    logIndex: 0,
    token: "USDC",
    referenceType: "SanityScript",
    referenceId: runId,
  });

  await lockFundsForOrder({
    orderId: `sanity-order-${runId}`,
    userId: user.id,
    amount: "40",
  });

  await unlockFundsForCancel({
    orderId: `sanity-order-${runId}`,
    userId: user.id,
    amount: "10",
  });

  await applyFill({
    fillId: `sanity-fill-${runId}`,
    orderId: `sanity-order-${runId}`,
    userId: user.id,
    costUSDC: "20",
  });

  await createWithdrawalRequest({
    withdrawalRequestId: `sanity-withdrawal-${runId}`,
    userId: user.id,
    amount: "30",
  });

  const balance = await prisma.userBalance.findUniqueOrThrow({
    where: { userId: user.id },
  });
  const ledgerCount = await prisma.ledgerEntry.count({
    where: { userId: user.id },
  });

  console.log(
    JSON.stringify(
      {
        userId: user.id,
        availableUSDC: balance.availableUSDC.toFixed(6),
        lockedUSDC: balance.lockedUSDC.toFixed(6),
        totalUSDC: balance.availableUSDC.add(balance.lockedUSDC).toFixed(6),
        ledgerEntryCount: ledgerCount,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
