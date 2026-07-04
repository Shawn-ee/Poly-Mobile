import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildMobileLiveOrderbookDepthRows } from "@/server/services/mobileLiveOrderbookDepthSeeding";

const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/cycle-current-mobile-live-orderbook-depth-seed.json";
const SEED_USER_PREFIX = "mobile_depth_seed";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function ensureSeedUsers() {
  const [bidder, asker] = await Promise.all([
    prisma.user.upsert({
      where: { username: `${SEED_USER_PREFIX}_bidder` },
      update: {},
      create: {
        username: `${SEED_USER_PREFIX}_bidder`,
        email: `${SEED_USER_PREFIX}_bidder@holiwyn.local`,
        displayName: "Mobile Depth Bidder",
      },
    }),
    prisma.user.upsert({
      where: { username: `${SEED_USER_PREFIX}_asker` },
      update: {},
      create: {
        username: `${SEED_USER_PREFIX}_asker`,
        email: `${SEED_USER_PREFIX}_asker@holiwyn.local`,
        displayName: "Mobile Depth Asker",
      },
    }),
  ]);

  return { bidder, asker };
}

async function main() {
  const apply = hasFlag("apply");
  const eventSlug = argValue("eventSlug");
  const marketId = argValue("marketId");
  const marketType = argValue("marketType");
  const line = argValue("line");
  const summaryPath = argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;

  const event = await prisma.event.findFirst({
    where: eventSlug
      ? { slug: eventSlug }
      : {
          category: "sports",
          sportKey: "soccer",
          leagueKey: "world_cup",
          markets: { some: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" } },
        },
    orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
    include: {
      markets: {
        where: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error(eventSlug ? `No event found for ${eventSlug}.` : "No live public World Cup event found.");
  }

  const market =
    (marketId ? event.markets.find((candidate) => candidate.id === marketId) : undefined) ??
    (marketType || line
      ? event.markets.find((candidate) =>
          (!marketType || candidate.marketType === marketType) &&
          (!line || candidate.line?.toString() === line) &&
          candidate.outcomes.length > 0)
      : undefined) ??
    event.markets.find((candidate) => candidate.marketType !== "prop" && candidate.outcomes.length > 0) ??
    event.markets[0];
  if (!market) throw new Error(`Event ${event.slug} has no live public orderbook markets.`);
  if (market.outcomes.length === 0) throw new Error(`Market ${market.id} has no active outcomes.`);

  const seedOrders = buildMobileLiveOrderbookDepthRows(market.outcomes);
  const users = apply ? await ensureSeedUsers() : null;
  const seedUserIds = users ? [users.bidder.id, users.asker.id] : [];

  let deletedOrders = 0;
  let createdOrders = 0;
  if (apply && users) {
    const deleteResult = await prisma.order.deleteMany({
      where: {
        marketId: market.id,
        userId: { in: seedUserIds },
        status: { in: ["OPEN", "PARTIAL"] },
      },
    });
    deletedOrders = deleteResult.count;

    const createResult = await prisma.order.createMany({
      data: seedOrders.map((order) => ({
        marketId: market.id,
        outcomeId: order.outcomeId,
        userId: order.side === "BUY" ? users.bidder.id : users.asker.id,
        side: order.side,
        price: order.price,
        amount: order.amount,
        remaining: order.amount,
        reservedNotional:
          order.side === "BUY" ? order.price.mul(order.amount) : new Prisma.Decimal(0),
        status: "OPEN",
      })),
    });
    createdOrders = createResult.count;
  }

  const summary = {
    applied: apply,
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      liveStatus: event.liveStatus,
    },
    market: {
      id: market.id,
      title: market.title,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      line: market.line?.toString() ?? null,
      outcomeCount: market.outcomes.length,
    },
    users: users
      ? {
          bidderId: users.bidder.id,
          askerId: users.asker.id,
        }
      : null,
    deletedOrders,
    createdOrders,
    preview: seedOrders.slice(0, 8).map((order) => ({
      outcomeId: order.outcomeId,
      side: order.side,
      price: order.price.toString(),
      amount: order.amount.toString(),
    })),
  };

  await fs.mkdir(path.dirname(summaryPath), { recursive: true });
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
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
