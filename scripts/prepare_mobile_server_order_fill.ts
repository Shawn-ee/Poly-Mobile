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
const DEFAULT_REQUIRED_REMAINING = "120";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
const price = argValue("price") ?? DEFAULT_PRICE;
const size = argValue("size") ?? DEFAULT_SIZE;
const requiredRemaining = dec(argValue("requiredRemaining") ?? DEFAULT_REQUIRED_REMAINING);
const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-server-order-fill-liquidity.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function createMaker() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_order_fill_maker_${suffix}`,
      email: `mobile_order_fill_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  return user;
}

async function findMobileServerOrderTarget() {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          status: "LIVE",
          visibility: "PUBLIC",
          isListed: true,
          isCanceled: false,
          mechanism: "ORDERBOOK",
          outcomes: { some: { isActive: true } },
        },
        include: { outcomes: { where: { isActive: true }, orderBy: { displayOrder: "asc" } } },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!event) throw new Error(`Missing event ${eventSlug}.`);
  const market = event.markets.find((item) => item.outcomes.length > 0);
  if (!market) throw new Error(`Event ${eventSlug} has no live public orderbook market with active outcomes.`);
  const outcome = market.outcomes[0];
  assert(Boolean(outcome), "Selected market has no active outcome.");
  return { event, market, outcome };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to prepare mobile server order fill liquidity in production.");
  }

  const { event, market, outcome } = await findMobileServerOrderTarget();
  const attempts = [];
  let restingOrder: Awaited<ReturnType<typeof placeOrderAndMatch>> | null = null;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const maker = await createMaker();
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: maker.id, quantity: size });
    const makerOrder = await placeOrderAndMatch({
      marketId: market.id,
      userId: maker.id,
      outcomeId: outcome.id,
      side: "SELL",
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
    `expected to leave at least ${requiredRemaining.toString()} resting maker sell shares after clearing existing crossing buys`,
  );

  const summary = {
    ready: true,
    event: { id: event.id, slug: event.slug, title: event.title },
    market: { id: market.id, title: market.title },
    outcome: { id: outcome.id, name: outcome.name },
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
