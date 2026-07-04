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

const marketFamilyForMarket = (market: MarketInput) => {
  const key = `${market.marketGroupKey ?? ""} ${market.marketType ?? ""} ${market.marketGroupTitle ?? ""}`.toLowerCase();
  if (key.includes("spread") || key.includes("handicap")) return "spread";
  if (key.includes("team") && key.includes("total")) return "team_total";
  if (key.includes("total")) return "total";
  if (key.includes("half")) return "half";
  if (key.includes("correct")) return "correct_score";
  if (key.includes("prop")) return "prop";
  if (key.includes("winner") || key.includes("moneyline") || key.includes("main")) return "moneyline";
  return market.marketType;
};

const marketLineValue = (market: MarketInput) => {
  if (!market.line) return null;
  const value = Number(market.line.toString());
  return Number.isFinite(value) ? value : null;
};

const compactSelectorKeyForMarket = (market: MarketInput) => [
  market.marketGroupKey ?? marketFamilyForMarket(market),
  market.period ?? "full-game",
  market.line?.toString() ?? "default",
].join(":");

const compactDisplayLabelForMarket = (market: MarketInput) => {
  const parts = [
    market.marketGroupTitle ?? market.marketType,
    market.period && market.period !== "full-game" ? market.period : null,
    market.line?.toString() ?? null,
  ].filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" ") : market.title;
};

const selectionContractForMarket = (market: MarketInput, chartStatus: ReturnType<typeof chartHistoryStatusForMarket>) => ({
  selectorKey: compactSelectorKeyForMarket(market),
  marketId: market.id,
  marketGroupKey: market.marketGroupKey,
  marketGroupId: market.marketGroupKey,
  marketGroupTitle: market.marketGroupTitle,
  marketType: market.marketType,
  marketFamily: marketFamilyForMarket(market),
  displayLabel: compactDisplayLabelForMarket(market),
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
});

const orderbookIdentityForMarket = (params: {
  market: MarketInput;
  depth: OrderbookDepthEntry;
  chartStatus: ReturnType<typeof chartHistoryStatusForMarket>;
}) => {
  const selector = selectionContractForMarket(params.market, params.chartStatus);
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

    addFirst((market) => groupRank(market) === 0);
    addFirst((market) => market.marketType === "spread" && lineMatches(market, 1.5));
    addFirst((market) => ["total_goals", "totals"].includes(market.marketType) && lineMatches(market, 2.5));
    addFirst((market) => market.marketType === "team_total_goals" && lineMatches(market, 1.5));
    addFirst((market) => market.period === "first-half" && ["match_winner_1x2", "moneyline"].includes(market.marketType));
    addFirst((market) => market.period === "second-half" && ["match_winner_1x2", "moneyline"].includes(market.marketType));

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
      const bidByOutcome = new Map(depth.snapshot.bids.map((level) => [level.outcomeId, level]));
      const askByOutcome = new Map(depth.snapshot.asks.map((level) => [level.outcomeId, level]));
      return {
        id: market.id,
        title: market.title,
        description: market.description,
        status: market.status,
        marketGroupKey: market.marketGroupKey,
        marketGroupId: market.marketGroupKey,
        marketGroupTitle: market.marketGroupTitle,
        displayOrder: market.displayOrder,
        marketType: market.marketType,
        period: market.period,
        line: market.line?.toString() ?? null,
        unit: market.unit,
        referenceSource: market.referenceSource,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        propCategory: market.propCategory,
        availability: availabilityForMarket(market),
        liquidity: depth.levels.length ? depth.levels.reduce((sum, level) => sum + level.total, 0) : null,
        chartHistory: chartHistoryFromSnapshots(marketChartSnapshots),
        chartHistoryStatus,
        selection: selectionContractForMarket(market, chartHistoryStatus),
        orderbookIdentity: orderbookIdentityForMarket({ market, depth, chartStatus: chartHistoryStatus }),
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
          const bestBid = bid?.price ?? null;
          const bestAsk = ask?.price ?? null;
          const price = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : bestAsk ?? bestBid ?? 0.5;
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
        status: liveDataStatus,
        lastUpdated,
        stalenessSeconds,
        staleAfterSeconds: STALE_AFTER_SECONDS,
        isStale: liveDataStatus === "stale",
        isSuspended: liveDataStatus === "suspended",
        isDelayed: liveDataStatus === "delayed",
        reason: liveDataReason,
      },
      chartHistory,
    },
    markets: serializedMarkets,
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
    },
  };
}
