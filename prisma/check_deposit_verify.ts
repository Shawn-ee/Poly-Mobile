import { prisma } from "../src/lib/db";
import {
  DepositVerificationError,
  verifyUsdcDepositForUser,
} from "../src/lib/deposits/verifyUsdcDeposit";

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

async function getWalletBalance(userId: string) {
  const result = await prisma.ledgerEntry.aggregate({
    where: { userId },
    _sum: { amountDelta: true },
  });
  return result._sum.amountDelta ?? 0;
}

async function main() {
  const txHash = (process.env.TX_HASH ?? "").trim();
  const userIdEnv = (process.env.USER_ID ?? "").trim();
  const userEmailEnv = (process.env.USER_EMAIL ?? "").trim().toLowerCase();

  if (!txHash || !TX_HASH_REGEX.test(txHash)) {
    throw new Error("TX_HASH is required and must be a 0x + 64 hex transaction hash.");
  }
  if (!userIdEnv && !userEmailEnv) {
    throw new Error("Set USER_ID or USER_EMAIL.");
  }

  const user = await prisma.user.findFirst({
    where: userIdEnv ? { id: userIdEnv } : { email: userEmailEnv },
    select: {
      id: true,
      email: true,
      username: true,
      wallets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, address: true, chainId: true, createdAt: true },
      },
    },
  });

  if (!user) {
    throw new Error("User not found for provided USER_ID/USER_EMAIL.");
  }

  const balanceBefore = await getWalletBalance(user.id);

  console.log("User");
  console.log(`- id: ${user.id}`);
  console.log(`- email: ${user.email ?? "(none)"}`);
  console.log(`- username: ${user.username}`);
  console.log("- linked wallets (newest first):");
  if (user.wallets.length === 0) {
    console.log("  (none)");
  } else {
    for (const wallet of user.wallets) {
      console.log(
        `  - ${wallet.address} | chainId=${wallet.chainId} | createdAt=${wallet.createdAt.toISOString()}`
      );
    }
  }
  console.log(`Balance before: ${balanceBefore}`);

  try {
    const result = await verifyUsdcDepositForUser({
      userId: user.id,
      txHash,
    });

    console.log("\nVerification");
    console.log(`- network chainId: ${result.networkChainId}`);
    console.log(`- expected chainId: ${result.chainId}`);
    console.log(`- receipt.status: ${result.receiptStatus}`);
    console.log(`- receipt.blockNumber: ${result.blockNumber}`);
    console.log(`- confirmations: ${result.confirmations}`);

    console.log("\nMatched USDC transfers to PROJECT_DEPOSIT_ADDRESS");
    for (const transfer of result.matchedTransfers) {
      const status = result.creditedTransfers.some((item) => item.logIndex === transfer.logIndex)
        ? "credited"
        : "already-credited";
      console.log(
        `- logIndex=${transfer.logIndex} from=${transfer.from} to=${transfer.to} amount=${transfer.amountDecimal} (${status})`
      );
    }

    const balanceAfter = await getWalletBalance(user.id);
    console.log("\nSummary");
    console.log(`- txHash: ${result.txHash}`);
    console.log(`- credited: ${result.credited}`);
    console.log(`- totalMatchedAmount: ${result.totalMatchedAmount}`);
    console.log(`- newlyCreditedAmount: ${result.creditedAmount}`);
    console.log(`- matchedCount: ${result.matchedTransfers.length}`);
    console.log(`- creditedCount: ${result.creditedTransfers.length}`);
    console.log(`- alreadyCreditedCount: ${result.alreadyCreditedTransfers.length}`);
    console.log(`- depositEventIds: ${result.depositEventIds.join(", ")}`);
    console.log(`- balance after: ${balanceAfter}`);
  } catch (error) {
    if (error instanceof DepositVerificationError) {
      console.error(`Verification failed [${error.status}]: ${error.message}`);
      return;
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
