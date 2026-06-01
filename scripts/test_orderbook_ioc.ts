import { randomUUID } from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";
import { submitCanonicalOrder } from "../src/server/services/canonicalOrderSubmission";
import { resetPublicSchema } from "../src/server/services/__tests__/dbTestUtils";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const createUser = async (prefix: string) =>
  prisma.user.create({
    data: {
      username: `${prefix}_${randomUUID().slice(0, 8)}`,
      email: `${prefix}_${randomUUID().slice(0, 8)}@ioc.local`,
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

async function casePartialMarketBuyDoesNotRest() {
  await resetPublicSchema();
  const seller = await createUser("ioc_buy_seller");
  const buyer = await createUser("ioc_buy_buyer");
  const market = await createPublicOrderbookMarket("IOC partial market buy");
  const outcomeId = market.outcomes[0].id;

  await fundUser(seller.id, "50");
  await fundUser(buyer.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "10" });

  await placeOrderAndMatch({
    marketId: market.id,
    userId: seller.id,
    outcomeId,
    side: "SELL",
    price: "0.19",
    size: "10",
    type: "LIMIT",
  });

  const submission = await submitCanonicalOrder({
    userId: buyer.id,
    apiCredentialId: null,
    apiKeyId: null,
    idempotencyKeyHeader: randomUUID(),
    body: {
      marketId: market.id,
      outcomeId,
      side: "BUY",
      type: "MARKET",
      size: "52.631579",
      maxSpend: "10",
    },
  });

  assert(submission.status === 200, `expected 200 status, got ${submission.status}`);
  assert("order" in submission.body, "expected order response body");
  if (!("order" in submission.body)) {
    throw new Error("expected order response body");
  }
  assert(submission.body.order.status === "FILLED", `expected filled market order, got ${submission.body.order.status}`);
  assert(submission.body.order.remaining === "0", `expected no remaining shares, got ${submission.body.order.remaining}`);
  assert(submission.body.fills.length === 1, `expected one fill, got ${submission.body.fills.length}`);

  const restingBid = await prisma.order.findFirst({
    where: {
      marketId: market.id,
      userId: buyer.id,
      outcomeId,
      side: "BUY",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: dec(0) },
    },
  });
  assert(restingBid == null, "market buy should not leave a resting bid");

  const buyerBalance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: buyer.id } });
  assert(Number(buyerBalance.lockedUSDC) === 0, "market buy should unlock all leftover USDC");
  assert(
    Math.abs(Number(buyerBalance.availableUSDC) - 98.1) < 0.000001,
    `expected buyer available balance 98.1, got ${buyerBalance.availableUSDC}`,
  );
}

async function casePartialMarketSellDoesNotRest() {
  await resetPublicSchema();
  const seller = await createUser("ioc_sell_seller");
  const buyer = await createUser("ioc_sell_buyer");
  const market = await createPublicOrderbookMarket("IOC partial market sell");
  const outcomeId = market.outcomes[0].id;

  await fundUser(seller.id, "50");
  await fundUser(buyer.id, "100");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "50" });

  await placeOrderAndMatch({
    marketId: market.id,
    userId: buyer.id,
    outcomeId,
    side: "BUY",
    price: "0.15",
    size: "10",
    type: "LIMIT",
  });

  const submission = await submitCanonicalOrder({
    userId: seller.id,
    apiCredentialId: null,
    apiKeyId: null,
    idempotencyKeyHeader: randomUUID(),
    body: {
      marketId: market.id,
      outcomeId,
      side: "SELL",
      type: "MARKET",
      size: "25",
    },
  });

  assert(submission.status === 200, `expected 200 status, got ${submission.status}`);
  assert("order" in submission.body, "expected order response body");
  if (!("order" in submission.body)) {
    throw new Error("expected order response body");
  }
  assert(submission.body.order.status === "FILLED", `expected filled market sell, got ${submission.body.order.status}`);
  assert(submission.body.order.remaining === "0", `expected no remaining shares, got ${submission.body.order.remaining}`);

  const restingAsk = await prisma.order.findFirst({
    where: {
      marketId: market.id,
      userId: seller.id,
      outcomeId,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: dec(0) },
    },
  });
  assert(restingAsk == null, "market sell should not leave a resting ask");

  const sellerPosition = await prisma.position.findUniqueOrThrow({
    where: { userId_marketId_outcomeId: { userId: seller.id, marketId: market.id, outcomeId } },
  });
  assert(Number(sellerPosition.reservedShares) === 0, "market sell should unlock leftover reserved shares");
  assert(Number(sellerPosition.shares) === 40, `expected seller shares 40, got ${sellerPosition.shares}`);
}

async function caseLimitOrderCanStillRest() {
  await resetPublicSchema();
  const buyer = await createUser("ioc_limit_buyer");
  const market = await createPublicOrderbookMarket("IOC limit order rest");
  const outcomeId = market.outcomes[0].id;

  await fundUser(buyer.id, "100");

  const result = await placeOrderAndMatch({
    marketId: market.id,
    userId: buyer.id,
    outcomeId,
    side: "BUY",
    price: "0.15",
    size: "5",
    type: "LIMIT",
  });

  assert(result.order.status === "OPEN", `expected open resting limit order, got ${result.order.status}`);
  assert(result.order.remaining === "5", `expected remaining 5, got ${result.order.remaining}`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run IOC test script in production.");
  }

  await casePartialMarketBuyDoesNotRest();
  await casePartialMarketSellDoesNotRest();
  await caseLimitOrderCanStillRest();
  console.log("IOC market-order script passed.");
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
