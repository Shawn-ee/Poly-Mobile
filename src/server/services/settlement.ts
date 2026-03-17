import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";
import {
  COLLATERAL_ONE,
  assertPublicOrderbookCollateralInvariant,
} from "@/server/services/orderbookCollateral";

const ZERO = new Prisma.Decimal(0);
const MONEY_SCALE = 6;
const ONE_DOLLAR = COLLATERAL_ONE;
const toDec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

type Tx = Prisma.TransactionClient;

type LockedMarketRow = {
  id: string;
  mechanism: string;
  visibility: string;
  ownerId: string | null;
  status: string;
  isCanceled: boolean;
  resolvedOutcomeId: string | null;
  collateralUSDC: Prisma.Decimal;
};

type LockedBalanceRow = {
  userId: string;
  availableUSDC: Prisma.Decimal;
  lockedUSDC: Prisma.Decimal;
};

const toMoney = (value: Prisma.Decimal) =>
  value.toDecimalPlaces(MONEY_SCALE, Prisma.Decimal.ROUND_DOWN);

const sumDecimals = (values: Prisma.Decimal[]) =>
  values.reduce((acc, value) => acc.add(value), ZERO);

const lockMarketRow = async (tx: Tx, marketId: string): Promise<LockedMarketRow | null> => {
  const rows = await tx.$queryRaw<LockedMarketRow[]>`
    SELECT "id", "mechanism", "visibility", "ownerId", "status", "isCanceled", "resolvedOutcomeId", "collateralUSDC"
    FROM "Market"
    WHERE "id" = ${marketId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
};

const lockBalanceRow = async (tx: Tx, userId: string): Promise<LockedBalanceRow> => {
  await tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const rows = await tx.$queryRaw<LockedBalanceRow[]>`
    SELECT "userId", "availableUSDC", "lockedUSDC"
    FROM "UserBalance"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new MarketGuardError("User balance row lock failed.", 500);
  }
  return row;
};

