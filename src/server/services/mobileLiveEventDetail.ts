import { Prisma } from "@prisma/client";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

type EventInput = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  sportKey: string | null;
  leagueKey: string | null;
  eventType: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  startTime: Date | null;
  status: string | null;
  liveStatus: string | null;
  period: string | null;
  clock: string | null;
  homeScore: number | null;
  awayScore: number | null;
  imageUrl?: string | null;
  metadata: Prisma.JsonValue | null;
  markets: MarketInput[];
};

type MarketInput = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  referenceSource?: string | null;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
  sourceUpdatedAt?: Date | null;
  updatedAt?: Date | null;
  marketGroupKey: string | null;
  marketGroupTitle: string | null;
  displayOrder: number;
  line: Prisma.Decimal | null;
  unit: string | null;
  period: string | null;
  marketType: string;
  propCategory: string | null;
  rulesText: string | null;
  outcomes: OutcomeInput[];
};

type OutcomeInput = {
  id: string;
  name: string;
  label: string | null;
  side: string | null;
  displayOrder: number;
  isTradable: boolean;
  referenceTokenId?: string | null;
  referenceOutcomeLabel?: string | null;
};

type SnapshotInput = {
  marketId?: string;
  outcomeId: string;
  ts: Date;
  price: Prisma.Decimal;
};
type OrderbookSnapshot = Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>;
type OrderbookDepthEntry = {
  snapshot: OrderbookSnapshot;
  levels: ReturnType<typeof depthLevelsFromSnapshot>;
};

const MAX_MARKETS = 14;
const MAX_DEPTH_LEVELS = 24;
const STALE_AFTER_SECONDS = 90;
const CHART_REFRESH_TTL_SECONDS = 60;
const DEPTH_BATCH_CACHE_TTL_SECONDS = 3;

type LiveAvailabilityStatus = "ready" | "stale" | "suspended" | "delayed" | "unavailable";
type ProviderLifecycleStatus = "ready" | "refresh_due" | "stale" | "unavailable";
type ProviderLifecycleSegment = {
  source: string;
  status: ProviderLifecycleStatus;
  reason: string;
  nextRefreshAt: string | null;
  lastFetchedAt: string | null;
  stalenessSeconds: number | null;
  shouldRefresh: boolean;
  ready: boolean;
  stale: boolean;
  refreshDue: boolean;
  unavailable: boolean;
  empty: boolean;
  notReady: boolean;
};

const metadataObject = (value: Prisma.JsonValue | null): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const arrayFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key];
  return Array.isArray(value) ? value : [];
};

const probabilityFromPrice = (value: Prisma.Decimal) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return null;
  if (price > 1) return Math.max(1, Math.min(99, Math.round(price)));
  return Math.max(1, Math.min(99, Math.round(price * 100)));
};

const isAdvanceMarketKey = (key: string) =>
  /(^|[\s_-])(to[\s_-]?advance|to[\s_-]?qualify|team[\s_-]?to[\s_-]?qualify|qualify)([\s_-]|$)/i.test(key);

const depthLevelsFromSnapshot = (snapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>) => [
  ...snapshot.bids.map((level) => ({
    outcomeId: level.outcomeId,
    side: "bid" as const,
    price: level.price,
    shares: level.size,
    total: Number((level.price * level.size).toFixed(6)),
  })),
  ...snapshot.asks.map((level) => ({
    outcomeId: level.outcomeId,
    side: "ask" as const,
    price: level.price,
    shares: level.size,
    total: Number((level.price * level.size).toFixed(6)),
  })),
];

const displayPriceFromProviderQuote = (quote: OrderbookSnapshot["providerQuoteOutcomes"][number] | null) => {
  if (!quote) return null;
  if (quote.outcomePrice != null && Number.isFinite(quote.outcomePrice)) return quote.outcomePrice;
  if (quote.bestBid != null && quote.bestAsk != null) return (quote.bestBid + quote.bestAsk) / 2;
  return quote.bestAsk ?? quote.bestBid ?? null;
};

const emptyProviderQuoteSnapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>["providerQuoteSnapshot"] = {
  source: "reference-quote-snapshot",
  status: "unavailable",
  snapshotCount: 0,
  latestFetchedAt: null,
  latestUpdatedAt: null,
  stalenessSeconds: null,
  staleAfterSeconds: STALE_AFTER_SECONDS,
  refreshTtlSeconds: 60,
  nextRefreshAt: null,
  shouldRefresh: true,
  refreshKey: null,
  isStale: false,
  acceptingOrders: false,
  outcomeIds: [],
  sources: [],
  reason: "No provider quote snapshot is available for this market.",
};

const emptyOrderbookSnapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>> = {
  bids: [],
  asks: [],
  depthSource: "empty",
  depthReason: "No local depth, provider orderbook ladder depth, or provider top-of-book depth is available.",
  providerOrderbookDepth: {
    source: "reference-orderbook-depth-snapshot",
    status: "unavailable",
    levelCount: 0,
    snapshotCount: 0,
    latestFetchedAt: null,
    latestUpdatedAt: null,
    stalenessSeconds: null,
    staleAfterSeconds: STALE_AFTER_SECONDS,
    refreshTtlSeconds: 60,
    nextRefreshAt: null,
    shouldRefresh: true,
    isStale: false,
    sources: [],
    reason: "No provider orderbook depth snapshot is available.",
  },
  providerQuoteDepth: {
    source: "reference-quote-snapshot",
    levelCount: 0,
    sizeSource: null,
    isEstimatedSize: false,
    reason: "No provider quote snapshot is available.",
  },
  providerQuoteOutcomes: [],
  providerQuoteSnapshot: emptyProviderQuoteSnapshot,
};

const stringFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const booleanFromMetadata = (metadata: Record<string, unknown>, key: string) =>
  typeof metadata[key] === "boolean" ? metadata[key] as boolean : null;

const isoFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const raw = stringFromMetadata(metadata, key);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const liveStatusFromMetadata = (value: string | null): LiveAvailabilityStatus | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["ready", "stale", "suspended", "delayed", "unavailable"].includes(normalized)) {
    return normalized as LiveAvailabilityStatus;
  }
  return null;
};

const chartHistoryFromSnapshots = (snapshots: SnapshotInput[]) =>
  snapshots.flatMap((snapshot) => {
    const probability = probabilityFromPrice(snapshot.price);
    if (probability == null) return [];
    return [{
      outcomeId: snapshot.outcomeId,
      timestamp: snapshot.ts.toISOString(),
      probability,
    }];
  });

const chartHistoryStatusForMarket = (params: {
  market: MarketInput;
  snapshots: SnapshotInput[];
}) => {
  const history = chartHistoryFromSnapshots(params.snapshots);
  const latestSnapshotTs = params.snapshots.reduce<Date | null>(
    (latest, snapshot) => !latest || snapshot.ts > latest ? snapshot.ts : latest,
    null,
  );
  const lastUpdated = latestSnapshotTs?.toISOString() ?? null;
  const stalenessSeconds = latestSnapshotTs
    ? Math.max(0, Math.round((Date.now() - latestSnapshotTs.getTime()) / 1000))
    : null;
  const isStale = stalenessSeconds != null && stalenessSeconds > STALE_AFTER_SECONDS;
  const shouldRefresh = stalenessSeconds == null || stalenessSeconds >= CHART_REFRESH_TTL_SECONDS;
  const lifecycleStatus = history.length === 0
    ? "unavailable"
    : isStale
      ? "stale"
      : shouldRefresh
        ? "refresh_due"
        : "ready";
  return {
    source: history.length > 0 && params.market.referenceSource === "polymarket"
      ? "polymarket-clob-prices-history"
      : history.length > 0
        ? "market-outcome-snapshot"
        : "empty",
    status: lifecycleStatus,
    pointCount: history.length,
    outcomeCount: new Set(history.map((point) => point.outcomeId)).size,
    lastUpdated,
    stalenessSeconds,
    staleAfterSeconds: STALE_AFTER_SECONDS,
    refreshTtlSeconds: CHART_REFRESH_TTL_SECONDS,
    nextRefreshAt: latestSnapshotTs
      ? new Date(latestSnapshotTs.getTime() + CHART_REFRESH_TTL_SECONDS * 1000).toISOString()
      : null,
    shouldRefresh,
    isStale,
    emptyState: history.length === 0 ? "no-history" : null,
    range: "1D",
    ranges: ["1D", "1W", "1M", "MAX"],
  };
};

const providerSegmentFromQuoteSnapshot = (
  snapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>["providerQuoteSnapshot"],
): ProviderLifecycleSegment => ({
  source: snapshot.sources[0] ?? snapshot.source,
  status: providerLifecycleStatusFromSnapshot(snapshot.status, snapshot.shouldRefresh),
  reason: snapshot.reason,
  nextRefreshAt: snapshot.nextRefreshAt,
  lastFetchedAt: snapshot.latestFetchedAt,
  stalenessSeconds: snapshot.stalenessSeconds,
  shouldRefresh: snapshot.shouldRefresh,
  ready: snapshot.status === "ready" && !snapshot.shouldRefresh,
  stale: snapshot.status === "stale" || snapshot.isStale,
  refreshDue: snapshot.status !== "stale" && snapshot.shouldRefresh,
  unavailable: snapshot.status === "unavailable",
  empty: snapshot.snapshotCount === 0,
  notReady: snapshot.status !== "ready" || snapshot.shouldRefresh,
});

const providerSegmentFromDepthSnapshot = (
  snapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>["providerOrderbookDepth"],
): ProviderLifecycleSegment => ({
  source: snapshot.sources[0] ?? snapshot.source,
  status: providerLifecycleStatusFromSnapshot(snapshot.status, snapshot.shouldRefresh),
  reason: snapshot.reason,
  nextRefreshAt: snapshot.nextRefreshAt,
  lastFetchedAt: snapshot.latestFetchedAt,
  stalenessSeconds: snapshot.stalenessSeconds,
  shouldRefresh: snapshot.shouldRefresh,
  ready: snapshot.status === "ready" && !snapshot.shouldRefresh,
  stale: snapshot.status === "stale" || snapshot.isStale,
  refreshDue: snapshot.status !== "stale" && snapshot.shouldRefresh,
  unavailable: snapshot.status === "unavailable",
  empty: snapshot.snapshotCount === 0 || snapshot.levelCount === 0,
  notReady: snapshot.status !== "ready" || snapshot.shouldRefresh,
});

const providerSegmentFromChartStatus = (
  status: ReturnType<typeof chartHistoryStatusForMarket>,
): ProviderLifecycleSegment => ({
  source: status.source,
  status: status.status as ProviderLifecycleStatus,
  reason: status.emptyState === "no-history"
    ? "No provider chart history snapshot is available for this market."
    : status.status === "ready"
      ? "Provider chart history is fresh."
      : status.status === "refresh_due"
        ? `Provider chart history is at least ${CHART_REFRESH_TTL_SECONDS} seconds old and should be refreshed.`
        : `Provider chart history is older than ${STALE_AFTER_SECONDS} seconds.`,
  nextRefreshAt: status.nextRefreshAt,
  lastFetchedAt: status.lastUpdated,
  stalenessSeconds: status.stalenessSeconds,
  shouldRefresh: status.shouldRefresh,
  ready: status.status === "ready" && !status.shouldRefresh,
  stale: status.status === "stale" || status.isStale,
  refreshDue: status.status === "refresh_due" || (status.status !== "stale" && status.shouldRefresh),
  unavailable: status.status === "unavailable",
  empty: status.pointCount === 0,
  notReady: status.status !== "ready" || status.shouldRefresh,
});

const providerLifecycleStatusFromSnapshot = (status: string, shouldRefresh: boolean): ProviderLifecycleStatus => {
  if (status === "ready" && shouldRefresh) return "refresh_due";
  if (status === "ready" || status === "refresh_due" || status === "stale" || status === "unavailable") {
    return status as ProviderLifecycleStatus;
  }
  return "unavailable";
};

