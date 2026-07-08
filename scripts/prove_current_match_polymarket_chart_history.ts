import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { refreshPolymarketPriceHistorySnapshots } from "@/server/services/polymarketPriceHistorySnapshots";
import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";

const DEFAULT_EVENT_SLUG = "argentina-vs-egypt";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-NK-current-match-chart-history/current-match-polymarket-chart-history.json";

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

  if (!event) throw new Error(`Event ${eventSlug} not found.`);

  const providerWinnerMarkets = event.markets.filter((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""}`.toLowerCase();
    return (
      market.referenceSource === "polymarket" &&
      (key.includes("winner") || key.includes("main") || key.includes("match_winner")) &&
      market.outcomes.some((outcome) => outcome.referenceTokenId)
    );
  });

  const lineMarkets = event.markets.filter((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""}`.toLowerCase();
    return key.includes("spread") || key.includes("total");
  });

  const refresh = await refreshPolymarketPriceHistorySnapshots({
    marketIds: providerWinnerMarkets.map((market) => market.id),
    interval: "1d",
    fidelityMinutes: 5,
  });

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const compactMarketIds = compactMarkets.map((market) => market.id);
  const chartSnapshots = compactMarketIds.length
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: { marketId: { in: compactMarketIds } },
        orderBy: [{ marketId: "asc" }, { ts: "asc" }],
        take: compactMarketIds.length * 240,
      })
    : [];
  const liveDetail = await serializeMobileLiveEventDetail({ event, chartSnapshots });
  const primaryMarketId = liveDetail.contract.primaryMarketId as string | null;
  const primaryChart = primaryMarketId
    ? await chartRouteSummary(primaryMarketId)
    : null;

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    eventTitle: event.title,
    source: "polymarket-gamma-local-mapping plus clob.polymarket.com/prices-history",
    providerWinnerMarketCount: providerWinnerMarkets.length,
    providerWinnerMarkets: providerWinnerMarkets.map((market) => ({
      id: market.id,
      title: market.title,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      referenceSource: market.referenceSource,
      tokenizedOutcomeCount: market.outcomes.filter((outcome) => outcome.referenceTokenId).length,
    })),
    lineMarketStatus: {
      totalCount: lineMarkets.length,
      providerBackedCount: lineMarkets.filter((market) => market.referenceSource === "polymarket").length,
      contractFixtureCount: lineMarkets.filter((market) => market.referenceSource === "contract-fixture").length,
      reason: lineMarkets.some((market) => market.referenceSource === "polymarket")
        ? "At least one line market is provider-backed."
        : "Current route-visible spread/totals/team-total markets remain contract fixtures; do not claim provider parity for line markets.",
    },
    refresh: {
      source: refresh.source,
      interval: refresh.interval,
      fidelityMinutes: refresh.fidelityMinutes,
      requestedMarketCount: refresh.requestedMarketCount,
      refreshedCount: refresh.refreshedCount,
      snapshotsCreated: refresh.snapshotsCreated,
      skippedCount: refresh.skippedCount,
      skipped: refresh.skipped,
    },
    liveDetail: {
      primaryMarketId,
      eventChartPointCount: liveDetail.event.chartHistory.length,
      eventChartHistorySource: liveDetail.event.chartHistorySource,
      eventChartHistoryStatus: liveDetail.event.chartHistoryStatus,
      eventChartHistoryLastUpdated: liveDetail.event.chartHistoryLastUpdated,
      contractChartHistorySource: liveDetail.contract.chartHistorySource,
      batchedChartHistorySource: liveDetail.contract.batchedChartHistorySource,
      batchedChartHistoryMarketCount: liveDetail.contract.batchedChartHistoryMarketCount,
      batchedChartHistoryPointCount: liveDetail.contract.batchedChartHistoryPointCount,
      marketStatuses: liveDetail.markets.map((market) => ({
        id: market.id,
        title: market.title,
        referenceSource: market.referenceSource,
        marketType: market.marketType,
        marketGroupKey: market.marketGroupKey,
        chartSource: market.chartHistoryStatus.source,
        chartStatus: market.chartHistoryStatus.status,
        pointCount: market.chartHistoryStatus.pointCount,
      })),
    },
    chartRoute: primaryChart,
    pass:
      providerWinnerMarkets.length >= 3 &&
      refresh.source === "polymarket-clob-prices-history" &&
      refresh.snapshotsCreated > 0 &&
      liveDetail.event.chartHistory.length > 0 &&
      liveDetail.event.chartHistorySource === "polymarket-clob-prices-history" &&
      liveDetail.contract.batchedChartHistorySource === "polymarket-clob-prices-history" &&
      primaryChart?.source === "polymarket-clob-prices-history" &&
      (primaryChart?.historyPointCount ?? 0) > 0,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function chartRouteSummary(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { referenceSource: true },
  });
  const snapshots = await prisma.marketOutcomeSnapshot.findMany({
    where: { marketId },
    orderBy: { ts: "asc" },
  });
  const history = snapshots.flatMap((snapshot) => {
    const price = Number(snapshot.price);
    if (!Number.isFinite(price) || price <= 0) return [];
    return [{
      outcomeId: snapshot.outcomeId,
      timestamp: snapshot.ts.toISOString(),
      price,
      probability: price > 1 ? Math.round(price) : Math.round(price * 100),
    }];
  });
  return {
    marketId,
    source: history.length > 0 && market?.referenceSource === "polymarket"
      ? "polymarket-clob-prices-history"
      : history.length > 0
        ? "market-outcome-snapshot"
        : "empty",
    range: "1D",
    historyPointCount: history.length,
    emptyState: history.length === 0 ? "no-history" : null,
    lastUpdated: history.at(-1)?.timestamp ?? null,
  };
}

function parseArgs(args: string[]) {
  const parsed: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) parsed[match[1]] = match[2];
  }
  return parsed;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
