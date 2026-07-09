import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const DEFAULT_EVENT_SLUG = "fixture-2026-fifa-world-cup";
const DEFAULT_PRICE = "0.50";
const DEFAULT_SIZE = "500";
const DEFAULT_REQUIRED_REMAINING = "250";
const DEFAULT_MOBILE_HOLDINGS = "300";
const DEFAULT_MOBILE_USERNAME = "holiwyn-mobile-dev";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
const price = argValue("price") ?? DEFAULT_PRICE;
const size = argValue("size") ?? DEFAULT_SIZE;
const requiredRemaining = dec(argValue("requiredRemaining") ?? DEFAULT_REQUIRED_REMAINING);
const mobileHoldings = dec(argValue("mobileHoldings") ?? DEFAULT_MOBILE_HOLDINGS);
const mobileUsername = argValue("username") ?? process.env.MOBILE_DEV_USERNAME ?? DEFAULT_MOBILE_USERNAME;
const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-server-sell-fill-liquidity.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function createBuyMaker() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_sell_fill_buy_maker_${suffix}`,
      email: `mobile_sell_fill_buy_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  return user;
}

async function ensureMobileUser() {
  const user = await prisma.user.upsert({
    where: { username: mobileUsername },
    update: { email: `${mobileUsername}@local.test`, displayName: "Holiwyn Mobile Dev" },
    create: { username: mobileUsername, email: `${mobileUsername}@local.test`, displayName: "Holiwyn Mobile Dev" },
  });
  await prisma.userBalance.upsert({
    where: { userId: user.id },
    update: { availableUSDC: { increment: mobileHoldings } },
    create: { userId: user.id, availableUSDC: mobileHoldings, lockedUSDC: dec("0") },
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
  const market =
    event.markets.find(
      (item) =>
        item.outcomes.length > 0 &&
        (item.marketType === "match_winner_1x2" ||
          item.marketGroupKey === "main" ||
          /match winner/i.test(item.title)),
    ) ?? event.markets.find((item) => item.outcomes.length > 0);
  if (!market) throw new Error(`Event ${eventSlug} has no live public orderbook market with active outcomes.`);
  const outcome = market.outcomes[0];
  assert(Boolean(outcome), "Selected market has no active outcome.");
  return { event, market, outcome };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to prepare mobile server sell fill liquidity in production.");
  }

  const { event, market, outcome } = await findMobileServerOrderTarget();
  const mobileUser = await ensureMobileUser();
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: mobileUser.id, quantity: mobileHoldings });

  const attempts = [];
  let restingOrder: Awaited<ReturnType<typeof placeOrderAndMatch>> | null = null;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const maker = await createBuyMaker();
    const makerOrder = await placeOrderAndMatch({
      marketId: market.id,
      userId: maker.id,
      outcomeId: outcome.id,
      side: "BUY",
      price,
      size,
      type: "LIMIT",
    });
    attempts.push({
      attempt,
      makerOrderId: makerOrder.order.id,
      status: makerOrder.order.status,
      remaining: makerOrder.order.remaining,
      fillCount: makerOrder.fills.length,
    });
    if (
      (makerOrder.order.status === "OPEN" || makerOrder.order.status === "PARTIAL") &&
      dec(makerOrder.order.remaining).gte(requiredRemaining)
    ) {
      restingOrder = makerOrder;
      break;
    }
  }

  assert(
    Boolean(restingOrder),
    `expected to leave at least ${requiredRemaining.toString()} resting maker buy shares after clearing existing crossing sells`,
  );

  const position = await prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId: mobileUser.id,
        marketId: market.id,
        outcomeId: outcome.id,
      },
    },
    select: { shares: true, reservedShares: true },
  });

  const summary = {
    ready: true,
    event: { id: event.id, slug: event.slug, title: event.title },
    market: { id: market.id, title: market.title },
    outcome: { id: outcome.id, name: outcome.name },
    mobileUser: {
      id: mobileUser.id,
      username: mobileUser.username,
      shares: position?.shares.toString() ?? "0",
      reservedShares: position?.reservedShares.toString() ?? "0",
    },
    makerOrder: {
      id: restingOrder!.order.id,
      status: restingOrder!.order.status,
      price,
      size,
      requiredRemaining: requiredRemaining.toString(),
      remaining: restingOrder!.order.remaining,
    },
    attempts,
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