const combineProviderLifecycleSegments = (params: {
  source: string;
  quote: ProviderLifecycleSegment;
  orderbookDepth: ProviderLifecycleSegment;
  chartHistory: ProviderLifecycleSegment;
  fallbackApplied?: boolean;
  fallbackReason?: string | null;
}) => {
  const segments = [params.quote, params.orderbookDepth, params.chartHistory];
  const ready = segments.every((segment) => segment.ready);
  const stale = segments.some((segment) => segment.stale);
  const unavailable = segments.some((segment) => segment.unavailable);
  const refreshDue = !stale && !unavailable && segments.some((segment) => segment.refreshDue);
  const empty = segments.every((segment) => segment.empty || segment.unavailable);
  const status: ProviderLifecycleStatus = ready
    ? "ready"
    : stale
      ? "stale"
      : unavailable
        ? "unavailable"
        : "refresh_due";
  const blocker = blockingProviderSegment(segments);
  return {
    source: params.source,
    status,
    ready,
    stale,
    refreshDue,
    refreshing: false,
    refreshStarted: false,
    unavailable,
    empty,
    notReady: !ready,
    fallback: params.fallbackApplied === true,
    fallbackApplied: params.fallbackApplied === true,
    fallbackReason: params.fallbackReason ?? null,
    reason: ready ? "Provider lifecycle surfaces are ready." : blocker?.reason ?? "Provider lifecycle is not ready.",
    nextRefreshAt: earliestIso(segments.map((segment) => segment.nextRefreshAt)),
    lastFetchedAt: latestIso(segments.map((segment) => segment.lastFetchedAt)),
    quote: params.quote,
    orderbookDepth: params.orderbookDepth,
    chartHistory: params.chartHistory,
  };
};

const marketFamilyForMarket = (market: MarketInput) => {
  const key = `${market.marketGroupKey ?? ""} ${market.marketType ?? ""} ${market.marketGroupTitle ?? ""}`.toLowerCase();
  if (key.includes("outright") || key.includes("future")) return "outright";
  if (key.includes("spread") || key.includes("handicap")) return "spread";
  if (key.includes("team") && key.includes("total")) return "team_total";
  if (key.includes("total")) return "total";
  if (key.includes("half")) return "half";
  if (key.includes("correct")) return "correct_score";
  if (key.includes("prop")) return "prop";
  if (key.includes("winner") || key.includes("moneyline") || key.includes("main")) return "moneyline";
  return market.marketType;
};

const isOutrightEventType = (value: string | null | undefined) => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  return ["future", "futures", "outright", "outrights"].includes(normalized);
};

const mobileMarketContractForMarket = (market: MarketInput, event: EventInput) => {
  const isOutright = isOutrightEventType(event.eventType);
  return {
    marketGroupKey: isOutright ? "outrights" : market.marketGroupKey,
    marketGroupTitle: isOutright ? "Outrights" : market.marketGroupTitle,
    marketType: isOutright ? "outright" : market.marketType,
  };
};

const marketLineValue = (market: MarketInput) => {
  if (!market.line) return null;
  const value = Number(market.line.toString());
  return Number.isFinite(value) ? value : null;
};

const compactSelectorKeyForMarket = (market: MarketInput, event: EventInput) => [
  mobileMarketContractForMarket(market, event).marketGroupKey ?? marketFamilyForMarket(market),
  market.period ?? "full-game",
  market.line?.toString() ?? "default",
].join(":");

const compactDisplayLabelForMarket = (market: MarketInput, event: EventInput) => {
  const mobileContract = mobileMarketContractForMarket(market, event);
  const parts = [
    mobileContract.marketGroupTitle ?? mobileContract.marketType,
    market.period && market.period !== "full-game" ? market.period : null,
    market.line?.toString() ?? null,
  ].filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" ") : market.title;
};

const selectionContractForMarket = (market: MarketInput, event: EventInput, chartStatus: ReturnType<typeof chartHistoryStatusForMarket>) => {
  const mobileContract = mobileMarketContractForMarket(market, event);
  return {
    selectorKey: compactSelectorKeyForMarket(market, event),
    marketId: market.id,
    marketGroupKey: mobileContract.marketGroupKey,
    marketGroupId: mobileContract.marketGroupKey,
    marketGroupTitle: mobileContract.marketGroupTitle,
    marketType: mobileContract.marketType,
    marketFamily: marketFamilyForMarket(market),
    displayLabel: compactDisplayLabelForMarket(market, event),
    period: market.period ?? "full-game",
    line: market.line?.toString() ?? null,
    lineValue: marketLineValue(market),
    unit: market.unit,
    chart: {
      targetMarketId: market.id,
      status: chartStatus.status,
      source: chartStatus.source,
      pointCount: chartStatus.pointCount,
      outcomeCount: chartStatus.outcomeCount,
      range: chartStatus.range,
      ranges: chartStatus.ranges,
      emptyState: chartStatus.emptyState,
    },
    outcomes: market.outcomes.map((outcome) => ({
      outcomeId: outcome.id,
      id: outcome.id,
      side: outcome.side,
      label: outcome.label ?? outcome.name,
      tokenId: outcome.referenceTokenId,
      referenceTokenId: outcome.referenceTokenId,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
      isTradable: outcome.isTradable,
    })),
  };
};

