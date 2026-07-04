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
  [...markets]
    .filter((market) => market.outcomes.length > 0)
    .sort((left, right) => {
      const rank = groupRank(left) - groupRank(right);
      if (rank !== 0) return rank;
      return left.displayOrder - right.displayOrder;
    })
    .slice(0, MAX_MARKETS);

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
      chartHistory,
    },
    markets: serializedMarkets,
    contract: {
      route: "mobile-live-detail",
      marketCount: serializedMarkets.length,
      primaryMarketId: primaryMarket?.id ?? null,
      orderbookDepthSource: primaryDepthLevels.length ? "orderbook-route" : "empty",
      chartHistorySource: chartHistory.length ? "market-outcome-snapshot" : "empty",
    },
  };
}
