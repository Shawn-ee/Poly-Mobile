import { PrismaClient } from "@prisma/client";
import { cancelOrder, placeOrder } from "../src/server/services/orderbook";

const prisma = new PrismaClient();

const assert = (cond: boolean, message: string) => {
  if (!cond) throw new Error(message);
};

const toNum = (v: unknown) => Number(v ?? 0);

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run partial fill cancel test in production.");
  }

  const buyer = await prisma.user.upsert({
    where: { username: "partial-buyer" },
    update: { email: "partial-buyer@kaoshi.local" },
    create: { username: "partial-buyer", email: "partial-buyer@kaoshi.local" },
  });

  const seller = await prisma.user.upsert({
    where: { username: "partial-seller" },
    update: { email: "partial-seller@kaoshi.local" },
    create: { username: "partial-seller", email: "partial-seller@kaoshi.local" },
  });

  const market = await prisma.market.upsert({
    where: { slug: "partial-fill-cancel-orderbook" },
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
      slug: "partial-fill-cancel-orderbook",
      title: "Partial fill + cancel test market",
      description: "Dev test",
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
          { name: "YES", slug: "partial-fill-cancel-orderbook-yes", displayOrder: 0, isActive: true },
          { name: "NO", slug: "partial-fill-cancel-orderbook-no", displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
  });

  const outcomeId = market.outcomes[0]?.id;
  if (!outcomeId) throw new Error("Missing outcome for partial fill test market");

  await prisma.order.deleteMany({ where: { marketId: market.id, OR: [{ userId: buyer.id }, { userId: seller.id }] } });
  await prisma.trade.deleteMany({ where: { marketId: market.id, OR: [{ userId: buyer.id }, { userId: seller.id }] } });

  await prisma.userBalance.upsert({
    where: { userId: buyer.id },
    update: { availableUSDC: 200, lockedUSDC: 0 },
    create: { userId: buyer.id, availableUSDC: 200, lockedUSDC: 0 },
  });

  await prisma.userBalance.upsert({
    where: { userId: seller.id },
    update: { availableUSDC: 0, lockedUSDC: 0 },
    create: { userId: seller.id, availableUSDC: 0, lockedUSDC: 0 },
  });

  const sellerPos = await prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId: seller.id,
        marketId: market.id,
        outcomeId,
      },
    },
  });
  if (!sellerPos) {
    await prisma.position.create({
      data: {
        userId: seller.id,
        marketId: market.id,
        outcomeId,
        shares: 100,
        reservedShares: 0,
        avgCost: 0.4,
      },
    });
  } else {
    await prisma.position.update({
      where: { id: sellerPos.id },
      data: { shares: 100, reservedShares: 0, avgCost: 0.4 },
    });
  }

  await placeOrder({
    marketId: market.id,
    userId: seller.id,
    outcomeId,
    side: "SELL",
    price: 0.7,
    amount: 40,
  });

  const buy = await placeOrder({
    marketId: market.id,
    userId: buyer.id,
    outcomeId,
    side: "BUY",
    price: 0.8,
    amount: 100,
  });

  const openBuy = await prisma.order.findUniqueOrThrow({ where: { id: buy.orderId } });
  assert(toNum(openBuy.remaining) === 60, `after partial fill remaining expected 60 got ${openBuy.remaining}`);

  let b = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  assert(toNum(b.lockedUSDC) === 48, `after partial fill locked expected 48 got ${b.lockedUSDC}`);
  assert(toNum(b.availableUSDC) === 124, `after rebate available expected 124 got ${b.availableUSDC}`);

  await cancelOrder({ orderId: buy.orderId, userId: buyer.id });

  b = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  assert(toNum(b.lockedUSDC) === 0, `after cancel locked expected 0 got ${b.lockedUSDC}`);
  assert(toNum(b.availableUSDC) === 172, `after cancel available expected 172 got ${b.availableUSDC}`);

  const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: buy.orderId } });
  assert(finalOrder.status === "CANCELED", `final order status expected CANCELED got ${finalOrder.status}`);

  console.log("Partial fill + cancel test passed:", {
    marketId: market.id,
    orderId: buy.orderId,
    buyerAvailable: b.availableUSDC.toString(),
    buyerLocked: b.lockedUSDC.toString(),
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
