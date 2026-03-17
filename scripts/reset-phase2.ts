import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toInt = (value: string | number | bigint | null | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
};

async function tableExists(tx: Prisma.TransactionClient, tableName: string) {
  const rows = await tx.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass(${tableName}) IS NOT NULL AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function countAndDeleteRawTable(
  tx: Prisma.TransactionClient,
  tableName: string
) {
  const exists = await tableExists(tx, tableName);
  if (!exists) {
    return { count: 0, existed: false };
  }

  const countRows = await tx.$queryRawUnsafe<Array<{ count: string }>>(
    `SELECT COUNT(*)::int AS count FROM ${tableName}`
  );
  await tx.$executeRawUnsafe(`DELETE FROM ${tableName}`);

  return {
    count: toInt(countRows[0]?.count),
    existed: true,
  };
}

async function run() {
  const results: Record<string, number> = {};

  await prisma.$transaction(async (tx) => {
    // Break optional owner FK from Market -> User before deleting users.
    results.marketOwnerCleared = (
      await tx.market.updateMany({
        where: { ownerId: { not: null } },
        data: { ownerId: null },
      })
    ).count;

    // Child/user-dependent data first to avoid FK violations.
    results.position = (await tx.position.deleteMany({})).count;
    results.trade = (await tx.trade.deleteMany({})).count;
    results.poolBet = (await tx.poolBet.deleteMany({})).count;
    results.ledgerEntry = (await tx.ledgerEntry.deleteMany({})).count;
    results.ledgerTransaction = (await tx.ledgerTransaction.deleteMany({})).count;
    results.depositIntent = (await tx.depositIntent.deleteMany({})).count;
    results.chainDepositEvent = (await tx.chainDepositEvent.deleteMany({})).count;
    results.walletNonce = (await tx.walletNonce.deleteMany({})).count;
    results.wallet = (await tx.wallet.deleteMany({})).count;
    results.account = (await tx.account.deleteMany({})).count;

    // NextAuth Session table may exist even if not modeled in Prisma schema.
    const sessionResult = await countAndDeleteRawTable(tx, `"Session"`);
    results.session = sessionResult.count;

    // Parent row last.
    results.user = (await tx.user.deleteMany({})).count;
  });

  console.log("Phase 2 reset complete.");
  console.log("Deleted rows:");
  console.log(`- Wallet: ${results.wallet ?? 0}`);
  console.log(`- ChainDepositEvent: ${results.chainDepositEvent ?? 0}`);
  console.log(`- LedgerEntry: ${results.ledgerEntry ?? 0}`);
  console.log(`- Account: ${results.account ?? 0}`);
  console.log(`- Session: ${results.session ?? 0}`);
  console.log(`- User: ${results.user ?? 0}`);
  console.log("Additional dependent cleanup:");
  console.log(`- WalletNonce: ${results.walletNonce ?? 0}`);
  console.log(`- LedgerTransaction: ${results.ledgerTransaction ?? 0}`);
  console.log(`- DepositIntent: ${results.depositIntent ?? 0}`);
  console.log(`- Position: ${results.position ?? 0}`);
  console.log(`- Trade: ${results.trade ?? 0}`);
  console.log(`- PoolBet: ${results.poolBet ?? 0}`);
  console.log(`- Market ownerId nulled: ${results.marketOwnerCleared ?? 0}`);
}

run()
  .catch((error) => {
    console.error("Phase 2 reset failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
