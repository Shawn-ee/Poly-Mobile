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
};

type SnapshotInput = {
  outcomeId: string;
  ts: Date;
  price: Prisma.Decimal;
};

const MAX_MARKETS = 14;
const MAX_DEPTH_LEVELS = 24;
const STALE_AFTER_SECONDS = 90;

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
  const markets = selectCompactLiveMarkets(input.event.markets);
  const primaryMarket = markets.find((market) => groupRank(market) === 0) ?? markets[0] ?? null;
  const metadata = metadataObject(input.event.metadata);
  const mobileLiveDetail = metadataObject(metadata.mobileLiveDetail as Prisma.JsonValue | null);
  const liveStats = arrayFromMetadata(metadata, "liveStats").length
    ? arrayFromMetadata(metadata, "liveStats")
    : arrayFromMetadata(mobileLiveDetail, "liveStats");
  const liveDataMetadata = metadataObject(mobileLiveDetail.liveDataStatus as Prisma.JsonValue | null);

  const primaryDepth = primaryMarket
    ? await buildPublicOrderbookSnapshot({ marketId: primaryMarket.id, maxLevels: MAX_DEPTH_LEVELS })
    : { bids: [], asks: [] };
  const primaryBidByOutcome = new Map(primaryDepth.bids.map((level) => [level.outcomeId, level]));
  const primaryAskByOutcome = new Map(primaryDepth.asks.map((level) => [level.outcomeId, level]));
  const primaryDepthLevels = [
    ...primaryDepth.bids.map((level) => ({
      outcomeId: level.outcomeId,
      side: "bid" as const,
      price: level.price,
      shares: level.size,
      total: Number((level.price * level.size).toFixed(6)),
    })),
    ...primaryDepth.asks.map((level) => ({
      outcomeId: level.outcomeId,
      side: "ask" as const,
      price: level.price,
      shares: level.size,
      total: Number((level.price * level.size).toFixed(6)),
    })),
  ];

  const serializedMarkets = await Promise.all(
    markets.map(async (market) => ({
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
        propCategory: market.propCategory,
        availability: availabilityForMarket(market),
        liquidity:
          market.id === primaryMarket?.id && primaryDepthLevels.length
            ? primaryDepthLevels.reduce((sum, level) => sum + level.total, 0)
            : null,
        orderbookDepth: market.id === primaryMarket?.id ? primaryDepthLevels : [],
        rulesText: market.rulesText,
        event: null,
        outcomes: market.outcomes.map((outcome) => {
          const bid = market.id === primaryMarket?.id ? primaryBidByOutcome.get(outcome.id) : null;
          const ask = market.id === primaryMarket?.id ? primaryAskByOutcome.get(outcome.id) : null;
          const bestBid = bid?.price ?? null;
          const bestAsk = ask?.price ?? null;
          const price = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : bestAsk ?? bestBid ?? 0.5;
          return {
            id: outcome.id,
            name: outcome.name,
            label: outcome.label ?? outcome.name,
            side: outcome.side,
            price,
            bestBid,
            bestAsk,
            bestBidSize: bid?.size ?? null,
            bestAskSize: ask?.size ?? null,
            isTradable: outcome.isTradable,
          };
        }),
      }),
    ),
  );

  const chartHistory = input.chartSnapshots.flatMap((snapshot) => {
    const probability = probabilityFromPrice(snapshot.price);
    if (probability == null) return [];
    return [{
      outcomeId: snapshot.outcomeId,
      timestamp: snapshot.ts.toISOString(),
      probability,
    }];
  });
  const latestSnapshotTs = input.chartSnapshots.reduce<Date | null>(
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
      marketCount: serializedMarkets.length,
      primaryMarketId: primaryMarket?.id ?? null,
      orderbookDepthSource: primaryDepthLevels.length ? "orderbook-route" : "empty",
      chartHistorySource: chartHistory.length ? "market-outcome-snapshot" : "empty",
      liveDataStatus,
    },
  };
}
