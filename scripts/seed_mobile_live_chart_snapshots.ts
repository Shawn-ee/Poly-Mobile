import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { buildMobileLiveChartSnapshotRows } from "@/server/services/mobileLiveChartSnapshotSeeding";

const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const apply = hasFlag("apply");
  const eventSlug = argValue("eventSlug");
  const summaryPath = argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;
  const baseTime = new Date(argValue("baseTime") ?? Date.now());
  if (Number.isNaN(baseTime.getTime())) throw new Error("Invalid --baseTime value.");

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
    event.markets.find((candidate) => candidate.marketType !== "prop" && candidate.outcomes.length > 0) ??
    event.markets[0];
  if (!market) throw new Error(`Event ${event.slug} has no live public orderbook markets.`);
  if (market.outcomes.length === 0) throw new Error(`Market ${market.id} has no active outcomes.`);

  const rows = buildMobileLiveChartSnapshotRows(market.outcomes, baseTime);
  const firstTimestamp = rows[0]?.timestamp;
  const lastTimestamp = rows.at(-1)?.timestamp;

  let deleted = 0;
  let created = 0;
  if (apply && firstTimestamp && lastTimestamp) {
    const deleteResult = await prisma.marketOutcomeSnapshot.deleteMany({
      where: {
        marketId: market.id,
        ts: {
          gte: firstTimestamp,
          lte: lastTimestamp,
        },
      },
    });
    deleted = deleteResult.count;
    const createResult = await prisma.marketOutcomeSnapshot.createMany({
      data: rows.map((row) => ({
        marketId: market.id,
        outcomeId: row.outcomeId,
        ts: row.timestamp,
        price: row.price,
      })),
    });
    created = createResult.count;
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
      outcomeCount: market.outcomes.length,
    },
    range: {
      firstTimestamp: firstTimestamp?.toISOString() ?? null,
      lastTimestamp: lastTimestamp?.toISOString() ?? null,
      pointCount: rows.length,
    },
    deletedSnapshots: deleted,
    createdSnapshots: created,
    preview: rows.slice(0, Math.min(rows.length, market.outcomes.length * 2)).map((row) => ({
      outcomeId: row.outcomeId,
      timestamp: row.timestamp.toISOString(),
      probability: row.probability,
      price: row.price.toString(),
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

