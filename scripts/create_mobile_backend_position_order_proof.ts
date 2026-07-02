import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const BID_PRICE = "0.47";
const ASK_PRICE = "0.50";
const BID_SIZE = "1000";
const INITIAL_ASK_SIZE = "3000";
const EXPECTED_ASK_SIZE = "2500";
const POSITION_SHARES = "500";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-backend-position-order-setup.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function createUser(prefix: string, balance = "10000", isAdmin = false) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function createProofMarket() {
  const suffix = randomUUID().slice(0, 8);
  const market = await prisma.market.create({
    data: {
      slug: `mobile-backend-position-order-${suffix}`,
      title: "World Cup Backend Position Order Proof",
      description: "Dev-only World Cup proof market for backend-only Portfolio ticket order submission.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      marketType: "soccer",
      marketGroupKey: "world-cup-proof",
      marketGroupTitle: "World Cup",
      propCategory: "mobile-proof",
      isListed: true,
      isCanceled: false,
      externalSlug: `mobile-backend-position-order-${suffix}`,
      outcomes: {
        create: [
          { name: "YES", slug: `mobile-backend-position-order-yes-${suffix}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `mobile-backend-position-order-no-${suffix}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  const outcome = market.outcomes.find((item) => item.name.toUpperCase() === "YES") ?? market.outcomes[0];
  assert(Boolean(outcome), "Selected market has no active outcome.");
  return { market, outcome };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create mobile backend position order proof state in production.");
  }

  const { market, outcome } = await createProofMarket();
  const proofUser = await createUser("holiwyn_mobile_backend_position_order_user", "10000", true);
  const bidMaker = await createUser("holiwyn_mobile_backend_position_order_bid");
  const askMaker = await createUser("holiwyn_mobile_backend_position_order_ask");

  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: askMaker.id, quantity: INITIAL_ASK_SIZE });

  const bidOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: bidMaker.id,
    outcomeId: outcome.id,
    side: "BUY",
    price: BID_PRICE,
    size: BID_SIZE,
    type: "LIMIT",
  });
  const askOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: askMaker.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: ASK_PRICE,
    size: INITIAL_ASK_SIZE,
    type: "LIMIT",
  });

  assert(bidOrder.order.status === "OPEN", `expected seeded bid to stay open, got ${bidOrder.order.status}`);
  assert(askOrder.order.status === "OPEN", `expected seeded ask to stay open, got ${askOrder.order.status}`);

  const positionTrade = await placeOrderAndMatch({
    marketId: market.id,
    userId: proofUser.id,
    outcomeId: outcome.id,
    side: "BUY",
    price: ASK_PRICE,
    size: POSITION_SHARES,
    type: "LIMIT",
  });
  assert(positionTrade.order.status === "FILLED", `expected proof position trade to fill, got ${positionTrade.order.status}`);

  const refreshedAskOrder = await prisma.order.findUniqueOrThrow({ where: { id: askOrder.order.id } });
  assert(
    refreshedAskOrder.remaining.eq(dec(EXPECTED_ASK_SIZE)),
    `expected seeded ask remaining ${EXPECTED_ASK_SIZE}, got ${refreshedAskOrder.remaining.toString()}`,
  );

  const credential = await createApiCredential({
    userId: proofUser.id,
    name: `backend-position-order-proof-${new Date().toISOString()}`,
    scopes: [...API_KEY_SCOPES],
  });

  const summary = {
    ready: true,
    user: { id: proofUser.id, username: proofUser.username },
    credential: { keyId: credential.apiKey.keyId, token: credential.token },
    market: { id: market.id, title: market.title },
    outcome: { id: outcome.id, name: outcome.name },
    seededDepth: {
      bestBid: Number(BID_PRICE),
      bestAsk: Number(ASK_PRICE),
      bestBidSize: Number(BID_SIZE),
      bestAskSize: Number(EXPECTED_ASK_SIZE),
      expectedTicketProbability: 49,
    },
    position: {
      shares: Number(POSITION_SHARES),
      avgCost: Number(ASK_PRICE),
      sourceOrderId: positionTrade.order.id,
    },
    bidOrder: { id: bidOrder.order.id, status: bidOrder.order.status },
    askOrder: { id: askOrder.order.id, status: askOrder.order.status },
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