const orderbookIdentityForMarket = (params: {
  market: MarketInput;
  event: EventInput;
  depth: OrderbookDepthEntry;
  chartStatus: ReturnType<typeof chartHistoryStatusForMarket>;
}) => {
  const selector = selectionContractForMarket(params.market, params.event, params.chartStatus);
  const depth = params.depth.snapshot;
  const refreshedAt = depth.providerOrderbookDepth.latestFetchedAt
    ?? depth.providerQuoteSnapshot.latestFetchedAt
    ?? params.market.sourceUpdatedAt?.toISOString()
    ?? params.market.updatedAt?.toISOString()
    ?? null;
  const depthStatus = depth.providerOrderbookDepth.status !== "unavailable"
    ? depth.providerOrderbookDepth.status
    : depth.depthSource === "local-orderbook"
      ? "ready"
      : depth.providerQuoteSnapshot.status;

  return {
    route: `/api/orderbook/${encodeURIComponent(params.market.id)}/book`,
    marketId: params.market.id,
    marketGroupId: params.market.marketGroupKey,
    marketGroupKey: params.market.marketGroupKey,
    selectorKey: selector.selectorKey,
    marketFamily: selector.marketFamily,
    period: selector.period,
    line: selector.line,
    lineValue: selector.lineValue,
    outcomeIds: params.market.outcomes.map((outcome) => outcome.id),
    tokenIds: params.market.outcomes.map((outcome) => outcome.referenceTokenId).filter((tokenId): tokenId is string => Boolean(tokenId)),
    providerSource: depth.providerQuoteSnapshot.sources[0] ?? depth.providerOrderbookDepth.sources[0] ?? params.market.referenceSource ?? null,
    providerStatus: depth.providerQuoteSnapshot.status,
    depthSource: depth.depthSource,
    depthStatus,
    depthProviderSource: depth.providerOrderbookDepth.source,
    depthProviderStatus: depth.providerOrderbookDepth.status,
    depthProviderSources: depth.providerOrderbookDepth.sources,
    refreshedAt,
    staleAfterSeconds: depth.providerOrderbookDepth.staleAfterSeconds,
    refreshTtlSeconds: depth.providerOrderbookDepth.refreshTtlSeconds,
    nextRefreshAt: depth.providerOrderbookDepth.nextRefreshAt ?? depth.providerQuoteSnapshot.nextRefreshAt,
    shouldRefresh: depth.providerOrderbookDepth.shouldRefresh || depth.providerQuoteSnapshot.shouldRefresh,
    isStale: depth.providerOrderbookDepth.isStale || depth.providerQuoteSnapshot.isStale,
    ready: depth.depthSource !== "empty" && depthStatus === "ready",
    reason: depth.depthReason,
  };
};

const availabilityForMarket = (market: MarketInput) => {
  const normalizedStatus = market.status.toUpperCase();
  const sourceDate = market.sourceUpdatedAt ?? market.updatedAt ?? null;
  const lastUpdated = sourceDate?.toISOString() ?? null;
  const stalenessSeconds = lastUpdated
    ? Math.max(0, Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000))
    : null;
  const isStale = stalenessSeconds != null && stalenessSeconds > STALE_AFTER_SECONDS;
  const isSuspended = ["PAUSED", "SUSPENDED", "HALTED"].includes(normalizedStatus);
  const isDelayed = normalizedStatus === "UPCOMING";
  const status: LiveAvailabilityStatus = isSuspended
    ? "suspended"
    : isDelayed
      ? "delayed"
      : !lastUpdated
        ? "unavailable"
        : isStale
          ? "stale"
          : normalizedStatus === "LIVE"
            ? "ready"
            : "unavailable";
  const reason = status === "ready"
    ? "Market orderbook data is fresh."
    : status === "stale"
      ? `Latest market update is older than ${STALE_AFTER_SECONDS} seconds.`
      : status === "suspended"
        ? "Market status is suspended or paused."
        : status === "delayed"
          ? "Market has not opened yet."
          : "No market update timestamp is available.";

  return {
    source: market.sourceUpdatedAt ? "market-source-updated-at" : market.updatedAt ? "market-updated-at" : "unknown",
    status,
    marketStatus: normalizedStatus,
    lastUpdated,
    stalenessSeconds,
    staleAfterSeconds: STALE_AFTER_SECONDS,
    isStale: status === "stale",
    isSuspended: status === "suspended",
    isDelayed: status === "delayed",
    reason,
  };
};

const groupRank = (market: MarketInput) => {
  const key = `${market.marketGroupKey ?? ""} ${market.marketType ?? ""} ${market.marketGroupTitle ?? ""} ${market.title}`.toLowerCase();
  if (key.includes("main") || key.includes("winner") || key.includes("moneyline")) return 0;
  if (key.includes("spread") || key.includes("handicap")) return 1;
  if (key.includes("total")) return 2;
  if (key.includes("half")) return 3;
  if (key.includes("correct")) return 4;
  if (key.includes("prop")) return 8;
  return 5;
};

export const selectCompactLiveMarkets = (markets: MarketInput[]) =>
  {
    const sorted = [...markets]
      .filter((market) => market.outcomes.length > 0)
      .sort((left, right) => {
      const rank = groupRank(left) - groupRank(right);
      if (rank !== 0) return rank;
      return left.displayOrder - right.displayOrder;
      });
    const selected: MarketInput[] = [];
    const addFirst = (predicate: (market: MarketInput) => boolean) => {
      const match = sorted.find(predicate);
      if (match && !selected.some((market) => market.id === match.id)) selected.push(match);
    };
    const lineMatches = (market: MarketInput, target: number) => Number(market.line?.toString()) === target;
    const marketKey = (market: MarketInput) =>
      `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title}`.toLowerCase();

    addFirst((market) => {
      const key = marketKey(market);
      return isAdvanceMarketKey(key);
    });
    addFirst((market) => groupRank(market) === 0);
    addFirst((market) => market.marketType === "spread" && lineMatches(market, 1.5));
    addFirst((market) => ["total_goals", "totals"].includes(market.marketType) && lineMatches(market, 2.5));
    addFirst((market) => market.marketType === "team_total_goals" && lineMatches(market, 1.5));
    addFirst((market) => market.period === "first-half" && ["match_winner_1x2", "moneyline", "winner"].includes(market.marketType));
    addFirst((market) => market.period === "second-half" && ["match_winner_1x2", "moneyline", "winner"].includes(market.marketType));

    for (const market of sorted) {
      if (selected.length >= MAX_MARKETS) break;
      if (!selected.some((item) => item.id === market.id)) selected.push(market);
    }

    return selected;
  };

