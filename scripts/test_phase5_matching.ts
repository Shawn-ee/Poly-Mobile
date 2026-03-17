import { Prisma, PrismaClient } from "@prisma/client";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();

const assert = (cond: boolean, message: string) => {
  if (!cond) throw new Error(message);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const toNum = (v: unknown) => Number(v ?? 0);

const upsertUser = async (username: string) =>
  prisma.user.upsert({
    where: { username },
    update: { email: `${username}@kaoshi.local` },
    create: { username, email: `${username}@kaoshi.local` },
  });

const resetBalance = async (userId: string, availableUSDC: number) =>
  prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC, lockedUSDC: 0 },
    create: { userId, availableUSDC, lockedUSDC: 0 },
  });

const upsertLiveMarket = async (slug: string, title: string) =>
  prisma.market.upsert({
    where: { slug },
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
      slug,
      title,
      description: title,
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
          { name: "YES", slug: `${slug}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `${slug}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
  });

const resetMarketForUsers = async (marketId: string, userIds: string[]) => {
  await prisma.order.deleteMany({ where: { marketId, userId: { in: userIds } } });
  await prisma.trade.deleteMany({ where: { marketId, userId: { in: userIds } } });
  await prisma.fill.deleteMany({ where: { marketId, OR: [{ takerUserId: { in: userIds } }, { makerUserId: { in: userIds } }] } });
  await prisma.position.deleteMany({ where: { marketId, userId: { in: userIds } } });
};

const setShares = async (userId: string, marketId: string, outcomeId: string, shares: number, avgCost = 0.5) =>
  prisma.position.upsert({
    where: {
      userId_marketId_outcomeId: {
        userId,
        marketId,
        outcomeId,
      },
    },
    update: { shares, reservedShares: 0, avgCost },
    create: {
      userId,
      marketId,
      outcomeId,
      shares,
      reservedShares: 0,
      avgCost,
    },
  });

async function caseSingleFill() {
  const maker = await upsertUser("p5-single-maker");
  const taker = await upsertUser("p5-single-taker");
  const market = await upsertLiveMarket("p5-single-fill", "P5 Single Fill");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [maker.id, taker.id]);
  await resetBalance(maker.id, 0);
  await resetBalance(taker.id, 100);
  await setShares(maker.id, market.id, outcomeId, 50);

  await placeOrderAndMatch({ marketId: market.id, userId: maker.id, outcomeId, side: "SELL", price: 0.55, size: 10 });
  const result = await placeOrderAndMatch({ marketId: market.id, userId: taker.id, outcomeId, side: "BUY", price: 0.55, size: 10 });
  assert(result.order.status === "FILLED", "single fill: taker should be FILLED");
  assert(result.fills.length === 1, "single fill: expected exactly 1 fill");
}

async function casePartialFill() {
  const maker = await upsertUser("p5-partial-maker");
  const taker = await upsertUser("p5-partial-taker");
  const market = await upsertLiveMarket("p5-partial-fill", "P5 Partial Fill");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [maker.id, taker.id]);
  await resetBalance(maker.id, 0);
  await resetBalance(taker.id, 100);
  await setShares(maker.id, market.id, outcomeId, 50);

  await placeOrderAndMatch({ marketId: market.id, userId: maker.id, outcomeId, side: "SELL", price: 0.55, size: 5 });
  const result = await placeOrderAndMatch({ marketId: market.id, userId: taker.id, outcomeId, side: "BUY", price: 0.55, size: 10 });
  assert(result.order.status === "PARTIAL", "partial fill: taker should be PARTIAL");
  assert(toNum(result.order.remaining) === 5, `partial fill: remaining should be 5 got ${result.order.remaining}`);
}

async function casePriceTimePriority() {
  const makerA = await upsertUser("p5-priority-maker-a");
  const makerB = await upsertUser("p5-priority-maker-b");
  const taker = await upsertUser("p5-priority-taker");
  const market = await upsertLiveMarket("p5-price-time", "P5 Price Time Priority");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [makerA.id, makerB.id, taker.id]);
  await resetBalance(makerA.id, 0);
  await resetBalance(makerB.id, 0);
  await resetBalance(taker.id, 100);
  await setShares(makerA.id, market.id, outcomeId, 50);
  await setShares(makerB.id, market.id, outcomeId, 50);

  const a = await placeOrderAndMatch({ marketId: market.id, userId: makerA.id, outcomeId, side: "SELL", price: 0.55, size: 3 });
  await sleep(20);
  const b = await placeOrderAndMatch({ marketId: market.id, userId: makerB.id, outcomeId, side: "SELL", price: 0.55, size: 3 });
  await placeOrderAndMatch({ marketId: market.id, userId: taker.id, outcomeId, side: "BUY", price: 0.55, size: 6 });

  const fills = await prisma.fill.findMany({
    where: { marketId: market.id, outcomeId, takerUserId: taker.id },
    orderBy: { createdAt: "asc" },
  });
  assert(fills.length >= 2, "price-time: expected two fills");
  assert(fills[0].makerOrderId === a.order.id, "price-time: first maker should be earliest order");
  assert(fills[1].makerOrderId === b.order.id, "price-time: second maker should be second order");
}

