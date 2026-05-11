import { Prisma, PrismaClient } from '@prisma/client';
import { applyDeposit } from '@/server/services/ledger';
import { CUSTODY_LEDGER_OPERATIONS } from '@/server/services/ledgerCustodyOps';

const prisma = new PrismaClient();
const ZERO = new Prisma.Decimal(0);

async function getLedgerRows() {
  return prisma.$queryRaw<Array<{ userId: string; ledgerAvailable: Prisma.Decimal; ledgerLocked: Prisma.Decimal }>>(
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
}

async function main() {
  const before = await getLedgerRows();
  let corrections = 0;

  for (const row of before) {
    if (row.ledgerAvailable.lt(ZERO)) {
      const correction = row.ledgerAvailable.abs();
      await applyDeposit({
        eventKey: `repair-negative-ledger:${row.userId}`,
        userId: row.userId,
        amount: correction.toString(),
        chainId: 8453,
        txHash: `repair-negative-ledger-${row.userId}`,
        logIndex: 0,
        token: 'REPAIR_USDC',
        referenceType: 'BALANCE_REPAIR',
        referenceId: row.userId,
      });
      corrections += 1;
      console.log(`[repair_balance_state] corrected negative ledger user=${row.userId} amount=${correction.toString()}`);
    }
  }

  const after = await getLedgerRows();
  let synced = 0;
  for (const row of after) {
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
    synced += 1;
  }

  console.log(`[repair_balance_state] corrections=${corrections} synced=${synced}`);
}

main()
  .catch((err) => {
    console.error('[repair_balance_state] fatal', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
