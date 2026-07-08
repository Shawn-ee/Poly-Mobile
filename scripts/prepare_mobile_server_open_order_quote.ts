import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const DEFAULT_EVENT_SLUG = "fixture-2026-fifa-world-cup";
const DEFAULT_BID_PRICE = "0.01";
const DEFAULT_ASK_PRICE = "0.05";
const DEFAULT_BID_SIZE = "500";
const DEFAULT_ASK_SIZE = "2500";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
const bidPrice = argValue("bidPrice") ?? DEFAULT_BID_PRICE;
const askPrice = argValue("askPrice") ?? DEFAULT_ASK_PRICE;
const bidSize = argValue("bidSize") ?? DEFAULT_BID_SIZE;
const askSize = argValue("askSize") ?? DEFAULT_ASK_SIZE;
const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-server-open-order-quote-liquidity.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function createMaker(kind: "bid" | "ask") {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_open_order_${kind}_maker_${suffix}`,
      email: `mobile_open_order_${kind}_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
  });
  return user;
}

async function findMobileServerOrderTarget() {
  const marketInclude = {
    where: {
      status: "LIVE" as const,
      visibility: "PUBLIC" as const,
      isListed: true,
      isCanceled: false,
      mechanism: "ORDERBOOK" as const,
      outcomes: { some: { isActive: true } },
    },
    include: {
      outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" as const } },
    },
    orderBy: [{ marketGroupKey: "asc" as const }, { displayOrder: "asc" as const }, { createdAt: "asc" as const }],
  };
  const event =
    (await prisma.event.findUnique({
      where: { slug: eventSlug },
      include: { markets: marketInclude },
    })) ??
    (
      await prisma.event.findMany({
        where: { category: "sports", sportKey: "soccer", leagueKey: "world_cup" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        include: { markets: marketInclude },
        take: 8,
      })
    ).find((item) => item.markets.length > 0);
  if (!event) throw new Error(`Missing event ${eventSlug} and no fallback World Cup event with live public orderbook markets was found.`);
  const market = event.markets.find((item) => item.outcomes.length > 0);
  if (!market) throw new Error(`Event ${eventSlug} has no live public orderbook market with active outcomes.`);
  const outcome = market.outcomes[0];
  assert(Boolean(outcome), "Selected market has no active outcome.");
  return { event, market, outcome };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to prepare mobile server open-order quote liquidity in production.");
  }
  if (dec(bidPrice).gte(dec(askPrice))) {
    throw new Error(`Open-order quote proof requires bidPrice < askPrice. Received ${bidPrice}/${askPrice}.`);
  }

  const { event, market, outcome } = await findMobileServerOrderTarget();

  const canceledStaleOrders = await prisma.order.updateMany({
    where: {
      marketId: market.id,
      outcomeId: outcome.id,
      status: { in: ["OPEN", "PARTIAL"] },
    },
    data: { status: "CANCELED" },
  });

  const bidMaker = await createMaker("bid");
  const askMaker = await createMaker("ask");
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

  const summary = {
    ready: true,
    event: { id: event.id, slug: event.slug, title: event.title },
    market: { id: market.id, title: market.title },
    outcome: { id: outcome.id, name: outcome.name },
    canceledStaleOrders: canceledStaleOrders.count,
    bidOrder: {
      id: bidOrder.order.id,
      status: bidOrder.order.status,
      price: bidPrice,
      size: bidSize,
      remaining: bidOrder.order.remaining,
    },
    askOrder: {
      id: askOrder.order.id,
      status: askOrder.order.status,
      price: askPrice,
      size: askSize,
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