async function caseBuyRefund() {
  const maker = await upsertUser("p5-refund-maker");
  const taker = await upsertUser("p5-refund-taker");
  const market = await upsertLiveMarket("p5-buy-refund", "P5 Buy Price Improvement");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [maker.id, taker.id]);
  await resetBalance(maker.id, 0);
  await resetBalance(taker.id, 100);
  await setShares(maker.id, market.id, outcomeId, 50);

  await placeOrderAndMatch({ marketId: market.id, userId: maker.id, outcomeId, side: "SELL", price: 0.5, size: 10 });
  await placeOrderAndMatch({ marketId: market.id, userId: taker.id, outcomeId, side: "BUY", price: 0.6, size: 10 });
  const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: taker.id } });
  assert(Number(balance.availableUSDC) === 95, `refund: available should be 95 got ${balance.availableUSDC}`);
  assert(Number(balance.lockedUSDC) === 0, `refund: locked should be 0 got ${balance.lockedUSDC}`);
}

async function caseCancelUnlock() {
  const user = await upsertUser("p5-cancel-user");
  const market = await upsertLiveMarket("p5-cancel-unlock", "P5 Cancel Unlock");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [user.id]);
  await resetBalance(user.id, 100);

  const placed = await placeOrderAndMatch({ marketId: market.id, userId: user.id, outcomeId, side: "BUY", price: 0.4, size: 10 });
  const mid = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
  assert(Number(mid.availableUSDC) === 96, `cancel: expected available 96 got ${mid.availableUSDC}`);
  assert(Number(mid.lockedUSDC) === 4, `cancel: expected locked 4 got ${mid.lockedUSDC}`);

  await cancelOrderAndUnlock({ orderId: placed.order.id, userId: user.id });
  const end = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
  assert(Number(end.availableUSDC) === 100, `cancel: expected available 100 got ${end.availableUSDC}`);
  assert(Number(end.lockedUSDC) === 0, `cancel: expected locked 0 got ${end.lockedUSDC}`);
}

async function caseConcurrencySanity() {
  const maker = await upsertUser("p5-conc-maker");
  const takerA = await upsertUser("p5-conc-taker-a");
  const takerB = await upsertUser("p5-conc-taker-b");
  const market = await upsertLiveMarket("p5-concurrency", "P5 Concurrency");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [maker.id, takerA.id, takerB.id]);
  await resetBalance(maker.id, 0);
  await resetBalance(takerA.id, 100);
  await resetBalance(takerB.id, 100);
  await setShares(maker.id, market.id, outcomeId, 50);

  const makerSell = await placeOrderAndMatch({
    marketId: market.id,
    userId: maker.id,
    outcomeId,
    side: "SELL",
    price: 0.55,
    size: 10,
  });

  await Promise.allSettled([
    placeOrderAndMatch({ marketId: market.id, userId: takerA.id, outcomeId, side: "BUY", price: 0.55, size: 10 }),
    placeOrderAndMatch({ marketId: market.id, userId: takerB.id, outcomeId, side: "BUY", price: 0.55, size: 10 }),
  ]);

  const makerOrder = await prisma.order.findUniqueOrThrow({ where: { id: makerSell.order.id } });
  const makerFills = await prisma.fill.findMany({ where: { makerOrderId: makerSell.order.id } });
  const totalFilled = makerFills.reduce((acc, f) => acc + Number(f.size), 0);
  assert(totalFilled <= 10.000001, `concurrency: maker overfilled (${totalFilled})`);
  assert(toNum(makerOrder.remaining) >= 0, "concurrency: maker remaining must not be negative");
}

async function casePrecisionEdge() {
  const maker = await upsertUser("p5-prec-maker");
  const taker = await upsertUser("p5-prec-taker");
  const market = await upsertLiveMarket("p5-precision-edge", "P5 Precision Edge");
  const outcomeId = market.outcomes[0].id;
  await resetMarketForUsers(market.id, [maker.id, taker.id]);
  await resetBalance(maker.id, 0);
  await resetBalance(taker.id, 100);
  await setShares(maker.id, market.id, outcomeId, 50, 0.2);

  await placeOrderAndMatch({ marketId: market.id, userId: maker.id, outcomeId, side: "SELL", price: 0.31, size: 1 });
  await placeOrderAndMatch({ marketId: market.id, userId: maker.id, outcomeId, side: "SELL", price: 0.32, size: 1 });
  await placeOrderAndMatch({ marketId: market.id, userId: maker.id, outcomeId, side: "SELL", price: 0.33, size: 1 });

  const takerOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: taker.id,
    outcomeId,
    side: "BUY",
    price: 0.333333,
    size: 3,
  });

  const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: takerOrder.order.id } });
  const expectedReserved = new Prisma.Decimal(freshOrder.remaining)
    .mul(new Prisma.Decimal(freshOrder.price))
    .toDecimalPlaces(6, Prisma.Decimal.ROUND_UP);
  assert(
    new Prisma.Decimal(freshOrder.reservedNotional).eq(expectedReserved),
    `precision edge: reservedNotional mismatch got ${freshOrder.reservedNotional} expected ${expectedReserved.toString()}`
  );

  const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: taker.id } });
  assert(Number(balance.lockedUSDC) >= 0, `precision edge: locked must be non-negative, got ${balance.lockedUSDC}`);
  assert(Number(balance.availableUSDC) >= 0, `precision edge: available must be non-negative, got ${balance.availableUSDC}`);
}

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run Phase 5 matching test in production.");
  }

  await caseSingleFill();
  await casePartialFill();
  await casePriceTimePriority();
  await caseBuyRefund();
  await caseCancelUnlock();
  await caseConcurrencySanity();
  await casePrecisionEdge();

  console.log("Phase 5 matching test suite passed.");
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
