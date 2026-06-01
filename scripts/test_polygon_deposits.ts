import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function createUser(prefix: string) {
  return prisma.user.create({
    data: {
      username: `${prefix}_${randomUUID().slice(0, 8)}`,
      email: `${prefix}_${randomUUID().slice(0, 8)}@deposit.test`,
    },
  });
}

async function buildAddressMap(userId: string) {
  const { ensurePolygonUsdcDepositAddress } = await import(
    "../src/lib/wallets/userDepositAddresses"
  );
  const address = await ensurePolygonUsdcDepositAddress(userId);
  return new Map([[address.address, { depositAddressId: address.id, userId }]]);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run Polygon deposit test script in production.");
  }

  process.env.DEPOSIT_WALLET_ENCRYPTION_KEY =
    process.env.DEPOSIT_WALLET_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  process.env.POLYGON_USDC_ADDRESS =
    process.env.POLYGON_USDC_ADDRESS || "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

  const { resetPublicSchema } = await import("../src/server/services/__tests__/dbTestUtils");
  const { creditPolygonDepositIfEligible, ingestObservedDepositTransfer } = await import(
    "../src/lib/deposits/polygonDeposits"
  );
  const { getNormalizedPolygonUsdcAddress } = await import(
    "../src/lib/blockchain/polygonUsdc"
  );

  await resetPublicSchema();
  const user = await createUser("polygon_deposit");
  const addressMap = await buildAddressMap(user.id);
  const depositAddress = [...addressMap.keys()][0]!;
  const tokenAddress = getNormalizedPolygonUsdcAddress();

  const pendingTransfer = {
    txHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    logIndex: 1,
    blockNumber: 100,
    fromAddress: "0x0000000000000000000000000000000000000001",
    toAddress: depositAddress,
    amountRaw: "5000000",
    amountDecimal: "5",
  };

  const detected = await ingestObservedDepositTransfer({
    chainId: 137,
    tokenAddress,
    transfer: pendingTransfer,
    currentBlock: 105,
    userAddressMap: addressMap,
  });
  assert(detected.matched, "successful deposit should match deposit address");
  let deposit = await prisma.deposit.findFirstOrThrow({ where: { txHash: pendingTransfer.txHash.toLowerCase() } });
  assert(deposit.status === "CONFIRMING", `expected CONFIRMING before enough blocks, got ${deposit.status}`);

  await creditPolygonDepositIfEligible({
    depositId: deposit.id,
    confirmations: 25,
  });

  deposit = await prisma.deposit.findUniqueOrThrow({ where: { id: deposit.id } });
  assert(deposit.status === "CREDITED", `expected CREDITED, got ${deposit.status}`);

  const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
  assert(Number(balance.availableUSDC) === 5, `expected credited balance 5, got ${balance.availableUSDC}`);

  const duplicate = await ingestObservedDepositTransfer({
    chainId: 137,
    tokenAddress,
    transfer: pendingTransfer,
    currentBlock: 125,
    userAddressMap: addressMap,
  });
  assert(duplicate.matched, "repeat scanner execution should still match");
  const depositCount = await prisma.deposit.count();
  assert(depositCount === 1, `duplicate tx/log should not create extra deposits, got ${depositCount}`);
  const ledgerCount = await prisma.ledgerEntry.count({ where: { userId: user.id, reason: "DEPOSIT" } });
  assert(ledgerCount === 1, `duplicate tx/log should not credit ledger twice, got ${ledgerCount}`);

  const belowMinimumTransfer = {
    txHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    logIndex: 0,
    blockNumber: 130,
    fromAddress: "0x0000000000000000000000000000000000000002",
    toAddress: depositAddress,
    amountRaw: "1000000",
    amountDecimal: "1",
  };
  const belowMinimum = await ingestObservedDepositTransfer({
    chainId: 137,
    tokenAddress,
    transfer: belowMinimumTransfer,
    currentBlock: 200,
    userAddressMap: addressMap,
  });
  assert(belowMinimum.matched, "below minimum transfer should still be tracked");
  const ignored = await prisma.deposit.findFirstOrThrow({ where: { txHash: belowMinimumTransfer.txHash.toLowerCase() } });
  assert(ignored.status === "IGNORED", `expected IGNORED below minimum, got ${ignored.status}`);

  const unsupportedToken = await ingestObservedDepositTransfer({
    chainId: 137,
    tokenAddress: "0x000000000000000000000000000000000000dead",
    transfer: {
      ...pendingTransfer,
      txHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
      logIndex: 2,
    },
    currentBlock: 150,
    userAddressMap: addressMap,
  });
  assert(unsupportedToken.status === "unsupported_token", "unsupported token should be rejected");

  const wrongChain = await ingestObservedDepositTransfer({
    chainId: 8453,
    tokenAddress,
    transfer: {
      ...pendingTransfer,
      txHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
      logIndex: 3,
    },
    currentBlock: 150,
    userAddressMap: addressMap,
  });
  assert(wrongChain.status === "wrong_chain", "wrong chain should be rejected");

  const alreadyCredited = await creditPolygonDepositIfEligible({
    depositId: deposit.id,
    confirmations: 40,
  });
  assert(alreadyCredited.reason === "already_credited", "already credited deposit should be idempotent");

  console.log("Polygon deposit tests passed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
