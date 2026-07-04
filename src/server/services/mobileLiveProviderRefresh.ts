import { prisma } from "@/lib/db";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";
import { refreshPolymarketOrderbookDepthSnapshots } from "@/server/services/polymarketOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";
import { buildMobileLiveProviderQuoteSnapshotRows } from "@/server/services/mobileLiveProviderQuoteSnapshotSeeding";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { assessMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";

export type MobileLiveProviderRefreshOptions = {
  eventSlug: string;
  allowContractProofFallback?: boolean;
};

export async function expireMobileLiveProviderQuoteSnapshots(params: {
  eventSlug: string;
  staleSeconds?: number;
}) {
  const compactMarkets = await loadCompactLiveMarkets(params.eventSlug);
  const marketIds = compactMarkets.map((market) => market.id);
  if (marketIds.length === 0) {
    return {
      eventSlug: params.eventSlug,
      compactMarketCount: 0,
      expiredSnapshotCount: 0,
      staleFetchedAt: null,
    };
  }

  const staleFetchedAt = new Date(Date.now() - (params.staleSeconds ?? 180) * 1000);
  const result = await prisma.referenceQuoteSnapshot.updateMany({
    where: { marketId: { in: marketIds } },
    data: { fetchedAt: staleFetchedAt },
  });

  return {
    eventSlug: params.eventSlug,
    compactMarketCount: compactMarkets.length,
    expiredSnapshotCount: result.count,
    staleFetchedAt: staleFetchedAt.toISOString(),
  };
}

export async function refreshMobileLiveProviderQuoteSnapshots(options: MobileLiveProviderRefreshOptions) {
  const compactMarkets = await loadCompactLiveMarkets(options.eventSlug);
  const compactMarketIds = compactMarkets.map((market) => market.id);
  const mappingReadiness = assessMobileLiveProviderMappingReadiness({
    eventSlug: options.eventSlug,
    compactMarkets,
  });
  const polymarketMappedMarkets = compactMarkets.filter((market) =>
    mappingReadiness.markets.some((readyMarket) => readyMarket.marketId === market.id && readyMarket.providerRefreshable),
  );
  const unsupportedMarkets = mappingReadiness.markets
    .filter((market) => !market.providerRefreshable)
    .map((market) => ({
      marketId: market.marketId,
      title: market.title,
      referenceSource: market.referenceSource,
      externalSlug: market.externalSlug,
      missingFields: market.missingFields,
      recommendedAction: market.recommendedAction,
    }));

  const providerReport = polymarketMappedMarkets.length
    ? await refreshPolymarketReferenceSnapshots({
        marketIds: polymarketMappedMarkets.map((market) => market.id),
      })
    : {
        generatedAt: new Date().toISOString(),
        dryRun: true,
        snapshotWritesApplied: true,
        liveOrdersEnabled: false,
        pollMs: null,
        refreshedCount: 0,
        snapshotsUpdated: 0,
        skippedCount: 0,
        refreshed: [],
        skipped: [],
      };
  const providerDepthReport = polymarketMappedMarkets.length
    ? await refreshPolymarketOrderbookDepthSnapshots({
        marketIds: polymarketMappedMarkets.map((market) => market.id),
      })
    : {
        generatedAt: new Date().toISOString(),
        source: "polymarket-clob",
        maxLevels: 24,
        requestedMarketCount: 0,
        refreshedCount: 0,
        depthRowsUpdated: 0,
        skippedCount: 0,
        refreshed: [],
        skipped: [],
      };

  let contractProofFallback:
    | {
        applied: boolean;
        reason: string;
        snapshotsUpdated: number;
      }
    | null = null;

  if (providerReport.snapshotsUpdated === 0 && options.allowContractProofFallback && compactMarkets.length > 0) {
    const rows = buildMobileLiveProviderQuoteSnapshotRows(compactMarkets, new Date().toISOString());
    const results = await upsertReferenceQuoteSnapshots(rows);
    contractProofFallback = {
      applied: true,
      reason: "local_event_has_no_real_polymarket_market_mapping",
      snapshotsUpdated: results.length,
    };
  }

  const postRefresh = await summarizeCompactProviderSnapshots(compactMarketIds);

  return {
    eventSlug: options.eventSlug,
    generatedAt: new Date().toISOString(),
    compactMarketCount: compactMarkets.length,
    providerMappedMarketCount: polymarketMappedMarkets.length,
    unsupportedMarketCount: unsupportedMarkets.length,
    unsupportedMarkets,
    mappingReadiness,
    provider: {
      source: "polymarket-gamma",
      attempted: polymarketMappedMarkets.length > 0,
      refreshedCount: providerReport.refreshedCount,
      skippedCount: providerReport.skippedCount,
      snapshotsUpdated: providerReport.snapshotsUpdated,
      refreshed: providerReport.refreshed,
      skipped: providerReport.skipped,
    },
    providerDepth: providerDepthReport,
    contractProofFallback,
    postRefresh,
  };
}

async function loadCompactLiveMarkets(eventSlug: string) {
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

  return selectCompactLiveMarkets(event.markets);
}

async function summarizeCompactProviderSnapshots(marketIds: string[]) {
  if (marketIds.length === 0) {
    return {
      marketCount: 0,
      snapshotCount: 0,
      latestFetchedAt: null,
      oldestFetchedAt: null,
      sourceCount: 0,
    };
  }

  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: { marketId: { in: marketIds } },
    select: { source: true, fetchedAt: true },
  });
  const fetchedTimes = snapshots.map((snapshot) => snapshot.fetchedAt.getTime()).sort((a, b) => a - b);
  const oldest = fetchedTimes[0] != null ? new Date(fetchedTimes[0]).toISOString() : null;
  const latest = fetchedTimes[fetchedTimes.length - 1] != null ? new Date(fetchedTimes[fetchedTimes.length - 1]).toISOString() : null;

  return {
    marketCount: marketIds.length,
    snapshotCount: snapshots.length,
    latestFetchedAt: latest,
    oldestFetchedAt: oldest,
    sourceCount: new Set(snapshots.map((snapshot) => snapshot.source)).size,
  };
}
