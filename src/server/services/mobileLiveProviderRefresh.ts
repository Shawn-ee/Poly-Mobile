import { prisma } from "@/lib/db";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";
import { refreshPolymarketOrderbookDepthSnapshots } from "@/server/services/polymarketOrderbookDepthSnapshots";
import { refreshPolymarketPriceHistorySnapshots } from "@/server/services/polymarketPriceHistorySnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";
import { buildMobileLiveProviderQuoteSnapshotRows } from "@/server/services/mobileLiveProviderQuoteSnapshotSeeding";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { assessMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";
import { extractProviderFixtureMetadataFromEventMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";
import { refreshOpticOddsLineQuoteSnapshots } from "@/server/services/mobileLiveOpticOddsLineIngestion";

export type MobileLiveProviderRefreshOptions = {
  eventSlug: string;
  allowContractProofFallback?: boolean;
  lineProviderFetchImpl?: typeof fetch;
  providerDepthFetchImpl?: typeof fetch;
  providerHistoryFetchImpl?: typeof fetch;
};

const READY_AFTER_SECONDS = 60;
const STALE_AFTER_SECONDS = 90;

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
  const refreshStartedAt = new Date().toISOString();
  const compactMarkets = await loadCompactLiveMarkets(options.eventSlug);
  const providerFixture = await loadProviderFixtureMetadata(options.eventSlug);
  const compactMarketIds = compactMarkets.map((market) => market.id);
  const mappingReadiness = assessMobileLiveProviderMappingReadiness({
    eventSlug: options.eventSlug,
    providerFixture,
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
        fetchImpl: options.providerDepthFetchImpl,
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
  const providerHistoryReport = polymarketMappedMarkets.length
    ? await refreshPolymarketPriceHistorySnapshots({
        marketIds: polymarketMappedMarkets.map((market) => market.id),
        interval: "1d",
        fidelityMinutes: 5,
        fetchImpl: options.providerHistoryFetchImpl,
      })
    : {
        generatedAt: new Date().toISOString(),
        source: "polymarket-clob-prices-history",
        interval: "1d",
        fidelityMinutes: 5,
        requestedMarketCount: 0,
        refreshedCount: 0,
        snapshotsCreated: 0,
        skippedCount: 0,
        refreshed: [],
        skipped: [],
      };
  const lineProviderReport = await refreshOpticOddsLineQuoteSnapshots({
    eventSlug: options.eventSlug,
    providerFixture,
    compactMarkets,
    fetchImpl: options.lineProviderFetchImpl,
  });

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
  const postRefreshDepth = await summarizeCompactDepthSnapshots(compactMarketIds);
  const postRefreshHistory = await summarizeCompactChartHistory(compactMarketIds);
  const lineFamilyCoverage = await summarizeLineFamilyProviderCoverage({
    compactMarkets,
    mappingReadiness,
  });
  const aggregateStatus = aggregateLifecycleStatus([
    postRefresh.lifecycle.status,
    postRefreshDepth.lifecycle.status,
    postRefreshHistory.lifecycle.status,
  ]);
  const refreshCompletedAt = new Date().toISOString();
  const providerLifecycle = {
    source: "mobile-live-provider-refresh",
    status: aggregateStatus,
    generatedAt: refreshCompletedAt,
    refreshStartedAt,
    refreshCompletedAt,
    refreshStarted: true,
    refreshing: false,
    refreshStatus: "completed" as const,
    quote: postRefresh.lifecycle,
    orderbookDepth: postRefreshDepth.lifecycle,
    chartHistory: postRefreshHistory.lifecycle,
    ready:
      postRefresh.lifecycle.status === "ready" &&
      postRefreshDepth.lifecycle.status === "ready" &&
      postRefreshHistory.lifecycle.status === "ready",
    refreshDue:
      postRefresh.lifecycle.status === "refresh_due" ||
      postRefreshDepth.lifecycle.status === "refresh_due" ||
      postRefreshHistory.lifecycle.status === "refresh_due",
    stale:
      postRefresh.lifecycle.status === "stale" ||
      postRefreshDepth.lifecycle.status === "stale" ||
      postRefreshHistory.lifecycle.status === "stale",
    unavailable:
      postRefresh.lifecycle.status === "unavailable" ||
      postRefreshDepth.lifecycle.status === "unavailable" ||
      postRefreshHistory.lifecycle.status === "unavailable",
    empty:
      postRefresh.lifecycle.empty &&
      postRefreshDepth.lifecycle.empty &&
      postRefreshHistory.lifecycle.empty,
    notReady: aggregateStatus !== "ready",
    fallback: contractProofFallback?.applied === true,
    fallbackApplied: contractProofFallback?.applied === true,
    fallbackReason: contractProofFallback?.reason ?? null,
    reason: aggregateStatus === "ready"
      ? "Provider lifecycle surfaces are ready after refresh."
      : firstLifecycleReason([postRefresh.lifecycle, postRefreshDepth.lifecycle, postRefreshHistory.lifecycle]),
    nextRefreshAt: earliestIso([
      postRefresh.lifecycle.nextRefreshAt,
      postRefreshDepth.lifecycle.nextRefreshAt,
      postRefreshHistory.lifecycle.nextRefreshAt,
    ]),
    lastFetchedAt: latestIso([
      postRefresh.lifecycle.lastFetchedAt,
      postRefreshDepth.lifecycle.lastFetchedAt,
      postRefreshHistory.lifecycle.lastFetchedAt,
    ]),
    lineProvider: {
      source: lineProviderReport.source,
      status: lineProviderReport.status === "skipped" && lineProviderReport.skippedReason === "missing_optic_odds_api_key"
        ? "unconfigured"
        : lineProviderReport.status,
      attempted: lineProviderReport.attempted,
      optional: true,
      blocking: false,
      skippedReason: lineProviderReport.skippedReason ?? null,
      reason: lineProviderReport.skippedReason === "missing_optic_odds_api_key"
        ? "OPTIC_ODDS_API_KEY is optional enrichment and is not configured."
        : lineProviderReport.skippedReason ?? null,
    },
  };

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
    providerHistory: providerHistoryReport,
    lineProvider: lineProviderReport,
    lineFamilyCoverage,
    contractProofFallback,
    providerLifecycle,
    postRefresh,
    postRefreshDepth,
    postRefreshHistory,
  };
}

async function summarizeLineFamilyProviderCoverage(params: {
  compactMarkets: Awaited<ReturnType<typeof loadCompactLiveMarkets>>;
  mappingReadiness: ReturnType<typeof assessMobileLiveProviderMappingReadiness>;
}) {
  const compactMarketIds = params.compactMarkets.map((market) => market.id);
  const [quoteSnapshots, depthSnapshots, chartSnapshots] = await Promise.all([
    compactMarketIds.length
      ? prisma.referenceQuoteSnapshot.findMany({
          where: { marketId: { in: compactMarketIds } },
          select: { marketId: true, source: true, fetchedAt: true },
        })
      : Promise.resolve([]),
    compactMarketIds.length
      ? prisma.referenceOrderbookDepthSnapshot.findMany({
          where: { marketId: { in: compactMarketIds } },
          select: { marketId: true, source: true, fetchedAt: true },
        })
      : Promise.resolve([]),
    compactMarketIds.length
      ? prisma.marketOutcomeSnapshot.findMany({
          where: { marketId: { in: compactMarketIds } },
          select: { marketId: true, outcomeId: true, ts: true },
        })
      : Promise.resolve([]),
  ]);

  const quoteByMarket = groupSnapshotsByMarket(quoteSnapshots);
  const depthByMarket = groupSnapshotsByMarket(depthSnapshots);
  const chartByMarket = groupChartSnapshotsByMarket(chartSnapshots);
  const readinessByMarket = new Map(params.mappingReadiness.markets.map((market) => [market.marketId, market]));

  const markets = params.compactMarkets.map((market) => {
    const readiness = readinessByMarket.get(market.id);
    const quote = lifecycleFromGroupedSnapshots({
      snapshots: quoteByMarket.get(market.id) ?? [],
      fallbackSource: "reference-quote-snapshot",
      unavailableReason: "No provider quote snapshot is available for this compact market.",
    });
    const orderbookDepth = lifecycleFromGroupedSnapshots({
      snapshots: depthByMarket.get(market.id) ?? [],
      fallbackSource: "reference-orderbook-depth-snapshot",
      unavailableReason: "No provider orderbook depth snapshot is available for this compact market.",
    });
    const chartHistory = lifecycleFromGroupedSnapshots({
      snapshots: chartByMarket.get(market.id) ?? [],
      fallbackSource: market.referenceSource === "polymarket"
        ? "polymarket-clob-prices-history"
        : "market-outcome-snapshot",
      unavailableReason: "No provider chart history snapshot is available for this compact market.",
    });
    const surfaces = [quote, orderbookDepth, chartHistory];
    const status = aggregateLifecycleStatus(surfaces.map((surface) => surface.status));
    return {
      marketId: market.id,
      title: market.title,
      selectorKey: compactSelectorKeyForMarket(market),
      marketFamily: marketFamilyForMarket(market),
      marketGroupKey: market.marketGroupKey,
      marketType: market.marketType,
      period: market.period ?? "full-game",
      line: market.line?.toString() ?? null,
      lineValue: marketLineValue(market),
      referenceSource: market.referenceSource ?? null,
      externalSlug: market.externalSlug ?? null,
      externalMarketId: market.externalMarketId ?? null,
      conditionId: market.conditionId ?? null,
      providerRefreshable: readiness?.providerRefreshable === true,
      missingFields: readiness?.missingFields ?? [],
      status,
      ready: surfaces.every((surface) => surface.ready),
      notReady: surfaces.some((surface) => surface.notReady),
      quote,
      orderbookDepth,
      chartHistory,
    };
  });

  const families = Array.from(groupBy(markets, (market) => market.marketFamily).entries()).map(([family, familyMarkets]) => ({
    family,
    marketCount: familyMarkets.length,
    providerRefreshableMarketCount: familyMarkets.filter((market) => market.providerRefreshable).length,
    readyMarketCount: familyMarkets.filter((market) => market.ready).length,
    notReadyMarketCount: familyMarkets.filter((market) => market.notReady).length,
    statuses: Array.from(new Set(familyMarkets.map((market) => market.status))).sort(),
    marketIds: familyMarkets.map((market) => market.marketId),
    selectorKeys: familyMarkets.map((market) => market.selectorKey),
  }));
  const providerMappedMarkets = markets.filter((market) => market.providerRefreshable);
  const readyProviderMappedMarkets = providerMappedMarkets.filter((market) => market.ready);

  return {
    source: "mobile-live-provider-refresh-line-family-coverage",
    generatedAt: new Date().toISOString(),
    compactMarketCount: markets.length,
    familyCount: families.length,
    providerRefreshableFamilyCount: families.filter((family) => family.providerRefreshableMarketCount > 0).length,
    providerRefreshableMarketCount: providerMappedMarkets.length,
    readyProviderRefreshableMarketCount: readyProviderMappedMarkets.length,
    hasProviderMappedBreadth: new Set(providerMappedMarkets.map((market) => market.marketFamily)).size >= 2,
    hasReadyProviderMappedBreadth: new Set(readyProviderMappedMarkets.map((market) => market.marketFamily)).size >= 2,
    optionalLineProviderBlocking: false,
    families,
    markets,
  };
}

async function loadProviderFixtureMetadata(eventSlug: string) {
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    select: { metadata: true },
  });
  return extractProviderFixtureMetadataFromEventMetadata(event?.metadata);
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
      lifecycle: lifecycleSummary({
        source: "reference-quote-snapshot",
        latestAt: null,
        count: 0,
        unavailableReason: "No compact provider quote snapshots were requested.",
      }),
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
    lifecycle: lifecycleSummary({
      source: snapshots.length > 0 ? "reference-quote-snapshot" : "empty",
      latestAt: latest,
      count: snapshots.length,
      unavailableReason: "No provider quote snapshot is available for compact markets.",
    }),
  };
}

