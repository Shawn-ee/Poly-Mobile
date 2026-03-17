import { PrismaClient } from "@prisma/client";
import { placeOrder } from "../src/server/services/orderbook";

const prisma = new PrismaClient();

const assert = (cond: boolean, message: string) => {
  if (!cond) throw new Error(message);
};

const toNum = (v: unknown) => Number(v ?? 0);

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run crossing test in production.");
  }

  const maker = await prisma.user.upsert({
    where: { username: "cross-maker" },
    update: { email: "cross-maker@kaoshi.local" },
    create: { username: "cross-maker", email: "cross-maker@kaoshi.local" },
  });

  const taker = await prisma.user.upsert({
    where: { username: "cross-taker" },
    update: { email: "cross-taker@kaoshi.local" },
    create: { username: "cross-taker", email: "cross-taker@kaoshi.local" },
  });

  const market = await prisma.market.upsert({
    where: { slug: "crossing-regression-market" },
    update: {
      status: "LIVE",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      visibility: "PUBLIC",
      isListed: true,
      isCanceled: false,
      ownerId: null,
      betCloseTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolveTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    create: {
      slug: "crossing-regression-market",
      title: "Crossing regression market",
      description: "Dev test for immediate crossing fills",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      visibility: "PUBLIC",
      isListed: true,
      isCanceled: false,
      ownerId: null,
      betCloseTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolveTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      outcomes: {
        create: [
          { name: "Celtics", slug: "crossing-regression-market-celtics", displayOrder: 0, isActive: true },
          { name: "Other", slug: "crossing-regression-market-other", displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
  });

  const outcomeId = market.outcomes[0]?.id;
  if (!outcomeId) throw new Error("Missing outcome for crossing test market");

  await prisma.order.deleteMany({ where: { marketId: market.id, OR: [{ userId: maker.id }, { userId: taker.id }] } });
  await prisma.trade.deleteMany({ where: { marketId: market.id, OR: [{ userId: maker.id }, { userId: taker.id }] } });

  await prisma.userBalance.upsert({
    where: { userId: maker.id },
    update: { availableUSDC: 100, lockedUSDC: 0 },
    create: { userId: maker.id, availableUSDC: 100, lockedUSDC: 0 },
  });

  await prisma.userBalance.upsert({
    where: { userId: taker.id },
    update: { availableUSDC: 0, lockedUSDC: 0 },
    create: { userId: taker.id, availableUSDC: 0, lockedUSDC: 0 },
  });

  const takerPos = await prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId: taker.id,
        marketId: market.id,
        outcomeId,
      },
    },
  });

  if (!takerPos) {
    await prisma.position.create({
      data: {
        userId: taker.id,
        marketId: market.id,
        outcomeId,
        shares: 50,
        reservedShares: 0,
        avgCost: 0.45,
      },
    });
  } else {
    await prisma.position.update({
      where: { id: takerPos.id },
      data: { shares: 50, reservedShares: 0, avgCost: 0.45 },
    });
  }

  const makerBuy = await placeOrder({
    marketId: market.id,
    userId: maker.id,
    outcomeId,
    side: "BUY",
    price: 0.55,
    amount: 20,
  });

  assert(
    makerBuy.status === "OPEN" || makerBuy.status === "PARTIAL",
    `maker buy should rest on the book; got ${makerBuy.status}`
  );

  const takerSell = await placeOrder({
    marketId: market.id,
    userId: taker.id,
    outcomeId,
    side: "SELL",
    price: 0.5,
    amount: 10,
  });

  assert(takerSell.status === "FILLED", `incoming crossing sell expected FILLED got ${takerSell.status}`);
  assert(toNum(takerSell.remaining) === 0, `incoming crossing sell remaining expected 0 got ${takerSell.remaining}`);

  const trades = await prisma.trade.findMany({
    where: { marketId: market.id, outcomeId, OR: [{ userId: maker.id }, { userId: taker.id }] },
  });
  assert(trades.length >= 2, `expected at least two trade rows (buy/sell), got ${trades.length}`);

  console.log("Crossing regression test passed:", {
    marketId: market.id,
    makerBuyOrderId: makerBuy.orderId,
    takerSellOrderId: takerSell.orderId,
    tradeRows: trades.length,
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
