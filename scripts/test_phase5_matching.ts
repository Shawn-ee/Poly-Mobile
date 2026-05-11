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
      email: `${prefix}_${randomUUID().slice(0, 8)}@phase5.local`,
    },
  });

const fundUser = async (userId: string, amount: Prisma.Decimal.Value) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC: dec(amount), lockedUSDC: dec(0) },
    create: { userId, availableUSDC: dec(amount), lockedUSDC: dec(0) },
  });
};

const createPublicOrderbookMarket = async (title: string) =>
  prisma.market.create({
    data: {
      title,
      description: title,
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

async function caseSingleFill() {
  const seller = await createUser("p5_single_seller");
  const buyer = await createUser("p5_single_buyer");
  const market = await createPublicOrderbookMarket("P5 single fill");
  const outcomeId = market.outcomes[0].id;
  await fundUser(seller.id, "10");
  await fundUser(buyer.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "10" });

  await placeOrderAndMatch({ marketId: market.id, userId: seller.id, outcomeId, side: "SELL", price: "0.55", size: "2" });
  const result = await placeOrderAndMatch({ marketId: market.id, userId: buyer.id, outcomeId, side: "BUY", price: "0.55", size: "2" });
  assert(result.order.status === "FILLED", "single fill should fully fill taker");
  assert(result.fills.length === 1, "single fill should create one fill");
}

async function casePartialFillAndCancel() {
  const seller = await createUser("p5_partial_seller");
  const buyer = await createUser("p5_partial_buyer");
  const market = await createPublicOrderbookMarket("P5 partial cancel");
  const outcomeId = market.outcomes[0].id;
  await fundUser(seller.id, "10");
  await fundUser(buyer.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "3" });

  const openSell = await placeOrderAndMatch({
    marketId: market.id,
    userId: seller.id,
    outcomeId,
    side: "SELL",
    price: "0.60",
    size: "3",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: buyer.id,
    outcomeId,
    side: "BUY",
    price: "0.60",
    size: "1",
  });

  const canceled = await cancelOrderAndUnlock({ orderId: openSell.order.id, userId: seller.id });
  assert(canceled.order.status === "CANCELED", "partial cancel should cancel resting remainder");
  assert(Number(canceled.position?.reservedShares ?? 0) === 0, "partial cancel should release reserved shares");
}

async function casePriceTimePriority() {
  const makerA = await createUser("p5_priority_a");
  const makerB = await createUser("p5_priority_b");
  const buyer = await createUser("p5_priority_buyer");
  const market = await createPublicOrderbookMarket("P5 price time");
  const outcomeId = market.outcomes[0].id;
  await fundUser(makerA.id, "10");
  await fundUser(makerB.id, "10");
  await fundUser(buyer.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: makerA.id, quantity: "1" });
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: makerB.id, quantity: "1" });

  const first = await placeOrderAndMatch({ marketId: market.id, userId: makerA.id, outcomeId, side: "SELL", price: "0.55", size: "1" });
  await new Promise((resolve) => setTimeout(resolve, 25));
  const second = await placeOrderAndMatch({ marketId: market.id, userId: makerB.id, outcomeId, side: "SELL", price: "0.55", size: "1" });
  await placeOrderAndMatch({ marketId: market.id, userId: buyer.id, outcomeId, side: "BUY", price: "0.60", size: "2" });

  const fills = await prisma.fill.findMany({
    where: { marketId: market.id, takerUserId: buyer.id },
    orderBy: { createdAt: "asc" },
  });
  assert(fills.length === 2, "price-time should create two fills");
  assert(fills[0].makerOrderId === first.order.id, "older maker should fill first");
  assert(fills[1].makerOrderId === second.order.id, "newer maker should fill second");
}

async function caseBuyReservationRefund() {
  const seller = await createUser("p5_refund_seller");
  const buyer = await createUser("p5_refund_buyer");
  const market = await createPublicOrderbookMarket("P5 buy refund");
  const outcomeId = market.outcomes[0].id;
  await fundUser(seller.id, "10");
  await fundUser(buyer.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "5" });

  await placeOrderAndMatch({ marketId: market.id, userId: seller.id, outcomeId, side: "SELL", price: "0.50", size: "2" });
  await placeOrderAndMatch({ marketId: market.id, userId: buyer.id, outcomeId, side: "BUY", price: "0.60", size: "2" });

  const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  assert(Number(balance.availableUSDC) === 99, `buyer should spend 1.00 after refund, got ${balance.availableUSDC}`);
  assert(Number(balance.lockedUSDC) === 0, "buyer locked USDC should be released after fill");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run Phase 5 matching script in production.");
  }

  await caseSingleFill();
  await casePartialFillAndCancel();
  await casePriceTimePriority();
  await caseBuyReservationRefund();
  console.log("Phase 5 matching script passed with collateralized public-orderbook setup.");
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