async function summarizeCompactDepthSnapshots(marketIds: string[]) {
  if (marketIds.length === 0) {
    return {
      marketCount: 0,
      snapshotCount: 0,
      latestFetchedAt: null,
      oldestFetchedAt: null,
      sourceCount: 0,
      lifecycle: lifecycleSummary({
        source: "reference-orderbook-depth-snapshot",
        latestAt: null,
        count: 0,
        unavailableReason: "No compact provider orderbook depth snapshots were requested.",
      }),
    };
  }

  const snapshots = await prisma.referenceOrderbookDepthSnapshot.findMany({
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
    lifecycle: lifecycleSummary({
      source: snapshots.length > 0 ? "reference-orderbook-depth-snapshot" : "empty",
      latestAt: latest,
      count: snapshots.length,
      unavailableReason: "No provider orderbook depth snapshot is available for compact markets.",
    }),
  };
}

async function summarizeCompactChartHistory(marketIds: string[]) {
  if (marketIds.length === 0) {
    return {
      marketCount: 0,
      snapshotCount: 0,
      latestSnapshotAt: null,
      oldestSnapshotAt: null,
      outcomeCount: 0,
      source: "empty",
      lifecycle: lifecycleSummary({
        source: "market-outcome-snapshot",
        latestAt: null,
        count: 0,
        unavailableReason: "No compact chart history snapshots were requested.",
      }),
    };
  }

  const snapshots = await prisma.marketOutcomeSnapshot.findMany({
    where: { marketId: { in: marketIds } },
    select: { outcomeId: true, ts: true },
  });
  const snapshotTimes = snapshots.map((snapshot) => snapshot.ts.getTime()).sort((a, b) => a - b);
  const oldest = snapshotTimes[0] != null ? new Date(snapshotTimes[0]).toISOString() : null;
  const latest = snapshotTimes[snapshotTimes.length - 1] != null ? new Date(snapshotTimes[snapshotTimes.length - 1]).toISOString() : null;

  return {
    marketCount: marketIds.length,
    snapshotCount: snapshots.length,
    latestSnapshotAt: latest,
    oldestSnapshotAt: oldest,
    outcomeCount: new Set(snapshots.map((snapshot) => snapshot.outcomeId)).size,
    source: snapshots.length > 0 ? "market-outcome-snapshot" : "empty",
    lifecycle: lifecycleSummary({
      source: snapshots.length > 0 ? "market-outcome-snapshot" : "empty",
      latestAt: latest,
      count: snapshots.length,
      unavailableReason: "No chart history snapshot is available for compact markets.",
    }),
  };
}

function lifecycleSummary(params: {
  source: string;
  latestAt: string | null;
  count: number;
  unavailableReason: string;
}) {
  if (!params.latestAt || params.count === 0) {
    return {
      source: params.source,
      status: "unavailable" as const,
      latestAt: null,
      lastFetchedAt: null,
      stalenessSeconds: null,
      readyAfterSeconds: READY_AFTER_SECONDS,
      staleAfterSeconds: STALE_AFTER_SECONDS,
      nextRefreshAt: null,
      shouldRefresh: true,
      ready: false,
      refreshDue: false,
      stale: false,
      unavailable: true,
      empty: true,
      notReady: true,
      fallback: false,
      reason: params.unavailableReason,
    };
  }

  const latestTime = new Date(params.latestAt).getTime();
  const stalenessSeconds = Math.max(0, Math.round((Date.now() - latestTime) / 1000));
  const status = stalenessSeconds > STALE_AFTER_SECONDS
    ? "stale"
    : stalenessSeconds >= READY_AFTER_SECONDS
      ? "refresh_due"
      : "ready";
  const nextRefreshAt = new Date(latestTime + READY_AFTER_SECONDS * 1000).toISOString();

  return {
    source: params.source,
    status,
    latestAt: params.latestAt,
    lastFetchedAt: params.latestAt,
    stalenessSeconds,
    readyAfterSeconds: READY_AFTER_SECONDS,
    staleAfterSeconds: STALE_AFTER_SECONDS,
    nextRefreshAt,
    shouldRefresh: status !== "ready",
    ready: status === "ready",
    refreshDue: status === "refresh_due",
    stale: status === "stale",
    unavailable: false,
    empty: false,
    notReady: status !== "ready",
    fallback: false,
    reason: status === "ready"
      ? "Provider snapshot is fresh."
      : status === "refresh_due"
        ? `Provider snapshot is at least ${READY_AFTER_SECONDS} seconds old and should be refreshed.`
        : `Provider snapshot is older than ${STALE_AFTER_SECONDS} seconds.`,
  };
}

function lifecycleFromGroupedSnapshots(params: {
  snapshots: Array<{ source: string; at: Date }>;
  fallbackSource: string;
  unavailableReason: string;
}) {
  const sorted = params.snapshots.map((snapshot) => snapshot.at.getTime()).sort((a, b) => a - b);
  const latest = sorted[sorted.length - 1] != null ? new Date(sorted[sorted.length - 1]).toISOString() : null;
  return lifecycleSummary({
    source: params.snapshots.length > 0
      ? firstNonEmpty(params.snapshots.map((snapshot) => snapshot.source)) ?? params.fallbackSource
      : params.fallbackSource,
    latestAt: latest,
    count: params.snapshots.length,
    unavailableReason: params.unavailableReason,
  });
}

function groupSnapshotsByMarket<T extends { marketId: string; source: string; fetchedAt: Date }>(snapshots: T[]) {
  const grouped = new Map<string, Array<{ source: string; at: Date }>>();
  for (const snapshot of snapshots) {
    const existing = grouped.get(snapshot.marketId) ?? [];
    existing.push({ source: snapshot.source, at: snapshot.fetchedAt });
    grouped.set(snapshot.marketId, existing);
  }
  return grouped;
}

function groupChartSnapshotsByMarket<T extends { marketId: string | null; ts: Date }>(snapshots: T[]) {
  const grouped = new Map<string, Array<{ source: string; at: Date }>>();
  for (const snapshot of snapshots) {
    if (!snapshot.marketId) continue;
    const existing = grouped.get(snapshot.marketId) ?? [];
    existing.push({ source: "polymarket-clob-prices-history", at: snapshot.ts });
    grouped.set(snapshot.marketId, existing);
  }
  return grouped;
}

function groupBy<T>(items: T[], keyForItem: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = keyForItem(item);
    const existing = grouped.get(key) ?? [];
    existing.push(item);
    grouped.set(key, existing);
  }
  return grouped;
}