export async function serializeMobileLiveEventDetail(input: {
  event: EventInput;
  chartSnapshots: SnapshotInput[];
}) {
  const generatedAt = new Date().toISOString();
  const markets = selectCompactLiveMarkets(input.event.markets);
  const primaryMarket = markets.find((market) => groupRank(market) === 0) ?? markets[0] ?? null;
  const primaryMarketId = primaryMarket?.id ?? null;
  const chartSnapshotsByMarketId = new Map<string, SnapshotInput[]>();
  for (const snapshot of input.chartSnapshots) {
    const marketId = snapshot.marketId ?? primaryMarketId;
    if (!marketId) continue;
    const existing = chartSnapshotsByMarketId.get(marketId) ?? [];
    existing.push(snapshot);
    chartSnapshotsByMarketId.set(marketId, existing);
  }
  const metadata = metadataObject(input.event.metadata);
  const mobileLiveDetail = metadataObject(metadata.mobileLiveDetail as Prisma.JsonValue | null);
  const liveStats = arrayFromMetadata(metadata, "liveStats").length
    ? arrayFromMetadata(metadata, "liveStats")
    : arrayFromMetadata(mobileLiveDetail, "liveStats");
  const liveDataMetadata = metadataObject(mobileLiveDetail.liveDataStatus as Prisma.JsonValue | null);

  const depthEntries = await Promise.all(
    markets.map(async (market) => {
      const snapshot = await buildPublicOrderbookSnapshot({ marketId: market.id, maxLevels: MAX_DEPTH_LEVELS });
      return [market.id, { snapshot, levels: depthLevelsFromSnapshot(snapshot) }] as const;
    }),
  );
  const depthByMarketId = new Map(depthEntries);
  const primaryDepthLevels = primaryMarket ? depthByMarketId.get(primaryMarket.id)?.levels ?? [] : [];
  const batchedOrderbookDepthMarketCount = Array.from(depthByMarketId.values()).filter((entry) => entry.levels.length > 0).length;
  const providerSnapshots = Array.from(depthByMarketId.values()).map((entry) => entry.snapshot.providerQuoteSnapshot);
  const batchedProviderQuoteSnapshotMarketCount = providerSnapshots.filter((snapshot) => snapshot.status !== "unavailable").length;
  const batchedProviderQuoteSnapshotReadyCount = providerSnapshots.filter((snapshot) => snapshot.status === "ready").length;
  const batchedProviderQuoteSnapshotStaleCount = providerSnapshots.filter((snapshot) => snapshot.status === "stale").length;
  const batchedProviderQuoteSnapshotRefreshDueCount = providerSnapshots.filter((snapshot) => snapshot.shouldRefresh).length;
  const batchedProviderQuoteSnapshotNextRefreshAt = providerSnapshots
    .map((snapshot) => snapshot.nextRefreshAt)
    .filter((value): value is string => typeof value === "string")
    .sort()[0] ?? null;
  const providerDepthSnapshots = Array.from(depthByMarketId.values()).map((entry) => entry.snapshot.providerOrderbookDepth);
  const batchedProviderOrderbookDepthMarketCount = providerDepthSnapshots.filter((snapshot) => snapshot.status !== "unavailable").length;
  const batchedProviderOrderbookDepthReadyCount = providerDepthSnapshots.filter((snapshot) => snapshot.status === "ready").length;
  const batchedProviderOrderbookDepthStaleCount = providerDepthSnapshots.filter((snapshot) => snapshot.status === "stale").length;
  const batchedProviderOrderbookDepthRefreshDueCount = providerDepthSnapshots.filter((snapshot) => snapshot.shouldRefresh).length;

  const emptyDepthEntry: OrderbookDepthEntry = { snapshot: emptyOrderbookSnapshot, levels: [] };
  const serializedMarkets = await Promise.all(
    markets.map(async (market) => {
      const depth = depthByMarketId.get(market.id) ?? emptyDepthEntry;
      const marketChartSnapshots = chartSnapshotsByMarketId.get(market.id) ?? [];
      const chartHistoryStatus = chartHistoryStatusForMarket({ market, snapshots: marketChartSnapshots });
      const providerLifecycle = combineProviderLifecycleSegments({
        source: "mobile-live-detail-market",
        quote: providerSegmentFromQuoteSnapshot(depth.snapshot.providerQuoteSnapshot),
        orderbookDepth: providerSegmentFromDepthSnapshot(depth.snapshot.providerOrderbookDepth),
        chartHistory: providerSegmentFromChartStatus(chartHistoryStatus),
      });
      const marketAvailability = availabilityForMarket(market);
      const providerLastFetchedAt = providerLifecycle.lastFetchedAt ?? marketAvailability.lastUpdated;
      const providerStalenessSeconds = providerLastFetchedAt
        ? Math.max(0, Math.round((Date.now() - new Date(providerLastFetchedAt).getTime()) / 1000))
        : null;
      const providerBackedMarket = Boolean(market.referenceSource || market.externalMarketId || market.conditionId);
      const effectiveAvailability = providerBackedMarket
        && !providerLifecycle.ready
        ? {
            ...marketAvailability,
            source: "provider-lifecycle",
            status: providerLifecycle.unavailable ? "unavailable" as const : "stale" as const,
            lastUpdated: providerLastFetchedAt,
            stalenessSeconds: providerStalenessSeconds,
            isStale: providerLifecycle.stale || providerLifecycle.refreshDue,
            isSuspended: false,
            isDelayed: false,
            reason: providerLifecycle.reason,
          }
        : providerLifecycle.ready
        && marketAvailability.status !== "ready"
        ? {
            ...marketAvailability,
            source: "provider-lifecycle",
            status: "ready" as const,
            lastUpdated: providerLastFetchedAt,
            stalenessSeconds: providerStalenessSeconds,
            isStale: false,
            isSuspended: false,
            isDelayed: false,
            reason: providerLifecycle.reason,
          }
        : marketAvailability;
      const bidByOutcome = new Map(depth.snapshot.bids.map((level) => [level.outcomeId, level]));
      const askByOutcome = new Map(depth.snapshot.asks.map((level) => [level.outcomeId, level]));
      const providerQuoteByOutcome = new Map(depth.snapshot.providerQuoteOutcomes.map((quote) => [quote.outcomeId, quote]));
      return {
        id: market.id,
        title: market.title,
        description: market.description,
        status: market.status,
        marketGroupKey: mobileMarketContractForMarket(market, input.event).marketGroupKey,
        marketGroupId: mobileMarketContractForMarket(market, input.event).marketGroupKey,
        marketGroupTitle: mobileMarketContractForMarket(market, input.event).marketGroupTitle,
        displayOrder: market.displayOrder,
        marketType: mobileMarketContractForMarket(market, input.event).marketType,
        period: market.period,
        line: market.line?.toString() ?? null,
        unit: market.unit,
        referenceSource: market.referenceSource,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        propCategory: market.propCategory,
        availability: effectiveAvailability,
        liquidity: depth.levels.length ? depth.levels.reduce((sum, level) => sum + level.total, 0) : null,
        chartHistory: chartHistoryFromSnapshots(marketChartSnapshots),
        chartHistoryStatus,
        providerLifecycle,
        selection: selectionContractForMarket(market, input.event, chartHistoryStatus),
        orderbookIdentity: orderbookIdentityForMarket({ market, event: input.event, depth, chartStatus: chartHistoryStatus }),
        orderbookDepth: depth.levels,
        orderbookDepthSource: depth.snapshot.depthSource,
        orderbookDepthStatus: depth.snapshot.providerOrderbookDepth.status !== "unavailable"
          ? depth.snapshot.providerOrderbookDepth.status
          : depth.snapshot.depthSource === "local-orderbook"
            ? "ready"
            : depth.snapshot.providerQuoteSnapshot.status,
        providerOrderbookDepth: depth.snapshot.providerOrderbookDepth,
        providerQuoteSnapshot: depth.snapshot.providerQuoteSnapshot,
        rulesText: market.rulesText,
        event: null,
        outcomes: market.outcomes.map((outcome) => {
          const bid = bidByOutcome.get(outcome.id) ?? null;
          const ask = askByOutcome.get(outcome.id) ?? null;
          const providerQuote = providerQuoteByOutcome.get(outcome.id) ?? null;
          const bestBid = providerQuote?.bestBid ?? bid?.price ?? null;
          const bestAsk = providerQuote?.bestAsk ?? ask?.price ?? null;
          const providerPrice = displayPriceFromProviderQuote(providerQuote);
          const price = providerPrice ?? (bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : bestAsk ?? bestBid ?? 0.5);
          return {
            id: outcome.id,
            name: outcome.name,
            label: outcome.label ?? outcome.name,
            side: outcome.side,
            tokenId: outcome.referenceTokenId,
            referenceTokenId: outcome.referenceTokenId,
            referenceOutcomeLabel: outcome.referenceOutcomeLabel,
            price,
            bestBid,
            bestAsk,
            bestBidSize: bid?.size ?? null,
            bestAskSize: ask?.size ?? null,
            isTradable: outcome.isTradable,
          };
        }),
      };
    }),
  );

  const primaryChartSnapshots = primaryMarketId ? chartSnapshotsByMarketId.get(primaryMarketId) ?? [] : [];
  const chartHistory = chartHistoryFromSnapshots(primaryChartSnapshots);
  const latestSnapshotTs = primaryChartSnapshots.reduce<Date | null>(
    (latest, snapshot) => !latest || snapshot.ts > latest ? snapshot.ts : latest,
    null,
  );
  const metadataLastUpdated = isoFromMetadata(liveDataMetadata, "lastUpdated");
  const lastUpdated = metadataLastUpdated ?? latestSnapshotTs?.toISOString() ?? null;
  const stalenessSeconds = lastUpdated
    ? Math.max(0, Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000))
    : null;
  const metadataStatus = liveStatusFromMetadata(stringFromMetadata(liveDataMetadata, "status"));
  const isSuspended = booleanFromMetadata(liveDataMetadata, "isSuspended") ?? input.event.markets.every((market) => market.status === "SUSPENDED");
  const isDelayed = booleanFromMetadata(liveDataMetadata, "isDelayed") ?? false;
  const isStale = booleanFromMetadata(liveDataMetadata, "isStale") ?? (stalenessSeconds != null && stalenessSeconds > STALE_AFTER_SECONDS);
  const liveDataStatus: LiveAvailabilityStatus = metadataStatus
    ?? (isSuspended ? "suspended" : isDelayed ? "delayed" : !lastUpdated ? "unavailable" : isStale ? "stale" : "ready");
  const liveDataReason = stringFromMetadata(liveDataMetadata, "reason")
    ?? (liveDataStatus === "unavailable"
      ? "No provider timestamp available."
      : liveDataStatus === "stale"
        ? `Latest provider update is older than ${STALE_AFTER_SECONDS} seconds.`
        : liveDataStatus === "suspended"
          ? "Provider or market has suspended live trading."
          : liveDataStatus === "delayed"
            ? "Provider marks this live feed as delayed."
          : "Provider data is fresh.");
  const providerLifecycleSegments = serializedMarkets.map((market) => market.providerLifecycle);
  const eventProviderQuote = combineProviderSegments(providerLifecycleSegments.map((market) => market.quote), "reference-quote-snapshot");
  const eventProviderDepth = combineProviderSegments(providerLifecycleSegments.map((market) => market.orderbookDepth), "reference-orderbook-depth-snapshot");
  const eventProviderChart = combineProviderSegments(providerLifecycleSegments.map((market) => market.chartHistory), "market-outcome-snapshot");
  const providerLifecycle = combineProviderLifecycleSegments({
    source: "mobile-live-detail",
    quote: eventProviderQuote,
    orderbookDepth: eventProviderDepth,
    chartHistory: eventProviderChart,
  });
  const routeLifecycleLiveStatus: LiveAvailabilityStatus = providerLifecycle.status === "ready"
    ? liveDataStatus
    : providerLifecycle.unavailable
      ? "unavailable"
      : "stale";
  const shouldUseRouteLifecycleLiveStatus = (input.event.status ?? "").toLowerCase() === "live" && routeLifecycleLiveStatus !== liveDataStatus;
  const effectiveLiveDataStatus = shouldUseRouteLifecycleLiveStatus ? routeLifecycleLiveStatus : liveDataStatus;
  const effectiveLiveDataReason = shouldUseRouteLifecycleLiveStatus ? providerLifecycle.reason : liveDataReason;
  const effectiveLastUpdated = shouldUseRouteLifecycleLiveStatus ? providerLifecycle.lastFetchedAt ?? lastUpdated : lastUpdated;
  const effectiveStalenessSeconds = effectiveLastUpdated
    ? Math.max(0, Math.round((Date.now() - new Date(effectiveLastUpdated).getTime()) / 1000))
    : stalenessSeconds;
  const primaryKey = `${primaryMarket?.marketType ?? ""} ${primaryMarket?.marketGroupKey ?? ""} ${primaryMarket?.marketGroupTitle ?? ""} ${primaryMarket?.title ?? ""}`.toLowerCase();
  const regulationMarket = serializedMarkets.find((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase();
    return !isAdvanceMarketKey(key) && (key.includes("winner") || key.includes("moneyline") || key.includes("regulation") || key.includes("90"));
  });
  const ruleMarket = regulationMarket ?? primaryMarket;
  const ruleKey = `${ruleMarket?.marketType ?? ""} ${ruleMarket?.marketGroupKey ?? ""} ${ruleMarket?.marketGroupTitle ?? ""} ${ruleMarket?.title ?? ""}`.toLowerCase();
  const eventKey = `${input.event.sportKey ?? ""} ${input.event.leagueKey ?? ""} ${input.event.eventType ?? ""} ${input.event.description ?? ""}`.toLowerCase();
  const isSoccerMatch = eventKey.includes("soccer") || eventKey.includes("football") || eventKey.includes("world_cup");
  const allowDraw = Boolean(primaryMarket?.outcomes.some((outcome) => {
    const value = `${outcome.side ?? ""} ${outcome.label ?? ""} ${outcome.name ?? ""}`.toLowerCase();
    return value.includes("draw") || value.includes("tie");
  }));
  const ruleAllowDraw = Boolean(ruleMarket?.outcomes.some((outcome) => {
    const value = `${outcome.side ?? ""} ${outcome.label ?? ""} ${outcome.name ?? ""}`.toLowerCase();
    return value.includes("draw") || value.includes("tie");
  })) || allowDraw;
  const hasAdvanceMarket = serializedMarkets.some((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase();
    return isAdvanceMarketKey(key);
  });
  const isAdvance = !regulationMarket && isAdvanceMarketKey(ruleKey);
  const isTwoWaySoccerWinner = Boolean(
    isSoccerMatch &&
      !ruleAllowDraw &&
      ruleMarket?.outcomes?.length === 2 &&
      (ruleKey.includes("winner") || ruleKey.includes("moneyline") || ruleKey.includes("main") || ruleKey.includes("match")),
  );
  const includesOvertime = hasAdvanceMarket || isAdvance || isTwoWaySoccerWinner || ruleKey.includes("overtime") || ruleKey.includes("full match");
  const isOutrightEvent = isOutrightEventType(input.event.eventType);
  const marketProfile = isOutrightEvent ? "outright" : isAdvance ? "to_advance" : includesOvertime ? "full_match_with_overtime" : "regulation_90";
  const supportedMarketTypes = Array.from(new Set([
    marketProfile,
    ...(isOutrightEvent ? ["outright"] : []),
    ...(hasAdvanceMarket ? ["to_advance"] : []),
    ...serializedMarkets.flatMap((market) => {
      if (market.period === "first-half") return ["first-half"];
      if (market.period === "second-half") return ["second-half"];
      if (market.outcomes?.some((outcome) => {
        const value = `${outcome.side ?? ""} ${outcome.label ?? ""} ${outcome.name ?? ""}`.toLowerCase();
        return value.includes("draw") || value.includes("tie");
      })) return ["regulation_90"];
      if (market.marketType === "spread") return ["spread"];
      if (["total_goals", "totals"].includes(market.marketType)) return ["totals"];
      if (["team_total_goals", "team-total", "team_total"].includes(market.marketType)) return ["team-total"];
      if (market.propCategory) return ["player-props"];
      return [];
    }),
  ]));

  return {
    event: {
      id: input.event.id,
      slug: input.event.slug ?? input.event.id,
      title: input.event.title,
      description: input.event.description,
      category: input.event.category,
      sportKey: input.event.sportKey,
      leagueKey: input.event.leagueKey,
      eventType: input.event.eventType,
      homeTeamName: input.event.homeTeamName,
      awayTeamName: input.event.awayTeamName,
      startTime: input.event.startTime?.toISOString() ?? null,
      status: input.event.status ?? "scheduled",
      liveStatus: input.event.liveStatus,
      period: input.event.period,
      clock: input.event.clock,
      homeScore: input.event.homeScore,
      awayScore: input.event.awayScore,
      imageUrl: input.event.imageUrl ?? null,
      marketCount: input.event.markets.length,
      activeMarketCount: input.event.markets.filter((market) => market.status === "LIVE").length,
      liveStats,
      liveDataStatus: {
        source: stringFromMetadata(liveDataMetadata, "source") ?? (lastUpdated ? "market-outcome-snapshot" : "unknown"),
        status: effectiveLiveDataStatus,
        lastUpdated: effectiveLastUpdated,
        stalenessSeconds: effectiveStalenessSeconds,
        staleAfterSeconds: STALE_AFTER_SECONDS,
        isStale: effectiveLiveDataStatus === "stale",
        isSuspended: effectiveLiveDataStatus === "suspended",
        isDelayed: effectiveLiveDataStatus === "delayed",
        reason: effectiveLiveDataReason,
      },
      providerLifecycle,
      chartHistory,
      marketProfile,
      resultMode: isOutrightEvent ? "one_winner" : ruleAllowDraw ? "can_draw" : "no_draw",
      gameRules: {
        allowDraw: isOutrightEvent ? false : ruleAllowDraw,
        includesOvertime: isOutrightEvent ? false : includesOvertime,
        description: input.event.description ?? (isOutrightEvent ? "Tournament outright winner market." : isAdvance || isTwoWaySoccerWinner ? "Advance/full-match market with no draw outcome." : ruleAllowDraw ? "Regulation market can settle as draw." : "Winner market has no draw outcome."),
      },
      supportedMarketTypes,
    },
    markets: serializedMarkets,
    providerLifecycle,
    contract: {
      route: "mobile-live-detail",
      generatedAt,
      marketCount: serializedMarkets.length,
      maxMarkets: MAX_MARKETS,
      primaryMarketId: primaryMarket?.id ?? null,
      orderbookDepthSource: primaryDepthLevels.length ? "orderbook-route" : "empty",
      batchedOrderbookDepthSource: batchedOrderbookDepthMarketCount ? "orderbook-route" : "empty",
      batchedOrderbookDepthMarketCount,
      batchedOrderbookDepthRequestedMarketCount: markets.length,
      batchedOrderbookDepthRequestedMarketIds: markets.map((market) => market.id),
      batchedOrderbookDepthMaxLevels: MAX_DEPTH_LEVELS,
      batchedOrderbookDepthCacheTtlSeconds: DEPTH_BATCH_CACHE_TTL_SECONDS,
      batchedProviderOrderbookDepthSource: batchedProviderOrderbookDepthMarketCount ? "reference-orderbook-depth-snapshot" : "empty",
      batchedProviderOrderbookDepthMarketCount,
      batchedProviderOrderbookDepthReadyCount,
      batchedProviderOrderbookDepthStaleCount,
      batchedProviderOrderbookDepthRefreshDueCount,
      batchedProviderQuoteSnapshotSource: batchedProviderQuoteSnapshotMarketCount ? "reference-quote-snapshot" : "empty",
      batchedProviderQuoteSnapshotMarketCount,
      batchedProviderQuoteSnapshotReadyCount,
      batchedProviderQuoteSnapshotStaleCount,
      batchedProviderQuoteSnapshotRefreshDueCount,
      batchedProviderQuoteSnapshotNextRefreshAt,
      chartHistorySource: chartHistory.length ? "market-outcome-snapshot" : "empty",
      batchedChartHistorySource: input.chartSnapshots.length ? "market-outcome-snapshot" : "empty",
      batchedChartHistoryMarketCount: Array.from(chartSnapshotsByMarketId.values()).filter((snapshots) => snapshots.length > 0).length,
      batchedChartHistoryPointCount: input.chartSnapshots.length,
      batchedChartHistoryReadyCount: serializedMarkets.filter((market) => market.chartHistoryStatus.status === "ready").length,
      batchedChartHistoryStaleCount: serializedMarkets.filter((market) => market.chartHistoryStatus.status === "stale").length,
      batchedChartHistoryRefreshDueCount: serializedMarkets.filter((market) => market.chartHistoryStatus.shouldRefresh).length,
      batchedChartHistoryNextRefreshAt: serializedMarkets
        .map((market) => market.chartHistoryStatus.nextRefreshAt)
        .filter((value): value is string => typeof value === "string")
        .sort()[0] ?? null,
      batchedChartHistoryRequestedMarketCount: markets.length,
      batchedChartHistoryRequestedMarketIds: markets.map((market) => market.id),
      liveDataStatus,
      providerLifecycle,
    },
  };
}

