import type { Event } from "@prisma/client";

type EventCounts = {
  markets?: number | { markets?: number };
};

type EventMarket = {
  status: string;
  title?: string | null;
  marketType?: string | null;
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  period?: string | null;
  propCategory?: string | null;
  outcomes?: Array<{ side?: string | null; label?: string | null; name?: string | null }>;
  referenceMetadata?: unknown;
  outcomeSnapshots?: Array<{
    outcomeId: string;
    ts: Date | string;
    price: { toString(): string } | string | number;
  }>;
};

type SupportedMarketType =
  | "to_advance"
  | "regulation_90"
  | "full_match_with_overtime"
  | "spread"
  | "totals"
  | "team-total"
  | "first-half"
  | "second-half"
  | "player-props";

const metadataObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const arrayFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key];
  return Array.isArray(value) ? value : [];
};

const probabilityFromPrice = (value: { toString(): string } | string | number) => {
  const parsed = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(parsed)) return null;
  if (parsed > 1) return Math.max(1, Math.min(99, Math.round(parsed)));
  return Math.max(1, Math.min(99, Math.round(parsed * 100)));
};

const chartHistoryFromSnapshots = (markets: EventMarket[]) =>
  markets.flatMap((market) =>
    (market.outcomeSnapshots ?? []).flatMap((snapshot) => {
      const probability = probabilityFromPrice(snapshot.price);
      if (probability == null) return [];
      const timestamp = snapshot.ts instanceof Date ? snapshot.ts : new Date(snapshot.ts);
      if (Number.isNaN(timestamp.getTime())) return [];
      const ts = timestamp.toISOString();
      return [{ outcomeId: snapshot.outcomeId, timestamp: ts, probability }];
    }),
  ).sort((left, right) => left.timestamp.localeCompare(right.timestamp));

const isAdvanceMarketKey = (key: string) =>
  /(^|[\s_-])(to[\s_-]?advance|to[\s_-]?qualify|team[\s_-]?to[\s_-]?qualify|qualify)([\s_-]|$)/i.test(key);