function marketFamilyForMarket(market: Awaited<ReturnType<typeof loadCompactLiveMarkets>>[number]) {
  const key = `${market.marketGroupKey ?? ""} ${market.marketType ?? ""} ${market.marketGroupTitle ?? ""}`.toLowerCase();
  if (key.includes("spread") || key.includes("handicap")) return "spread";
  if (key.includes("team") && key.includes("total")) return "team_total";
  if (key.includes("total")) return "total";
  if (key.includes("half")) return "half";
  if (key.includes("correct")) return "correct_score";
  if (key.includes("prop")) return "prop";
  if (key.includes("winner") || key.includes("moneyline") || key.includes("main")) return "moneyline";
  return market.marketType;
}

function marketLineValue(market: Awaited<ReturnType<typeof loadCompactLiveMarkets>>[number]) {
  if (!market.line) return null;
  const value = Number(market.line.toString());
  return Number.isFinite(value) ? value : null;
}

function compactSelectorKeyForMarket(market: Awaited<ReturnType<typeof loadCompactLiveMarkets>>[number]) {
  return [
    market.marketGroupKey ?? marketFamilyForMarket(market),
    market.period ?? "full-game",
    market.line?.toString() ?? "default",
  ].join(":");
}

function earliestIso(values: Array<string | null>) {
  return values
    .filter((value): value is string => typeof value === "string")
    .sort()[0] ?? null;
}

function latestIso(values: Array<string | null>) {
  const sorted = values
    .filter((value): value is string => typeof value === "string")
    .sort();
  return sorted[sorted.length - 1] ?? null;
}

function firstNonEmpty(values: Array<string | null>) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? null;
}

function aggregateLifecycleStatus(statuses: string[]) {
  if (statuses.every((status) => status === "ready")) return "ready" as const;
  if (statuses.some((status) => status === "stale")) return "stale" as const;
  if (statuses.some((status) => status === "unavailable")) return "unavailable" as const;
  return "refresh_due" as const;
}

function firstLifecycleReason(lifecycles: Array<{ status: string; reason: string }>) {
  return lifecycles.find((lifecycle) => lifecycle.status !== "ready")?.reason ?? "Provider lifecycle is not ready after refresh.";
}
