import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";

const DEFAULT_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-live-detail-route-probe.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          status: "LIVE",
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  if (!event) throw new Error(`Event not found: ${eventSlug}`);

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const compactMarketIds = compactMarkets.map((market) => market.id);
  const chartSnapshots = compactMarketIds.length
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: { marketId: { in: compactMarketIds } },
        orderBy: [{ marketId: "asc" }, { ts: "asc" }],
        take: compactMarketIds.length * 240,
      })
    : [];
  const started = Date.now();
  const detail = await serializeMobileLiveEventDetail({ event, chartSnapshots });
  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    elapsedMs: Date.now() - started,
    eventTitle: detail.event.title,
    compactMarketCount: detail.contract.marketCount,
    batchedProviderQuoteSnapshotReadyCount: detail.contract.batchedProviderQuoteSnapshotReadyCount,
    batchedProviderOrderbookDepthReadyCount: detail.contract.batchedProviderOrderbookDepthReadyCount,
    batchedProviderOrderbookDepthMarketCount: detail.contract.batchedProviderOrderbookDepthMarketCount,
    orderbookDepthSource: detail.contract.batchedOrderbookDepthSource,
    providerOrderbookDepthSource: detail.contract.batchedProviderOrderbookDepthSource,
    batchedChartHistoryMarketCount: detail.contract.batchedChartHistoryMarketCount,
    batchedChartHistoryPointCount: detail.contract.batchedChartHistoryPointCount,
    chartReadyMarketIds: detail.markets
      .filter((market) => market.chartHistoryStatus.status === "ready")
      .map((market) => market.id),
    pass:
      detail.contract.marketCount >= 3 &&
      detail.contract.batchedProviderQuoteSnapshotReadyCount >= 3 &&
      detail.contract.batchedProviderOrderbookDepthReadyCount >= 3 &&
      detail.contract.batchedChartHistoryMarketCount >= 1 &&
      Date.now() - started < 5000,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
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