const deriveEventMarketRules = (event: { description?: string | null; sportKey?: string | null; leagueKey?: string | null; eventType?: string | null }, markets: EventMarket[]) => {
  const supported = new Set<SupportedMarketType>();
  for (const market of markets) {
    const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase();
    if (isAdvanceMarketKey(key)) supported.add("to_advance");
    if (market.outcomes?.some((outcome) => {
      const value = `${outcome.side ?? ""} ${outcome.label ?? ""} ${outcome.name ?? ""}`.toLowerCase();
      return value.includes("draw") || value.includes("tie");
    })) supported.add("regulation_90");
    if (key.includes("spread") || key.includes("handicap")) supported.add("spread");
    if (key.includes("team") && key.includes("total")) supported.add("team-total");
    else if (key.includes("total")) supported.add("totals");
    if (market.period === "first-half") supported.add("first-half");
    if (market.period === "second-half") supported.add("second-half");
    if (market.propCategory || key.includes("prop")) supported.add("player-props");
  }

  const regulationMarket = markets.find((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase();
    return !isAdvanceMarketKey(key) && (key.includes("main") || key.includes("winner") || key.includes("moneyline") || key.includes("regulation") || key.includes("90"));
  });
  const mainMarket = regulationMarket ??
    markets.find((market) => {
      const key = `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase();
      return key.includes("main") || key.includes("winner") || key.includes("moneyline") || isAdvanceMarketKey(key);
    }) ?? markets[0];
  const mainKey = `${mainMarket?.marketType ?? ""} ${mainMarket?.marketGroupKey ?? ""} ${mainMarket?.marketGroupTitle ?? ""} ${mainMarket?.title ?? ""}`.toLowerCase();
  const eventKey = `${event.sportKey ?? ""} ${event.leagueKey ?? ""} ${event.eventType ?? ""} ${event.description ?? ""}`.toLowerCase();
  const isSoccerMatch = eventKey.includes("soccer") || eventKey.includes("football") || eventKey.includes("world_cup");
  const allowDraw = Boolean(mainMarket?.outcomes?.some((outcome) => {
    const value = `${outcome.side ?? ""} ${outcome.label ?? ""} ${outcome.name ?? ""}`.toLowerCase();
    return value.includes("draw") || value.includes("tie");
  }));
  const hasAdvanceMarket = supported.has("to_advance");
  const isAdvance = !regulationMarket && isAdvanceMarketKey(mainKey);
  const isTwoWaySoccerWinner = Boolean(
    isSoccerMatch &&
      !allowDraw &&
      mainMarket?.outcomes?.length === 2 &&
      (mainKey.includes("winner") || mainKey.includes("moneyline") || mainKey.includes("main") || mainKey.includes("match")),
  );
  const includesOvertime = hasAdvanceMarket || isAdvance || isTwoWaySoccerWinner || mainKey.includes("overtime") || mainKey.includes("full match");
  const marketProfile = isAdvance ? "to_advance" : includesOvertime ? "full_match_with_overtime" : "regulation_90";
  supported.add(marketProfile);

  return {
    marketProfile,
    resultMode: allowDraw ? "can_draw" : "no_draw",
    gameRules: {
      allowDraw,
      includesOvertime,
      description: event.description ?? (isAdvance || isTwoWaySoccerWinner ? "Advance/full-match market with no draw outcome." : allowDraw ? "Regulation market can settle as draw." : "Winner market has no draw outcome."),
    },
    supportedMarketTypes: [...supported],
  };
};

export const serializeEventSummary = (
  event: Pick<
    Event,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "category"
    | "sportKey"
    | "leagueKey"
    | "eventType"
    | "homeTeamName"
    | "awayTeamName"
    | "startTime"
    | "status"
    | "liveStatus"
    | "period"
    | "clock"
    | "homeScore"
    | "awayScore"
    | "source"
    | "externalEventId"
    | "externalSlug"
    | "venue"
    | "image"
    | "imageUrl"
    | "icon"
    | "metadata"
    | "sourceUpdatedAt"
    | "createdAt"
    | "updatedAt"
  > & {
    _count?: EventCounts;
    markets?: EventMarket[];
  },
) => {
  const markets = event.markets ?? [];
  const marketCount =
    typeof event._count?.markets === "number"
      ? event._count.markets
      : typeof event._count?.markets === "object"
        ? event._count.markets.markets ?? markets.length
        : markets.length;
  const activeMarketCount = markets.filter((market) => market.status === "LIVE").length;
  const metadata = metadataObject(event.metadata);
  const mobileLiveDetail = metadataObject(metadata.mobileLiveDetail);
  const liveStats = arrayFromMetadata(metadata, "liveStats").length
    ? arrayFromMetadata(metadata, "liveStats")
    : arrayFromMetadata(mobileLiveDetail, "liveStats");
  const snapshotChartHistory = chartHistoryFromSnapshots(markets);
  const chartHistory = snapshotChartHistory.length
    ? snapshotChartHistory
    : arrayFromMetadata(metadata, "chartHistory").length
    ? arrayFromMetadata(metadata, "chartHistory")
    : arrayFromMetadata(mobileLiveDetail, "chartHistory");
  const marketRules = deriveEventMarketRules(event, markets);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: event.category,
    sportKey: event.sportKey,
    leagueKey: event.leagueKey,
    eventType: event.eventType,
    homeTeamName: event.homeTeamName,
    awayTeamName: event.awayTeamName,
    startTime: event.startTime,
    status: event.status,
    liveStatus: event.liveStatus,
    period: event.period,
    clock: event.clock,
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    source: event.source,
    externalEventId: event.externalEventId,
    externalSlug: event.externalSlug,
    venue: event.venue,
    image: event.image,
    imageUrl: event.imageUrl,
    icon: event.icon,
    sourceUpdatedAt: event.sourceUpdatedAt,
    marketCount,
    activeMarketCount,
    hasGroupedMarkets: Boolean(metadata.referenceGroup),
    liveStats,
    chartHistory,
    marketProfile: marketRules.marketProfile,
    resultMode: marketRules.resultMode,
    gameRules: marketRules.gameRules,
    supportedMarketTypes: marketRules.supportedMarketTypes,
    metadata: event.metadata,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
