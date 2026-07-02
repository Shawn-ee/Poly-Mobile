import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
const MOBILE_USERNAME = "holiwyn-mobile-dev";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-filled-trade-proof.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function ensureBuyerBalance(userId: string) {
  const current = await prisma.userBalance.findUnique({ where: { userId } });
  if (!current) {
    await prisma.userBalance.create({
      data: { userId, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
    });
    return;
  }
  if (dec(current.availableUSDC).lt("10")) {
    await prisma.userBalance.update({
      where: { userId },
      data: { availableUSDC: dec("100"), lockedUSDC: current.lockedUSDC },
    });
  }
}

async function createMaker() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_fill_maker_${suffix}`,
      email: `mobile_fill_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("100"), lockedUSDC: dec("0") },
  });
  return user;
}

async function createWorldCupProofMarket() {
  const suffix = randomUUID().slice(0, 8);
  const market = await prisma.market.create({
    data: {
      slug: `mobile-filled-trade-world-cup-${suffix}`,
      title: `World Cup Mobile Filled Trade Proof ${suffix}`,
      description: "Dev-only World Cup proof market for Holiwyn mobile filled-trade history.",
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
      externalSlug: `mobile-filled-trade-world-cup-${suffix}`,
      outcomes: {
        create: [
          { name: "YES", slug: `mobile-proof-yes-${suffix}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `mobile-proof-no-${suffix}`, displayOrder: 1, isActive: true },
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
    throw new Error("Refusing to run mobile filled-trade proof in production.");
  }

  const buyer = await prisma.user.findUnique({ where: { username: MOBILE_USERNAME } });
  if (!buyer) {
    throw new Error(`Missing ${MOBILE_USERNAME}; run npm run mobile:dev-credential first.`);
  }
  await ensureBuyerBalance(buyer.id);

  const credential = await prisma.apiCredential.findFirst({
    where: { userId: buyer.id, status: "ACTIVE", isDisabled: false, readOnly: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, keyId: true },
  });

  const { market, outcome } = await createWorldCupProofMarket();
  const maker = await createMaker();
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: maker.id, quantity: "2" });

  const makerOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: maker.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: "0.50",
    size: "2",
    type: "LIMIT",
  });
  const takerOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: buyer.id,
    outcomeId: outcome.id,
    apiCredentialId: credential?.id ?? null,
    side: "BUY",
    price: "0.50",
    size: "2",
    type: "LIMIT",
  });

  assert(takerOrder.order.status === "FILLED", `expected filled taker order, got ${takerOrder.order.status}`);
  assert(takerOrder.fills.length >= 1, "expected at least one fill");

  const recentTrades = await prisma.trade.findMany({
    where: { userId: buyer.id },
    include: { market: true, outcome: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  assert(recentTrades.some((trade) => trade.marketId === market.id && trade.outcomeId === outcome.id), "filled trade missing from buyer history");

  const summary = {
    ready: true,
    buyerUsername: buyer.username,
    market: { id: market.id, title: market.title },
    outcome: { id: outcome.id, name: outcome.name },
    makerOrder: { id: makerOrder.order.id, status: makerOrder.order.status },
    takerOrder: { id: takerOrder.order.id, status: takerOrder.order.status },
    fillCount: takerOrder.fills.length,
    recentTradeCount: recentTrades.length,
    latestTrade: recentTrades[0]
      ? {
          id: recentTrades[0].id,
          side: recentTrades[0].side,
          shares: Number(recentTrades[0].shares),
          cost: Number(recentTrades[0].cost),
          marketTitle: recentTrades[0].market.title,
          outcomeName: recentTrades[0].outcome.name,
        }
      : null,
    usedApiCredential: Boolean(credential),
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
