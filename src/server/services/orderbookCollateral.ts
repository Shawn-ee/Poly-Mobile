import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";

const ZERO = new Prisma.Decimal(0);
const SCALE = new Prisma.Decimal("0.000001");
const ONE = new Prisma.Decimal(1);

type Tx = Prisma.TransactionClient;

type LockedMarket = {
  id: string;
  mechanism: string;
  visibility: string;
  status: string;
  isCanceled: boolean;
  collateralUSDC: Prisma.Decimal;
};

type LockedBalance = {
  userId: string;
  availableUSDC: Prisma.Decimal;
  lockedUSDC: Prisma.Decimal;
};

const toDec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const norm = (v: Prisma.Decimal) => v.div(SCALE).floor().mul(SCALE);
const eq = (a: Prisma.Decimal, b: Prisma.Decimal) => a.sub(b).abs().lte(SCALE);

const lockMarketRow = async (tx: Tx, marketId: string): Promise<LockedMarket> => {
  const rows = await tx.$queryRaw<LockedMarket[]>`
    SELECT "id", "mechanism", "visibility", "status", "isCanceled", "collateralUSDC"
    FROM "Market"
    WHERE "id" = ${marketId}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) throw new MarketGuardError("Market not found", 404);
  return row;
};

const lockBalanceRow = async (tx: Tx, userId: string): Promise<LockedBalance> => {
  await tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const rows = await tx.$queryRaw<LockedBalance[]>`
    SELECT "userId", "availableUSDC", "lockedUSDC"
    FROM "UserBalance"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) throw new MarketGuardError("User balance row lock failed", 500);
  return row;
};

