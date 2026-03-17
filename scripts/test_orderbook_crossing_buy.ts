import { PrismaClient } from "@prisma/client";
import { placeOrder } from "../src/server/services/orderbook";

const prisma = new PrismaClient();

const assert = (cond: boolean, message: string) => {
  if (!cond) throw new Error(message);
};

const toNum = (v: unknown) => Number(v ?? 0);

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run crossing BUY test in production.");
  }

  const maker = await prisma.user.upsert({
    where: { username: "cross-buy-maker" },
    update: { email: "cross-buy-maker@kaoshi.local" },
    create: { username: "cross-buy-maker", email: "cross-buy-maker@kaoshi.local" },
  });

  const taker = await prisma.user.upsert({
    where: { username: "cross-buy-taker" },
    update: { email: "cross-buy-taker@kaoshi.local" },
    create: { username: "cross-buy-taker", email: "cross-buy-taker@kaoshi.local" },
  });

  const market = await prisma.market.upsert({
    where: { slug: "crossing-buy-regression-market" },
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
      slug: "crossing-buy-regression-market",
      title: "Crossing BUY regression market",
      description: "Dev test for incoming BUY crossing lower asks",
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
          { name: "Celtics", slug: "crossing-buy-regression-market-celtics", displayOrder: 0, isActive: true },
          { name: "Other", slug: "crossing-buy-regression-market-other", displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
  });

  const outcomeId = market.outcomes[0]?.id;
  if (!outcomeId) throw new Error("Missing outcome for crossing BUY test market");

  await prisma.order.deleteMany({ where: { marketId: market.id, OR: [{ userId: maker.id }, { userId: taker.id }] } });
  await prisma.trade.deleteMany({ where: { marketId: market.id, OR: [{ userId: maker.id }, { userId: taker.id }] } });

  await prisma.userBalance.upsert({
    where: { userId: maker.id },
    update: { availableUSDC: 0, lockedUSDC: 0 },
    create: { userId: maker.id, availableUSDC: 0, lockedUSDC: 0 },
  });

  await prisma.userBalance.upsert({
    where: { userId: taker.id },
    update: { availableUSDC: 100, lockedUSDC: 0 },
    create: { userId: taker.id, availableUSDC: 100, lockedUSDC: 0 },
  });

  const makerPos = await prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId: maker.id,
        marketId: market.id,
        outcomeId,
      },
    },
  });

  if (!makerPos) {
    await prisma.position.create({
      data: {
        userId: maker.id,
        marketId: market.id,
        outcomeId,
        shares: 50,
        reservedShares: 0,
        avgCost: 0.5,
      },
    });
  } else {
    await prisma.position.update({
      where: { id: makerPos.id },
      data: { shares: 50, reservedShares: 0, avgCost: 0.5 },
    });
  }

  const makerSell = await placeOrder({
    marketId: market.id,
    userId: maker.id,
    outcomeId,
    side: "SELL",
    price: 0.58,
    amount: 10,
  });

  assert(
    makerSell.status === "OPEN" || makerSell.status === "PARTIAL",
    `maker sell should rest on the book; got ${makerSell.status}`
  );

  const takerBuy = await placeOrder({
    marketId: market.id,
    userId: taker.id,
    outcomeId,
    side: "BUY",
    price: 0.59,
    amount: 10,
  });

  assert(takerBuy.status === "FILLED", `incoming crossing buy expected FILLED got ${takerBuy.status}`);
  assert(toNum(takerBuy.remaining) === 0, `incoming crossing buy remaining expected 0 got ${takerBuy.remaining}`);

  const trades = await prisma.trade.findMany({
    where: { marketId: market.id, outcomeId, OR: [{ userId: maker.id }, { userId: taker.id }] },
  });
  assert(trades.length >= 2, `expected at least two trade rows (buy/sell), got ${trades.length}`);

  console.log("Crossing BUY regression test passed:", {
    marketId: market.id,
    makerSellOrderId: makerSell.orderId,
    takerBuyOrderId: takerBuy.orderId,
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
