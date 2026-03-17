import { PrismaClient } from "@prisma/client";
import { placeOrder } from "../src/server/services/orderbook";

const prisma = new PrismaClient();

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run orderbook lock test in production.");
  }

  const user = await prisma.user.upsert({
    where: { username: "locktest-user" },
    update: { email: "locktest-user@kaoshi.local" },
    create: {
      username: "locktest-user",
      email: "locktest-user@kaoshi.local",
    },
  });

  const market = await prisma.market.upsert({
    where: { slug: "locktest-orderbook-market" },
    update: {
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      isListed: true,
      isCanceled: false,
      ownerId: null,
      betCloseTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolveTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    create: {
      slug: "locktest-orderbook-market",
      title: "Lock test market",
      description: "Dev lock test",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      isListed: true,
      isCanceled: false,
      ownerId: null,
      betCloseTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolveTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      outcomes: {
        create: [
          { name: "YES", slug: "locktest-orderbook-market-yes", displayOrder: 0, isActive: true },
          { name: "NO", slug: "locktest-orderbook-market-no", displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
  });

  const outcomeId = market.outcomes[0]?.id;
  if (!outcomeId) {
    throw new Error("Missing active outcome for lock test market.");
  }

  await prisma.order.deleteMany({ where: { marketId: market.id, userId: user.id } });

  await prisma.userBalance.upsert({
    where: { userId: user.id },
    update: { availableUSDC: 100, lockedUSDC: 0 },
    create: { userId: user.id, availableUSDC: 100, lockedUSDC: 0 },
  });

  const [a, b] = await Promise.allSettled([
    placeOrder({ marketId: market.id, userId: user.id, outcomeId, side: "BUY", price: 0.8, amount: 80 }),
    placeOrder({ marketId: market.id, userId: user.id, outcomeId, side: "BUY", price: 0.8, amount: 80 }),
  ]);

  const balance = await prisma.userBalance.findUnique({ where: { userId: user.id } });
  const openOrders = await prisma.order.count({
    where: {
      marketId: market.id,
      userId: user.id,
      status: { in: ["OPEN", "PARTIAL"] },
    },
  });

  const successCount = [a, b].filter((r) => r.status === "fulfilled").length;
  const failCount = 2 - successCount;

  console.log("Orderbook lock test results:", {
    successCount,
    failCount,
    openOrders,
    availableUSDC: balance?.availableUSDC?.toString() ?? null,
    lockedUSDC: balance?.lockedUSDC?.toString() ?? null,
    first: a.status,
    second: b.status,
  });

  if (successCount !== 1 || failCount !== 1) {
    throw new Error("Locking test failed: expected exactly one success and one failure.");
  }
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