const ensureUserBalance = async (tx: Tx, userId: string) => {
  await tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

const creditAvailableBalance = async (tx: Tx, userId: string, amount: Prisma.Decimal) => {
  if (amount.lte(0)) return;
  await ensureUserBalance(tx, userId);
  await tx.userBalance.update({
    where: { userId },
    data: { availableUSDC: { increment: amount } },
  });
};

const distributeProRata = (
  totalPayout: Prisma.Decimal,
  entries: Array<{ key: string; weight: Prisma.Decimal }>
) => {
  const payoutTotal = toMoney(totalPayout);
  const totalWeight = sumDecimals(entries.map((entry) => entry.weight));
  const amounts = new Map<string, Prisma.Decimal>();

  if (entries.length === 0 || totalWeight.lte(0) || payoutTotal.lte(0)) {
    for (const entry of entries) {
      amounts.set(entry.key, ZERO);
    }
    return amounts;
  }

  let allocated = ZERO;
  const ordered = [...entries].sort((a, b) => a.key.localeCompare(b.key));
  for (const entry of ordered) {
    const raw = payoutTotal.mul(entry.weight).div(totalWeight);
    const rounded = toMoney(raw);
    amounts.set(entry.key, rounded);
    allocated = allocated.add(rounded);
  }

  const remainder = payoutTotal.sub(allocated);
  if (remainder.gt(0) && ordered.length > 0) {
    const firstKey = ordered[0].key;
    amounts.set(firstKey, (amounts.get(firstKey) ?? ZERO).add(remainder));
  }

  return amounts;
};

export const resolveOrderbookMarket = async (params: {
  marketId: string;
  winningOutcomeId: string;
  actorUserId: string;
}) => {
  console.info("[settlement] orderbook resolve requested", {
    marketId: params.marketId,
    winningOutcomeId: params.winningOutcomeId,
    actorUserId: params.actorUserId,
  });

  return prisma.$transaction(async (tx) => {
    const market = await lockMarketRow(tx, params.marketId);
    if (!market) {
      throw new MarketGuardError("Market not found.", 404);
    }
    if (market.mechanism !== "ORDERBOOK") {
      throw new MarketGuardError("Only ORDERBOOK markets can be resolved here.", 400);
    }
    if (market.visibility !== "PUBLIC") {
      throw new MarketGuardError("Only PUBLIC markets are supported for this endpoint.", 403);
    }
    if (market.isCanceled) {
      throw new MarketGuardError("Canceled markets cannot be resolved.", 400);
    }
    if (market.status === "RESOLVED" || market.resolvedOutcomeId) {
      throw new MarketGuardError("Market has already been resolved.", 409);
    }

    await assertPublicOrderbookCollateralInvariant(tx, params.marketId);

    const winningOutcome = await tx.outcome.findFirst({
      where: { id: params.winningOutcomeId, marketId: params.marketId, isActive: true },
      select: { id: true },
    });
    if (!winningOutcome) {
      throw new MarketGuardError("Invalid winning outcome for market.", 400);
    }

    const positions = await tx.position.findMany({
      where: { marketId: params.marketId, shares: { gt: 0 } },
      select: { id: true, userId: true, outcomeId: true, shares: true },
    });
    const totalShares = sumDecimals(positions.map((position) => position.shares));
    const winnerPositions = positions.filter(
      (position) => position.outcomeId === params.winningOutcomeId
    );
    const winnerShares = sumDecimals(winnerPositions.map((position) => position.shares));
    const collateralUSDC = toMoney(toDec(market.collateralUSDC));
    const totalPayout = toMoney(winnerShares.mul(ONE_DOLLAR));
    const payoutMap = new Map<string, Prisma.Decimal>();
    for (const winner of winnerPositions) {
      payoutMap.set(winner.id, toMoney(winner.shares.mul(ONE_DOLLAR)));
    }

    if (!totalPayout.eq(collateralUSDC)) {
      throw new MarketGuardError(
        "Public settlement invariant failed: payout does not match market collateral.",
        409
      );
    }
    if (winnerShares.gt(collateralUSDC)) {
      throw new MarketGuardError(
        "Public settlement invariant failed: winning shares exceed market collateral.",
        409
      );
    }

    const payouts: Array<{ userId: string; amountPaid: string }> = [];
    let creditedTotal = ZERO;
    for (const winner of winnerPositions) {
      const payout = payoutMap.get(winner.id) ?? ZERO;
      if (payout.lte(0)) continue;

      await creditAvailableBalance(tx, winner.userId, payout);
      await tx.ledgerEntry.create({
        data: {
          userId: winner.userId,
          amountDelta: payout,
          reason: "WIN",
          operation: "OTHER",
          referenceType: "MARKET",
          referenceId: params.marketId,
          idempotencyKey: `resolve:${params.marketId}:winner:${winner.id}`,
          deltaAvailableUSDC: payout,
          deltaLockedUSDC: ZERO,
        },
      });
      creditedTotal = creditedTotal.add(payout);
      payouts.push({
        userId: winner.userId,
        amountPaid: payout.toString(),
      });
    }

    if (!creditedTotal.eq(totalPayout)) {
      throw new MarketGuardError(
        "Settlement conservation invariant failed for orderbook market.",
        500
      );
    }

    await tx.position.updateMany({
      where: { marketId: params.marketId },
      data: {
        shares: ZERO,
        reservedShares: ZERO,
        avgCost: ZERO,
      },
    });

    await tx.market.update({
      where: { id: params.marketId },
      data: {
        status: "RESOLVED",
        resolvedOutcomeId: params.winningOutcomeId,
        collateralUSDC: ZERO,
      },
    });

    console.info("[settlement] orderbook resolve complete", {
      marketId: params.marketId,
      winningOutcomeId: params.winningOutcomeId,
      totalShares: totalShares.toString(),
      winnerShares: winnerShares.toString(),
      payoutCount: payouts.length,
    });

    return {
      marketId: params.marketId,
      winningOutcomeId: params.winningOutcomeId,
      totalPoolPayout: totalPayout.toString(),
      totalWinningShares: winnerShares.toString(),
      payouts,
      collateralDebitedUSDC: creditedTotal.toString(),
    };
  });
};

export const resolvePrivatePool = async (params: {
  poolId: string;
  winningOutcomeId: string;
  actorUserId: string;
}) => {
  console.info("[settlement] private pool resolve requested", {
    poolId: params.poolId,
    winningOutcomeId: params.winningOutcomeId,
    actorUserId: params.actorUserId,
  });

  return prisma.$transaction(async (tx) => {
    const market = await lockMarketRow(tx, params.poolId);
    if (!market) {
      throw new MarketGuardError("Pool market not found.", 404);
    }
    if (market.mechanism !== "POOL") {
      throw new MarketGuardError("Only POOL markets can be resolved here.", 400);
    }
    if (market.visibility !== "PRIVATE") {
      throw new MarketGuardError("Only PRIVATE pools can be resolved here.", 400);
    }
    if (!market.ownerId || market.ownerId !== params.actorUserId) {
      throw new MarketGuardError("Forbidden", 403);
    }
    if (market.isCanceled) {
      throw new MarketGuardError("Canceled markets cannot be resolved.", 400);
    }
    if (market.status === "RESOLVED" || market.resolvedOutcomeId) {
      throw new MarketGuardError("Market has already been resolved.", 409);
    }

    const winningOutcome = await tx.outcome.findFirst({
      where: { id: params.winningOutcomeId, marketId: params.poolId, isActive: true },
      select: { id: true },
    });
    if (!winningOutcome) {
      throw new MarketGuardError("Invalid winning outcome.", 400);
    }

    const bets = await tx.poolBet.findMany({
      where: { marketId: params.poolId },
      select: { id: true, userId: true, outcomeId: true, amount: true },
    });
    const totalPool = sumDecimals(bets.map((bet) => bet.amount));
    const winnerBets = bets.filter((bet) => bet.outcomeId === params.winningOutcomeId);
    const winnerTotal = sumDecimals(winnerBets.map((bet) => bet.amount));
    const payoutMap = distributeProRata(totalPool, winnerBets.map((bet) => ({
      key: bet.id,
      weight: bet.amount,
    })));

    const payouts: Array<{ userId: string; amountPaid: string }> = [];
    for (const winnerBet of winnerBets) {
      const payout = payoutMap.get(winnerBet.id) ?? ZERO;
      if (payout.lte(0)) continue;

      await creditAvailableBalance(tx, winnerBet.userId, payout);
      await tx.ledgerEntry.create({
        data: {
          userId: winnerBet.userId,
          amountDelta: payout,
          reason: "WIN",
          operation: "OTHER",
          referenceType: "PoolMarket",
          referenceId: params.poolId,
          idempotencyKey: `pool-resolve:${params.poolId}:winner:${winnerBet.id}`,
          deltaAvailableUSDC: payout,
          deltaLockedUSDC: ZERO,
        },
      });
      payouts.push({
        userId: winnerBet.userId,
        amountPaid: payout.toString(),
      });
    }

    await tx.market.update({
      where: { id: params.poolId },
      data: {
        status: "RESOLVED",
        resolvedOutcomeId: params.winningOutcomeId,
      },
    });

    console.info("[settlement] private pool resolve complete", {
      poolId: params.poolId,
      winningOutcomeId: params.winningOutcomeId,
      totalPool: totalPool.toString(),
      winnerTotal: winnerTotal.toString(),
      payoutCount: payouts.length,
    });

    return {
      poolId: params.poolId,
      winningOutcomeId: params.winningOutcomeId,
      totalPoolPayout: totalPool.toString(),
      totalWinningShares: winnerTotal.toString(),
      payouts,
    };
  });
};

export const cancelPrivatePool = async (params: {
  poolId: string;
  actorUserId: string;
}) => {
  console.info("[settlement] private pool cancel requested", {
    poolId: params.poolId,
    actorUserId: params.actorUserId,
  });

  return prisma.$transaction(async (tx) => {
    const market = await lockMarketRow(tx, params.poolId);
    if (!market) {
      throw new MarketGuardError("Pool market not found.", 404);
    }
    if (market.mechanism !== "POOL") {
      throw new MarketGuardError("Only POOL markets can be canceled here.", 400);
    }
    if (market.visibility !== "PRIVATE") {
      throw new MarketGuardError("Only PRIVATE pools can be canceled here.", 400);
    }
    if (!market.ownerId || market.ownerId !== params.actorUserId) {
      throw new MarketGuardError("Forbidden", 403);
    }
    if (market.status === "RESOLVED" || market.resolvedOutcomeId) {
      throw new MarketGuardError("Resolved markets cannot be canceled.", 400);
    }
    if (market.isCanceled) {
      throw new MarketGuardError("Market already canceled.", 409);
    }

    const bets = await tx.poolBet.findMany({
      where: { marketId: params.poolId },
      select: { id: true, userId: true, amount: true },
    });

    const refunds: Array<{ userId: string; amountRefunded: string }> = [];
    for (const bet of bets) {
      const refund = toMoney(bet.amount);
      if (refund.lte(0)) continue;

      await creditAvailableBalance(tx, bet.userId, refund);
      await tx.ledgerEntry.create({
        data: {
          userId: bet.userId,
          amountDelta: refund,
          reason: "REFUND",
          operation: "OTHER",
          referenceType: "PoolMarket",
          referenceId: params.poolId,
          idempotencyKey: `pool-cancel:${params.poolId}:refund:${bet.id}`,
          deltaAvailableUSDC: refund,
          deltaLockedUSDC: ZERO,
        },
      });
      refunds.push({
        userId: bet.userId,
        amountRefunded: refund.toString(),
      });
    }

    await tx.market.update({
      where: { id: params.poolId },
      data: {
        status: "CLOSED",
        isCanceled: true,
      },
    });

    console.info("[settlement] private pool cancel complete", {
      poolId: params.poolId,
      refundCount: refunds.length,
    });

    return {
      poolId: params.poolId,
      refunds,
    };
  });
};
