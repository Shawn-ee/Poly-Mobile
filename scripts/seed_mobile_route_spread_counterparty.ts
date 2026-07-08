import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "../src/server/services/matching";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const eventSlug = argValue("eventSlug");
const outputPath = argValue("output") ?? "docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-counterparty.json";
const marketGroupKey = argValue("marketGroupKey") ?? "spread";
const outcomeSide = argValue("outcomeSide") ?? "home";
const askPrice = argValue("askPrice") ?? "0.52";
const askSize = argValue("askSize") ?? "60";
const line = argValue("line");
const cleanupProofBids = process.argv.includes("--cleanupProofBids");
const proofUserPrefix = argValue("proofUserPrefix") ?? "holiwyn-mobile-";

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function createMaker() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_route_fill_maker_${suffix}`,
      email: `mobile_route_fill_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("100"), lockedUSDC: dec("0") },
  });
  return user;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed mobile route counterparty in production.");
  }
  assert(eventSlug, "--eventSlug is required.");

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { marketGroupKey },
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
  assert(event, `Event ${eventSlug} was not found.`);
  const market = line
    ? event.markets.find((item) => item.line?.equals(dec(line)))
    : event.markets[0];
  assert(market, `Event ${eventSlug} has no ${marketGroupKey} market.`);
  const outcome = market.outcomes.find((item) => item.side === outcomeSide) ?? market.outcomes[0];
  assert(outcome, `${marketGroupKey} market ${market.id} has no outcome.`);

  const canceledProofBids = [];
  if (cleanupProofBids) {
    const staleProofBids = await prisma.order.findMany({
      where: {
        marketId: market.id,
        outcomeId: outcome.id,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        price: { gte: dec(askPrice) },
        user: { username: { startsWith: proofUserPrefix } },
      },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: "asc" },
    });
    for (const order of staleProofBids) {
      const canceled = await cancelOrderAndUnlock({ orderId: order.id, userId: order.userId });
      canceledProofBids.push({
        id: order.id,
        username: order.user.username,
        previousStatus: order.status,
        price: order.price.toString(),
        remaining: order.remaining.toString(),
        canceledStatus: canceled.order.status,
      });
    }
  }

  const maker = await createMaker();
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: maker.id, quantity: "80" });
  const makerOrder = await placeOrderAndMatch({
    marketId: market.id,
    outcomeId: outcome.id,
    userId: maker.id,
    side: "SELL",
    type: "LIMIT",
    price: askPrice,
    size: askSize,
  });

  assert(makerOrder.order.status === "OPEN", `Expected maker order to rest open, got ${makerOrder.order.status}.`);

  const summary = {
    pass: true,
    eventSlug,
    market: {
      id: market.id,
      title: market.title,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      period: market.period,
      line: market.line?.toString() ?? null,
      referenceSource: market.referenceSource,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
    },
    outcome: {
      id: outcome.id,
      name: outcome.name,
      side: outcome.side,
      referenceTokenId: outcome.referenceTokenId,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
    },
    maker: {
      id: maker.id,
      username: maker.username,
    },
    cleanup: {
      enabled: cleanupProofBids,
      proofUserPrefix,
      canceledProofBids,
    },
    makerOrder: makerOrder.order,
    seededAsk: {
      side: "SELL",
      price: askPrice,
      size: askSize,
      intendedMobileTaker: `BUY $25 route-backed ${marketGroupKey} ticket`,
    },
  };

  const resolved = path.resolve(outputPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
