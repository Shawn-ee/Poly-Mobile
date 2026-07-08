import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";
import { GET as getPortfolio } from "../src/app/api/portfolio/route";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const DEFAULT_BID_PRICE = "0.47";
const DEFAULT_ASK_PRICE = "0.50";
const DEFAULT_BID_SIZE = "1000";
const DEFAULT_ASK_SIZE = "2500";
const DEFAULT_POSITION_SHARES = "500";
const DEFAULT_POSITION_AVG_COST = "0.42";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const bidPrice = argValue("bidPrice") ?? DEFAULT_BID_PRICE;
const askPrice = argValue("askPrice") ?? DEFAULT_ASK_PRICE;
const bidSize = argValue("bidSize") ?? DEFAULT_BID_SIZE;
const askSize = argValue("askSize") ?? DEFAULT_ASK_SIZE;
const positionShares = argValue("positionShares") ?? DEFAULT_POSITION_SHARES;
const positionAvgCost = argValue("positionAvgCost") ?? DEFAULT_POSITION_AVG_COST;
const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-portfolio-quote-depth-proof.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function createUser(prefix: string, balance = "10000") {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function createWorldCupPortfolioQuoteProofMarket() {
  const suffix = randomUUID().slice(0, 8);
  const market = await prisma.market.create({
    data: {
      slug: `mobile-portfolio-quote-depth-${suffix}`,
      title: `World Cup Mobile Portfolio Quote Depth Proof ${suffix}`,
      description: "Dev-only World Cup proof market for Holiwyn mobile Portfolio quote depth.",
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
      externalSlug: `mobile-portfolio-quote-depth-${suffix}`,
      outcomes: {
        create: [
          { name: "YES", slug: `mobile-portfolio-quote-depth-yes-${suffix}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `mobile-portfolio-quote-depth-no-${suffix}`, displayOrder: 1, isActive: true },
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
    throw new Error("Refusing to run mobile Portfolio quote-depth proof in production.");
  }
  if (dec(bidPrice).gte(dec(askPrice))) {
    throw new Error(`Portfolio quote-depth proof requires bidPrice < askPrice. Received ${bidPrice}/${askPrice}.`);
  }

  const { market, outcome } = await createWorldCupPortfolioQuoteProofMarket();

  const proofUser = await createUser("holiwyn_mobile_portfolio_quote_depth_user");
  const bidMaker = await createUser("holiwyn_mobile_portfolio_quote_depth_bid");
  const askMaker = await createUser("holiwyn_mobile_portfolio_quote_depth_ask");

  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: askMaker.id, quantity: askSize });

  const bidOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: bidMaker.id,
    outcomeId: outcome.id,
    side: "BUY",
    price: bidPrice,
    size: bidSize,
    type: "LIMIT",
  });
  const askOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: askMaker.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: askPrice,
    size: askSize,
    type: "LIMIT",
  });

  assert(bidOrder.order.status === "OPEN", `expected seeded bid to stay open, got ${bidOrder.order.status}`);
  assert(askOrder.order.status === "OPEN", `expected seeded ask to stay open, got ${askOrder.order.status}`);

  await prisma.position.upsert({
    where: { userId_marketId_outcomeId: { userId: proofUser.id, marketId: market.id, outcomeId: outcome.id } },
    create: {
      userId: proofUser.id,
      marketId: market.id,
      outcomeId: outcome.id,
      shares: dec(positionShares),
      avgCost: dec(positionAvgCost),
      reservedShares: dec("0"),
    },
    update: {
      shares: dec(positionShares),
      avgCost: dec(positionAvgCost),
      reservedShares: dec("0"),
    },
  });

  const credential = await createApiCredential({
    userId: proofUser.id,
    name: `portfolio-quote-depth-proof-${new Date().toISOString()}`,
    scopes: [...API_KEY_SCOPES],
  });

  const response = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  const body = await response.json();
  assert(response.status === 200, `expected /api/portfolio 200, got ${response.status}: ${JSON.stringify(body)}`);

  const position = body.positions?.find(
    (item: { market?: { id?: string }; outcomeId?: string }) =>
      item.market?.id === market.id && item.outcomeId === outcome.id,
  );
  assert(position, "Expected proof position in /api/portfolio response.");
  assert(position.bestBid === Number(bidPrice), `expected bestBid ${bidPrice}, got ${position.bestBid}`);
  assert(position.bestAsk === Number(askPrice), `expected bestAsk ${askPrice}, got ${position.bestAsk}`);
  assert(position.bestBidSize === Number(bidSize), `expected bestBidSize ${bidSize}, got ${position.bestBidSize}`);
  assert(position.bestAskSize === Number(askSize), `expected bestAskSize ${askSize}, got ${position.bestAskSize}`);

  const expectedMid = Number(bidPrice) + (Number(askPrice) - Number(bidPrice)) / 2;
  assert(
    Math.abs(position.currentPrice - expectedMid) < 0.000001,
    `expected currentPrice ${expectedMid}, got ${position.currentPrice}`,
  );

  const summary = {
    ready: true,
    market: { id: market.id, title: market.title },
    outcome: { id: outcome.id, name: outcome.name },
    proofUser: { id: proofUser.id, username: proofUser.username, apiKeyId: credential.apiKey.keyId },
    seededDepth: {
      bestBid: Number(bidPrice),
      bestAsk: Number(askPrice),
      bestBidSize: Number(bidSize),
      bestAskSize: Number(askSize),
      currentPrice: expectedMid,
    },
    responsePosition: {
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      outcome: position.outcome,
      shares: position.shares,
      avgCost: position.avgCost,
      currentPrice: position.currentPrice,
      bestBid: position.bestBid,
      bestAsk: position.bestAsk,
      bestBidSize: position.bestBidSize,
      bestAskSize: position.bestAskSize,
      valueTokens: position.valueTokens,
      pnlTokens: position.pnlTokens,
    },
    bidOrder: {
      id: bidOrder.order.id,
      status: bidOrder.order.status,
      remaining: bidOrder.order.remaining,
    },
    askOrder: {
      id: askOrder.order.id,
      status: askOrder.order.status,
      remaining: askOrder.order.remaining,
    },
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
