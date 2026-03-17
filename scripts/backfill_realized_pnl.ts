import { Prisma, PrismaClient, TradeSide } from "@prisma/client";

const prisma = new PrismaClient();

const DEC_ZERO = new Prisma.Decimal(0);

const toDecimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);

const safeDiv = (a: Prisma.Decimal, b: Prisma.Decimal) =>
  b.eq(0) ? DEC_ZERO : a.div(b);

const run = async () => {
  const force = process.env.FORCE_BACKFILL_REALIZED === "true";
  if (process.env.NODE_ENV === "production" && !force) {
    throw new Error(
      "Refusing to run realized PnL backfill in production without FORCE_BACKFILL_REALIZED=true"
    );
  }

  const buckets = await prisma.trade.groupBy({
    by: ["userId", "marketId", "outcomeId"],
    _count: { _all: true },
  });

  let updated = 0;
  let created = 0;
  let skipped = 0;
  let anomalyCount = 0;

  for (const bucket of buckets) {
    const trades = await prisma.trade.findMany({
      where: {
        userId: bucket.userId,
        marketId: bucket.marketId,
        outcomeId: bucket.outcomeId,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, side: true, shares: true, cost: true, fee: true },
    });

    let shares = DEC_ZERO;
    let avgCost = DEC_ZERO;
    let realized = DEC_ZERO;

    for (const trade of trades) {
      const qty = toDecimal(trade.shares);
      if (qty.lte(0)) continue;

      const notional = toDecimal(trade.cost);
      const fee = toDecimal(trade.fee ?? 0);
      const fillPrice = safeDiv(notional, qty);

      if (trade.side === TradeSide.BUY) {
        const nextShares = shares.add(qty);
        if (nextShares.gt(0)) {
          avgCost = shares.mul(avgCost).add(qty.mul(fillPrice)).div(nextShares);
        }
        shares = nextShares;
        continue;
      }

      const sellQty = qty.gt(shares) ? shares : qty;
      if (qty.gt(shares)) {
        anomalyCount += 1;
      }
      if (sellQty.lte(0)) continue;

      const realizedDelta = fillPrice.sub(avgCost).mul(sellQty).sub(fee);
      realized = realized.add(realizedDelta);
      shares = shares.sub(sellQty);

      if (shares.lte(0)) {
        shares = DEC_ZERO;
        avgCost = DEC_ZERO;
      }
    }

    const existing = await prisma.position.findUnique({
      where: {
        userId_marketId_outcomeId: {
          userId: bucket.userId,
          marketId: bucket.marketId,
          outcomeId: bucket.outcomeId,
        },
      },
    });

    if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data: { realizedPnl: realized },
      });
      updated += 1;
      continue;
    }

    if (realized.eq(0) && shares.eq(0)) {
      skipped += 1;
      continue;
    }

    await prisma.position.create({
      data: {
        userId: bucket.userId,
        marketId: bucket.marketId,
        outcomeId: bucket.outcomeId,
        shares,
        avgCost,
        realizedPnl: realized,
      },
    });
    created += 1;
  }

  console.log("Backfill realized PnL summary:", {
    buckets: buckets.length,
    updated,
    created,
    skipped,
    anomalyCount,
  });
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
