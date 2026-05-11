import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const negatives = await prisma.$queryRaw<Array<{ userId: string; ledgerAvailable: string; ledgerLocked: string }>>`
    SELECT
      "userId",
      COALESCE(SUM(COALESCE("deltaAvailableUSDC", 0)), 0)::text AS "ledgerAvailable",
      COALESCE(SUM(COALESCE("deltaLockedUSDC", 0)), 0)::text AS "ledgerLocked"
    FROM "LedgerEntry"
    GROUP BY "userId"
    HAVING COALESCE(SUM(COALESCE("deltaAvailableUSDC", 0)), 0) < 0
    ORDER BY COALESCE(SUM(COALESCE("deltaAvailableUSDC", 0)), 0) ASC
    LIMIT 10
  `;

  console.log('[trace_negative_ledger_users] negative users', negatives);

  for (const row of negatives) {
    const user = await prisma.user.findUnique({
      where: { id: row.userId },
      select: { id: true, username: true, email: true },
    });

    const entries = await prisma.ledgerEntry.findMany({
      where: { userId: row.userId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        createdAt: true,
        operation: true,
        reason: true,
        referenceType: true,
        referenceId: true,
        amountDelta: true,
        deltaAvailableUSDC: true,
        deltaLockedUSDC: true,
        idempotencyKey: true,
      },
    });

    console.log('\n=== USER ===');
    console.log({ user, ledgerAvailable: row.ledgerAvailable, ledgerLocked: row.ledgerLocked });
    let runningAvailable = 0;
    let runningLocked = 0;
    for (const e of entries) {
      runningAvailable += Number(e.deltaAvailableUSDC ?? 0);
      runningLocked += Number(e.deltaLockedUSDC ?? 0);
      console.log({
        createdAt: e.createdAt,
        operation: e.operation,
        reason: e.reason,
        referenceType: e.referenceType,
        referenceId: e.referenceId,
        deltaAvailableUSDC: String(e.deltaAvailableUSDC),
        deltaLockedUSDC: String(e.deltaLockedUSDC),
        runningAvailable,
        runningLocked,
        idempotencyKey: e.idempotencyKey,
      });
    }
  }
}

main()
  .catch((err) => {
    console.error('[trace_negative_ledger_users] fatal', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