const activeOutcomeIds = async (tx: Tx, marketId: string) => {
  const outcomes = await tx.outcome.findMany({
    where: { marketId, isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (outcomes.length < 2) {
    throw new MarketGuardError("Public orderbook market must have at least 2 outcomes", 400);
  }
  return outcomes.map((o) => o.id);
};

const sumOutstandingByOutcome = async (tx: Tx, marketId: string, outcomeIds: string[]) => {
  const grouped = await tx.position.groupBy({
    by: ["outcomeId"],
    where: {
      marketId,
      outcomeId: { in: outcomeIds },
      shares: { gt: ZERO },
    },
    _sum: { shares: true },
  });

  const map = new Map<string, Prisma.Decimal>();
  for (const id of outcomeIds) map.set(id, ZERO);
  for (const row of grouped) map.set(row.outcomeId, row._sum.shares ?? ZERO);
  return map;
};

const bestPrice = async (
  tx: Tx,
  params: {
    marketId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
  }
) => {
  const row = await tx.order.findFirst({
    where: {
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      side: params.side,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: ZERO },
    },
    orderBy:
      params.side === "BUY"
        ? [{ price: "desc" }, { createdAt: "asc" }]
        : [{ price: "asc" }, { createdAt: "asc" }],
    select: { price: true },
  });
  return row?.price ?? null;
};

export const assertPublicOrderbookCollateralInvariant = async (tx: Tx, marketId: string) => {
  const market = await lockMarketRow(tx, marketId);
  if (market.mechanism !== "ORDERBOOK" || market.visibility !== "PUBLIC") {
    return;
  }

  const outcomeIds = await activeOutcomeIds(tx, marketId);
  const outstanding = await sumOutstandingByOutcome(tx, marketId, outcomeIds);
  const first = outstanding.get(outcomeIds[0]) ?? ZERO;

  for (const outcomeId of outcomeIds) {
    const value = outstanding.get(outcomeId) ?? ZERO;
      if (!eq(value, first)) {
      console.error("[orderbookCollateral] invariant failed", {
        marketId,
        reason: "outstanding_imbalanced",
        outcomeId,
        value: value.toString(),
        first: first.toString(),
      });
      throw new MarketGuardError(
        "Public orderbook collateral invariant violated: outcomes outstanding are imbalanced.",
        409
      );
    }
  }

  if (!eq(first, toDec(market.collateralUSDC))) {
    console.error("[orderbookCollateral] invariant failed", {
      marketId,
      reason: "collateral_mismatch",
      outstanding: first.toString(),
      collateralUSDC: toDec(market.collateralUSDC).toString(),
    });
    throw new MarketGuardError(
      "Public orderbook collateral invariant violated: outstanding shares lack collateral provenance.",
      409
    );
  }
};

export const mintCompleteSetForPublicOrderbook = async (params: {
  marketId: string;
  userId: string;
  quantity: Prisma.Decimal.Value;
}) => {
  console.info("[orderbookCollateral] mint request", {
    marketId: params.marketId,
    userId: params.userId,
  });
  const qty = norm(toDec(params.quantity));
  if (qty.lte(0)) {
    throw new MarketGuardError("Quantity must be greater than zero", 400);
  }

  return prisma.$transaction(async (tx) => {
    const market = await lockMarketRow(tx, params.marketId);
    if (market.mechanism !== "ORDERBOOK" || market.visibility !== "PUBLIC") {
      throw new MarketGuardError("Complete-set mint only supports PUBLIC ORDERBOOK markets", 400);
    }
    if (market.isCanceled || market.status !== "LIVE") {
      throw new MarketGuardError("Market is not open for minting", 400);
    }

    const outcomeIds = await activeOutcomeIds(tx, params.marketId);
    const balance = await lockBalanceRow(tx, params.userId);
    if (toDec(balance.availableUSDC).lt(qty)) {
      throw new MarketGuardError("Insufficient available USDC for complete-set mint", 409);
    }

    await tx.userBalance.update({
      where: { userId: params.userId },
      data: { availableUSDC: { decrement: qty } },
    });
    await tx.market.update({
      where: { id: params.marketId },
      data: { collateralUSDC: { increment: qty } },
    });

    const perOutcomeCost = new Prisma.Decimal(1).div(new Prisma.Decimal(outcomeIds.length));
    for (const outcomeId of outcomeIds) {
      const existing = await tx.position.findUnique({
        where: {
          userId_marketId_outcomeId: {
            userId: params.userId,
            marketId: params.marketId,
            outcomeId,
          },
        },
      });
      if (!existing) {
        await tx.position.create({
          data: {
            userId: params.userId,
            marketId: params.marketId,
            outcomeId,
            shares: qty,
            avgCost: perOutcomeCost,
            reservedShares: ZERO,
            realizedPnl: ZERO,
          },
        });
      } else {
        const oldShares = toDec(existing.shares);
        const newShares = oldShares.add(qty);
        const weighted = oldShares.mul(existing.avgCost).add(qty.mul(perOutcomeCost));
        const avgCost = newShares.gt(0) ? weighted.div(newShares) : ZERO;
        await tx.position.update({
          where: { id: existing.id },
          data: { shares: newShares, avgCost },
        });
      }
    }

    await tx.ledgerEntry.create({
      data: {
        userId: params.userId,
        reason: "LOCK",
        operation: "LOCK",
        referenceType: "MarketCollateral",
        referenceId: params.marketId,
        idempotencyKey: `mint:${params.marketId}:${params.userId}:${Date.now()}`,
        amountDelta: qty.neg(),
        deltaAvailableUSDC: qty.neg(),
        deltaLockedUSDC: ZERO,
      },
    });

    await assertPublicOrderbookCollateralInvariant(tx, params.marketId);

    const result = {
      marketId: params.marketId,
      quantity: qty.toString(),
      outcomesMinted: outcomeIds.length,
    };
    console.info("[orderbookCollateral] mint complete", result);
    return result;
  });
};

export const getPublicOrderbookCollateralSnapshot = async (marketId: string) => {
  return prisma.$transaction(async (tx) => {
    const market = await lockMarketRow(tx, marketId);
    const outcomeIds = await activeOutcomeIds(tx, marketId);
    const outstanding = await sumOutstandingByOutcome(tx, marketId, outcomeIds);
    return {
      marketId,
      collateralUSDC: toDec(market.collateralUSDC).toString(),
      byOutcome: Object.fromEntries(
        outcomeIds.map((id) => [id, (outstanding.get(id) ?? ZERO).toString()])
      ),
    };
  });
};

export const getPublicBinaryInvariantState = async (marketId: string) => {
  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({
      where: { id: marketId },
      select: {
        id: true,
        status: true,
        mechanism: true,
        visibility: true,
        collateralUSDC: true,
      },
    });
    if (!market) {
      throw new MarketGuardError("Market not found", 404);
    }

    const outcomes = await tx.outcome.findMany({
      where: { marketId, isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    });

    if (outcomes.length !== 2) {
      throw new MarketGuardError("Invariant monitor supports binary markets only", 400);
    }

    const [o1, o2] = outcomes;
    const [b1, b2, a1, a2] = await Promise.all([
      bestPrice(tx, { marketId, outcomeId: o1.id, side: "BUY" }),
      bestPrice(tx, { marketId, outcomeId: o2.id, side: "BUY" }),
      bestPrice(tx, { marketId, outcomeId: o1.id, side: "SELL" }),
      bestPrice(tx, { marketId, outcomeId: o2.id, side: "SELL" }),
    ]);

    const outstanding = await sumOutstandingByOutcome(tx, marketId, [o1.id, o2.id]);
    const out1 = outstanding.get(o1.id) ?? ZERO;
    const out2 = outstanding.get(o2.id) ?? ZERO;

    const bidSum = b1 && b2 ? b1.add(b2) : null;
    const askSum = a1 && a2 ? a1.add(a2) : null;
    const bidInvariantPass = bidSum ? bidSum.lte(ONE) : true;
    const askInvariantPass = askSum ? askSum.gte(ONE) : true;
    const outstandingSharesEqual = eq(out1, out2);
    const collateralMatchesOutstanding = eq(toDec(market.collateralUSDC), out1) && outstandingSharesEqual;
    const statusSummary =
      bidInvariantPass && askInvariantPass && collateralMatchesOutstanding
        ? "PASS"
        : "FAIL";

    return {
      marketId: market.id,
      marketStatus: market.status,
      marketMechanism: market.mechanism,
      marketVisibility: market.visibility,
      outcome1: { id: o1.id, name: o1.name },
      outcome2: { id: o2.id, name: o2.name },
      bestBidOutcome1: b1 ? b1.toString() : null,
      bestBidOutcome2: b2 ? b2.toString() : null,
      bestAskOutcome1: a1 ? a1.toString() : null,
      bestAskOutcome2: a2 ? a2.toString() : null,
      bidSum: bidSum ? bidSum.toString() : null,
      askSum: askSum ? askSum.toString() : null,
      bidInvariantPass,
      askInvariantPass,
      marketCollateralUSDC: toDec(market.collateralUSDC).toString(),
      outstandingSharesOutcome1: out1.toString(),
      outstandingSharesOutcome2: out2.toString(),
      outstandingSharesEqual,
      collateralMatchesOutstanding,
      invariantStatusSummary: statusSummary,
      timestamp: new Date().toISOString(),
    };
  });
};

export const COLLATERAL_ONE = ONE;
