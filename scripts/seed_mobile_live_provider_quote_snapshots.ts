import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { buildMobileLiveProviderQuoteSnapshotRows } from "@/server/services/mobileLiveProviderQuoteSnapshotSeeding";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/cycle-current-mobile-live-provider-quote-snapshot-seed.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const apply = hasFlag("apply");
  const eventSlug = argValue("eventSlug") ?? "world-cup-2026-curacao-vs-cote-divoire-2026-06-25";
  const summaryPath = argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;
  const fetchedAt = new Date().toISOString();

  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
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
    throw new Error(`No live event found for ${eventSlug}.`);
  }

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const rows = buildMobileLiveProviderQuoteSnapshotRows(compactMarkets, fetchedAt);

  let upsertedSnapshots = 0;
  if (apply && rows.length > 0) {
    const results = await upsertReferenceQuoteSnapshots(rows);
    upsertedSnapshots = results.length;
  }

  const summary = {
    applied: apply,
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      liveStatus: event.liveStatus,
    },
    compactMarketCount: compactMarkets.length,
    providerSnapshotRows: rows.length,
    upsertedSnapshots,
    fetchedAt,
    preview: compactMarkets.slice(0, 6).map((market) => ({
      marketId: market.id,
      title: market.title,
      marketType: market.marketType,
      period: market.period,
      line: market.line?.toString() ?? null,
      outcomeCount: market.outcomes.length,
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
