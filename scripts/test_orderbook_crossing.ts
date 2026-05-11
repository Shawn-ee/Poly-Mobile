import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { applyDeposit } from "../src/server/services/ledger";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
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

  const suffix = Date.now();
  const maker = await prisma.user.create({
    data: {
      username: `cross-maker-${suffix}`,
      email: `cross-maker-${suffix}@kaoshi.local`,
      displayName: `cross-maker-${suffix}`,
    },
  });

  const taker = await prisma.user.create({
    data: {
      username: `cross-taker-${suffix}`,
      email: `cross-taker-${suffix}@kaoshi.local`,
      displayName: `cross-taker-${suffix}`,
    },
  });

  const market = await prisma.market.create({
    data: {
      slug: `crossing-regression-market-${suffix}`,
      title: `Crossing regression market ${suffix}`,
      description: "Legal minimal crossing test using deposit + complete-set mint.",
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
          { name: "YES", slug: `crossing-regression-market-${suffix}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `crossing-regression-market-${suffix}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
  });

  const outcomeId = market.outcomes[0]?.id;
  if (!outcomeId) throw new Error("Missing outcome for crossing test market");

  await applyDeposit({
    eventKey: `cross-maker-deposit:${maker.id}`,
    userId: maker.id,
    amount: "100",
    chainId: 8453,
    txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
    logIndex: 1,
    token: "USDC",
    referenceType: "TEST_CROSSING",
    referenceId: maker.id,
  });

  await applyDeposit({
    eventKey: `cross-taker-deposit:${taker.id}`,
    userId: taker.id,
    amount: "100",
    chainId: 8453,
    txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
    logIndex: 2,
    token: "USDC",
    referenceType: "TEST_CROSSING",
    referenceId: taker.id,
  });

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: taker.id,
    quantity: "10",
  });

  const makerBuy = await placeOrder({
    marketId: market.id,
    userId: maker.id,
    outcomeId,
    side: "BUY",
    price: 0.57,
    amount: 1,
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
    price: 0.51,
    amount: 1,
  });

  const fills = await prisma.fill.findMany({
    where: { marketId: market.id, outcomeId },
    orderBy: { createdAt: "asc" },
  });

  const orders = await prisma.order.findMany({
    where: { marketId: market.id, outcomeId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      side: true,
      price: true,
      remaining: true,
      status: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        marketId: market.id,
        outcomeId,
        makerBuy,
        takerSell,
        fills: fills.map((fill) => ({
          id: fill.id,
          price: fill.price.toString(),
          size: fill.size.toString(),
          side: fill.side,
          makerOrderId: fill.makerOrderId,
          takerOrderId: fill.takerOrderId,
        })),
        orders: orders.map((order) => ({
          id: order.id,
          userId: order.userId,
          side: order.side,
          price: order.price.toString(),
          remaining: order.remaining.toString(),
          status: order.status,
        })),
      },
      null,
      2
    )
  );

  assert(fills.length > 0, "expected at least one fill but got zero");
  assert(
    takerSell.status === "FILLED" || toNum(takerSell.remaining) < 1,
    `incoming crossing sell expected FILLED/PARTIAL got ${takerSell.status}`
  );
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
