import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

const DEFAULT_EVENT_SLUG = "mobile-provider-refresh-proof-live";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-clob-depth-refresh-proof.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const market = await prisma.market.findFirst({
    where: {
      event: { slug: eventSlug },
      status: "LIVE",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      referenceSource: "polymarket",
    },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  if (!market) {
    throw new Error(`No mapped provider proof market found for ${eventSlug}.`);
  }

  await prisma.referenceOrderbookDepthSnapshot.deleteMany({ where: { marketId: market.id } });
  const before = await buildPublicOrderbookSnapshot({ marketId: market.id, maxLevels: 24 });
  const refresh = await refreshMobileLiveProviderQuoteSnapshots({
    eventSlug,
    allowContractProofFallback: false,
  });
  const after = await buildPublicOrderbookSnapshot({ marketId: market.id, maxLevels: 24 });
  const rowCount = await prisma.referenceOrderbookDepthSnapshot.count({
    where: { marketId: market.id, source: "polymarket-clob" },
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    marketId: market.id,
    marketSlug: market.slug,
    outcomeCount: market.outcomes.length,
    before: summarizeSnapshot(before),
    refresh: {
      providerMappedMarketCount: refresh.providerMappedMarketCount,
      quoteSnapshotsUpdated: refresh.provider.snapshotsUpdated,
      clobDepthRowsUpdated: refresh.providerDepth.depthRowsUpdated,
      clobRefreshedCount: refresh.providerDepth.refreshedCount,
      clobSkippedCount: refresh.providerDepth.skippedCount,
      clobSkipped: refresh.providerDepth.skipped,
    },
    after: summarizeSnapshot(after),
    rowCount,
    pass:
      refresh.providerDepth.depthRowsUpdated > 0 &&
      rowCount > 0 &&
      after.depthSource === "provider-orderbook-depth" &&
      after.providerOrderbookDepth.status === "ready" &&
      after.providerOrderbookDepth.levelCount > 0,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function summarizeSnapshot(snapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>) {
  return {
    depthSource: snapshot.depthSource,
    depthReason: snapshot.depthReason,
    bidCount: snapshot.bids.length,
    askCount: snapshot.asks.length,
    firstBids: snapshot.bids.slice(0, 4),
    firstAsks: snapshot.asks.slice(0, 4),
    providerOrderbookDepth: snapshot.providerOrderbookDepth,
    providerQuoteDepth: snapshot.providerQuoteDepth,
    providerQuoteSnapshot: {
      status: snapshot.providerQuoteSnapshot.status,
      snapshotCount: snapshot.providerQuoteSnapshot.snapshotCount,
      shouldRefresh: snapshot.providerQuoteSnapshot.shouldRefresh,
      sources: snapshot.providerQuoteSnapshot.sources,
    },
  };
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
