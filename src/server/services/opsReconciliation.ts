import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CUSTODY_LEDGER_OPERATIONS } from "@/server/services/ledgerCustodyOps";
import { getPublicBinaryInvariantState } from "@/server/services/orderbookCollateral";

const ZERO = new Prisma.Decimal(0);
const EPS = new Prisma.Decimal("0.000001");
type BalanceMismatch = {
  userId: string;
  ledgerAvailable: string;
  ledgerLocked: string;
  storedAvailable: string;
  storedLocked: string;
  reason: string;
};

type MarketMismatch = {
  marketId: string;
  reason: string;
  summary?: string;
};

type WithdrawalMismatch = {
  requestId?: string;
  userId?: string;
  reason: string;
};

const neq = (a: Prisma.Decimal, b: Prisma.Decimal) => a.sub(b).abs().gt(EPS);

export async function reconcileBalances() {
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

  const balances = await prisma.userBalance.findMany({
    select: { userId: true, availableUSDC: true, lockedUSDC: true },
  });
  const balanceByUser = new Map(balances.map((b) => [b.userId, b]));
  const mismatches: BalanceMismatch[] = [];

  for (const row of ledgerRows) {
    const stored = balanceByUser.get(row.userId);
    const storedAvailable = stored?.availableUSDC ?? ZERO;
    const storedLocked = stored?.lockedUSDC ?? ZERO;
    if (storedAvailable.lt(ZERO) || storedLocked.lt(ZERO)) {
      mismatches.push({
        userId: row.userId,
        ledgerAvailable: row.ledgerAvailable.toString(),
        ledgerLocked: row.ledgerLocked.toString(),
        storedAvailable: storedAvailable.toString(),
        storedLocked: storedLocked.toString(),
        reason: "negative stored balance",
      });
      continue;
    }
    if (neq(row.ledgerAvailable, storedAvailable) || neq(row.ledgerLocked, storedLocked)) {
      mismatches.push({
        userId: row.userId,
        ledgerAvailable: row.ledgerAvailable.toString(),
        ledgerLocked: row.ledgerLocked.toString(),
        storedAvailable: storedAvailable.toString(),
        storedLocked: storedLocked.toString(),
        reason: "ledger/userBalance mismatch",
      });
    }
  }

  return {
    pass: mismatches.length === 0,
    checkedUsers: ledgerRows.length,
    mismatches,
  };
}

export async function reconcilePublicMarkets() {
  const markets = await prisma.market.findMany({
    where: {
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      isCanceled: false,
      type: "BINARY",
    },
    select: { id: true, status: true },
  });

  const mismatches: MarketMismatch[] = [];
  for (const market of markets) {
    try {
      const state = await getPublicBinaryInvariantState(market.id);
      if (
        !state.bidInvariantPass ||
        !state.askInvariantPass ||
        !state.outstandingSharesEqual ||
        !state.collateralMatchesOutstanding
      ) {
        mismatches.push({
          marketId: market.id,
          reason: "binary invariant or collateral mismatch",
          summary: state.invariantStatusSummary,
        });
      }
    } catch (error) {
      mismatches.push({
        marketId: market.id,
        reason: error instanceof Error ? error.message : "failed to compute invariants",
      });
    }
  }

  return {
    pass: mismatches.length === 0,
    checkedMarkets: markets.length,
    mismatches,
  };
}

export async function reconcileWithdrawals() {
  const mismatches: WithdrawalMismatch[] = [];

  const pendingByUser = await prisma.withdrawalRequest.groupBy({
    by: ["userId"],
    where: { status: "PENDING" },
    _sum: { amountUSDC: true },
  });
  const lockedByUser = new Map(
    (
      await prisma.userBalance.findMany({
        select: { userId: true, lockedUSDC: true },
      })
    ).map((row) => [row.userId, row.lockedUSDC])
  );
  for (const row of pendingByUser) {
    const pending = row._sum.amountUSDC ?? ZERO;
    const locked = lockedByUser.get(row.userId) ?? ZERO;
    if (locked.add(EPS).lt(pending)) {
      mismatches.push({
        userId: row.userId,
        reason: `lockedUSDC ${locked.toString()} below pending withdrawals ${pending.toString()}`,
      });
    }
  }

  const invalidPending = await prisma.withdrawalRequest.findMany({
    where: {
      status: "PENDING",
      OR: [{ completedAt: { not: null } }, { completedTxHash: { not: null } }, { rejectedAt: { not: null } }],
    },
    select: { id: true },
  });
  for (const req of invalidPending) {
    mismatches.push({ requestId: req.id, reason: "pending request has terminal fields set" });
  }

  const invalidCompleted = await prisma.withdrawalRequest.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ completedAt: null }, { completedTxHash: null }],
    },
    select: { id: true },
  });
  for (const req of invalidCompleted) {
    mismatches.push({ requestId: req.id, reason: "completed request missing completedAt/txHash" });
  }

  const invalidRejected = await prisma.withdrawalRequest.findMany({
    where: {
      status: "REJECTED",
      rejectedAt: null,
    },
    select: { id: true },
  });
  for (const req of invalidRejected) {
    mismatches.push({ requestId: req.id, reason: "rejected request missing rejectedAt" });
  }

  return {
    pass: mismatches.length === 0,
    checkedPendingUsers: pendingByUser.length,
    checkedRequests:
      (await prisma.withdrawalRequest.count({ where: {} })) ?? 0,
    mismatches,
  };
}
