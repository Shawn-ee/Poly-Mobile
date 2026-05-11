import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const createUser = async (prefix: string) =>
  prisma.user.create({
    data: {
      username: `${prefix}_${randomUUID().slice(0, 8)}`,
      email: `${prefix}_${randomUUID().slice(0, 8)}@partial.local`,
    },
  });

const fundUser = async (userId: string, amount: Prisma.Decimal.Value) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC: dec(amount), lockedUSDC: dec(0) },
    create: { userId, availableUSDC: dec(amount), lockedUSDC: dec(0) },
  });
};

const createMarket = async () =>
  prisma.market.create({
    data: {
      title: `Partial fill cancel ${randomUUID().slice(0, 6)}`,
      description: "Dev partial fill cancel test",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `yes-${randomUUID().slice(0, 8)}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `no-${randomUUID().slice(0, 8)}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run partial fill cancel script in production.");
  }

  const buyer = await createUser("partial_buyer");
  const seller = await createUser("partial_seller");
  const market = await createMarket();
  const outcomeId = market.outcomes[0].id;

  await fundUser(buyer.id, "200");
  await fundUser(seller.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "100" });

  const restingBuy = await placeOrderAndMatch({
    marketId: market.id,
    userId: buyer.id,
    outcomeId,
    side: "BUY",
    price: "0.80",
    size: "100",
  });

  const midBalance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  assert(Number(midBalance.lockedUSDC) === 80, `expected locked 80 after place, got ${midBalance.lockedUSDC}`);
  assert(Number(midBalance.availableUSDC) === 120, `expected available 120 after place, got ${midBalance.availableUSDC}`);

  await placeOrderAndMatch({
    marketId: market.id,
    userId: seller.id,
    outcomeId,
    side: "SELL",
    price: "0.70",
    size: "40",
  });

  const partialOrder = await prisma.order.findUniqueOrThrow({ where: { id: restingBuy.order.id } });
  assert(Number(partialOrder.remaining) === 60, `expected remaining 60 after fill, got ${partialOrder.remaining}`);

  const partialBalance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  assert(Number(partialBalance.lockedUSDC) === 48, `expected locked 48 after fill, got ${partialBalance.lockedUSDC}`);
  assert(Number(partialBalance.availableUSDC) === 120, `expected available 120 after maker-price fill, got ${partialBalance.availableUSDC}`);

  await cancelOrderAndUnlock({ orderId: restingBuy.order.id, userId: buyer.id });

  const finalBalance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: restingBuy.order.id } });
  assert(Number(finalBalance.lockedUSDC) === 0, `expected locked 0 after cancel, got ${finalBalance.lockedUSDC}`);
  assert(Number(finalBalance.availableUSDC) === 168, `expected available 168 after cancel, got ${finalBalance.availableUSDC}`);
  assert(finalOrder.status === "CANCELED", `expected canceled status, got ${finalOrder.status}`);

  console.log("Partial fill + cancel script passed with collateralized setup.", {
    marketId: market.id,
    orderId: restingBuy.order.id,
    buyerAvailable: finalBalance.availableUSDC.toString(),
    buyerLocked: finalBalance.lockedUSDC.toString(),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
