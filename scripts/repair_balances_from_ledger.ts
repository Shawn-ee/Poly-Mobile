import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { CUSTODY_LEDGER_OPERATIONS } from '@/server/services/ledgerCustodyOps';

async function main() {
  const ledgerRows = await prisma.$queryRaw<
    Array<{
      userId: string;
      ledgerAvailable: Prisma.Decimal;
      ledgerLocked: Prisma.Decimal;
    }>
  >(
    Prisma.sql`
      SELECT
        "userId",
        COALESCE(SUM(COALESCE("deltaAvailableUSDC", 0)), 0) AS "ledgerAvailable",
        COALESCE(SUM(COALESCE("deltaLockedUSDC", 0)), 0) AS "ledgerLocked"
      FROM "LedgerEntry"
      WHERE "operation" IN (${Prisma.join(
        CUSTODY_LEDGER_OPERATIONS.map((v) => Prisma.sql`${v}::"LedgerOperation"`)
      )})
      GROUP BY "userId"
    `
  );

  let updated = 0;
  for (const row of ledgerRows) {
    await prisma.userBalance.upsert({
      where: { userId: row.userId },
      update: {
        availableUSDC: row.ledgerAvailable,
        lockedUSDC: row.ledgerLocked,
      },
      create: {
        userId: row.userId,
        availableUSDC: row.ledgerAvailable,
        lockedUSDC: row.ledgerLocked,
      },
    });
    updated += 1;
  }

  console.log(`[repair_balances_from_ledger] updated ${updated} user balance rows from ledger`);
}

main()
  .catch((err) => {
    console.error('[repair_balances_from_ledger] fatal', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