function combineProviderSegments(segments: ProviderLifecycleSegment[], fallbackSource: string): ProviderLifecycleSegment {
  if (segments.length === 0) {
    return {
      source: fallbackSource,
      status: "unavailable",
      reason: "No compact provider lifecycle surfaces were requested.",
      nextRefreshAt: null,
      lastFetchedAt: null,
      stalenessSeconds: null,
      shouldRefresh: true,
      ready: false,
      stale: false,
      refreshDue: false,
      unavailable: true,
      empty: true,
      notReady: true,
    };
  }
  const ready = segments.every((segment) => segment.ready);
  const stale = segments.some((segment) => segment.stale);
  const unavailable = segments.some((segment) => segment.unavailable);
  const refreshDue = !stale && !unavailable && segments.some((segment) => segment.refreshDue);
  const empty = segments.every((segment) => segment.empty || segment.unavailable);
  const status: ProviderLifecycleStatus = ready
    ? "ready"
    : stale
      ? "stale"
      : unavailable
        ? "unavailable"
        : "refresh_due";
  const blocker = blockingProviderSegment(segments);
  return {
    source: firstNonEmpty(segments.map((segment) => segment.source)) ?? fallbackSource,
    status,
    reason: ready ? "Provider lifecycle segment is ready across compact markets." : blocker?.reason ?? "Provider lifecycle segment is not ready.",
    nextRefreshAt: earliestIso(segments.map((segment) => segment.nextRefreshAt)),
    lastFetchedAt: latestIso(segments.map((segment) => segment.lastFetchedAt)),
    stalenessSeconds: maxNumber(segments.map((segment) => segment.stalenessSeconds)),
    shouldRefresh: segments.some((segment) => segment.shouldRefresh),
    ready,
    stale,
    refreshDue,
    unavailable,
    empty,
    notReady: !ready,
  };
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

function maxNumber(values: Array<number | null>) {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return finite.length ? Math.max(...finite) : null;
}

function blockingProviderSegment(segments: ProviderLifecycleSegment[]) {
  return segments.find((segment) => segment.stale)
    ?? segments.find((segment) => segment.unavailable)
    ?? segments.find((segment) => segment.refreshDue)
    ?? null;
}
