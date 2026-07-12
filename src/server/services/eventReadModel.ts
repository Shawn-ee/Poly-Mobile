import type { Event } from "@prisma/client";
import { normalizeSoccerResultMode, primaryMarketProfileForResultMode } from "@/server/services/soccerMarketSemantics";

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
  | "outright"
  | "to_advance"
  | "regulation_90"
  | "full_match_with_overtime"
  | "spread"
  | "totals"
  | "team-total"
  | "first-half"
  | "second-half"
  | "player-props";

type EventMarketRules = {
  marketProfile: "outright" | "to_advance" | "regulation_90" | "full_match_with_overtime";
  primaryMarketProfile: "outright" | "advance" | "regulation_90";
  resultMode: "one_winner" | "can_draw_90" | "must_advance";
  legacyResultMode: "one_winner" | "can_draw" | "no_draw";
  gameRules: {
    allowDraw: boolean;
    includesOvertime: boolean;
    description: string;
  };
  supportedMarketTypes: SupportedMarketType[];
};

type MarketProfile = EventMarketRules["marketProfile"];
type ResultMode = EventMarketRules["resultMode"];

const MARKET_PROFILES = ["outright", "to_advance", "regulation_90", "full_match_with_overtime"] as const;
const RESULT_MODES = ["one_winner", "can_draw_90", "must_advance"] as const;
const SUPPORTED_MARKET_TYPES = [
  "outright",
  "to_advance",
  "regulation_90",
  "full_match_with_overtime",
  "spread",
  "totals",
  "team-total",
  "first-half",
  "second-half",
  "player-props",
] as const;

const isMarketProfile = (value: unknown): value is MarketProfile =>
  typeof value === "string" && MARKET_PROFILES.includes(value as MarketProfile);

const isResultMode = (value: unknown): value is ResultMode =>
  typeof value === "string" && RESULT_MODES.includes(value as ResultMode);

const legacyResultMode = (value: ResultMode): EventMarketRules["legacyResultMode"] => {
  if (value === "can_draw_90") return "can_draw";
  if (value === "must_advance") return "no_draw";
  return value;
};

const isSupportedMarketType = (value: unknown): value is SupportedMarketType =>
  typeof value === "string" && SUPPORTED_MARKET_TYPES.includes(value as SupportedMarketType);

const metadataObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const arrayFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key];
  return Array.isArray(value) ? value : [];
};

const datePattern = /(20\d{2})[-_/](\d{1,2})[-_/](\d{1,2})/;

const dateOnlyUtc = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const dateFromText = (value: string | null | undefined) => {
  const match = `${value ?? ""}`.match(datePattern);
  if (!match) return null;
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isFinite(timestamp) ? timestamp : null;
};

const eventDate = (event: { startTime?: Date | string | null; externalSlug?: string | null; title?: string | null }) => {
  if (event.startTime) {
    const start = new Date(event.startTime);
    if (!Number.isNaN(start.getTime())) return dateOnlyUtc(start);
  }
  return dateFromText(event.externalSlug) ?? dateFromText(event.title);
};

const isFreshEventDate = (event: { startTime?: Date | string | null; externalSlug?: string | null; title?: string | null }) => {
  const day = eventDate(event);
  return day == null || day >= dateOnlyUtc(new Date());
};

const stringFromMetadata = (metadata: Record<string, unknown>, key: string) => {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

const booleanFromMetadata = (metadata: Record<string, unknown>, key: string) =>
  typeof metadata[key] === "boolean" ? metadata[key] : null;

const displayStatusForSummary = (event: {
  status?: string | null;
  liveStatus?: string | null;
  clock?: string | null;
  startTime?: Date | string | null;
  externalSlug?: string | null;
  title?: string | null;
}, mobileLiveDetail: Record<string, unknown>) => {
  const rawLooksLive = ["live", "active"].includes(`${event.status ?? ""}`.toLowerCase())
    || `${event.liveStatus ?? ""}`.toLowerCase().includes("live")
    || `${event.liveStatus ?? ""}`.toLowerCase() === "in_progress";
  if (!rawLooksLive || `${event.clock ?? ""}`.trim()) return null;

  const liveDataStatus = `${stringFromMetadata(mobileLiveDetail, "status") ?? ""}`.toLowerCase();
  const staleProvider = ["stale", "unavailable", "empty"].includes(liveDataStatus) || booleanFromMetadata(mobileLiveDetail, "isStale") === true;
  if (isFreshEventDate(event) && !staleProvider) return null;

  return {
    mobileStatus: "future" as const,
    label: "Active",
    startsAt: "Time TBD",
    reason: stringFromMetadata(mobileLiveDetail, "reason") ?? "Event has no current live clock or fresh provider status.",
  };
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

const marketKey = (market: EventMarket) =>
  `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase();

const marketHasDrawOutcome = (market: EventMarket) =>
  marketKey(market).includes("draw") ||
  marketKey(market).includes("tie") ||
  Boolean(
    market.outcomes?.some((outcome) => {
      const value = `${outcome.side ?? ""} ${outcome.label ?? ""} ${outcome.name ?? ""}`.toLowerCase();
      return value.includes("draw") || value.includes("tie");
    }),
  );

const isOutrightEventType = (value: string | null | undefined) => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  return ["future", "futures", "outright", "outrights"].includes(normalized);
};

const normalizedSoccerRulesFromMetadata = (metadata: Record<string, unknown>): EventMarketRules | null => {
  const normalizedSoccer = metadataObject(metadata.normalizedSoccer);
  const marketProfile = normalizedSoccer.marketProfile;
  const resultMode = normalizeSoccerResultMode(normalizedSoccer.resultMode);
  const gameRules = metadataObject(normalizedSoccer.gameRules);
  const supportedMarketTypes = normalizedSoccer.supportedMarketTypes;
  if (
    !isMarketProfile(marketProfile) ||
    !isResultMode(resultMode)
  ) {
    return null;
  }

  return {
    marketProfile,
    primaryMarketProfile:
      normalizedSoccer.primaryMarketProfile === "advance" || normalizedSoccer.primaryMarketProfile === "regulation_90" || normalizedSoccer.primaryMarketProfile === "outright"
        ? normalizedSoccer.primaryMarketProfile
        : primaryMarketProfileForResultMode(resultMode),
    resultMode,
    legacyResultMode: legacyResultMode(resultMode),
    gameRules: {
      allowDraw: Boolean(gameRules.allowDraw),
      includesOvertime: Boolean(gameRules.includesOvertime),
      description:
        typeof gameRules.description === "string"
          ? gameRules.description
          : resultMode === "can_draw_90"
            ? "Regulation market can settle as draw."
            : "Winner market has no draw outcome.",
    },
    supportedMarketTypes: Array.isArray(supportedMarketTypes)
      ? supportedMarketTypes.filter(isSupportedMarketType)
      : [marketProfile as SupportedMarketType],
  };
};

const deriveEventMarketRules = (
  event: { description?: string | null; sportKey?: string | null; leagueKey?: string | null; eventType?: string | null },
  markets: EventMarket[],
): EventMarketRules => {
  const supported = new Set<SupportedMarketType>();
  if (isOutrightEventType(event.eventType)) {
    supported.add("outright");
    return {
      marketProfile: "outright",
      primaryMarketProfile: "outright",
      resultMode: "one_winner",
      legacyResultMode: "one_winner",
      gameRules: {
        allowDraw: false,
        includesOvertime: false,
        description: event.description ?? "Tournament outright winner market.",
      },
      supportedMarketTypes: [...supported],
    };
  }

  for (const market of markets) {
    const key = marketKey(market);
    if (isAdvanceMarketKey(key)) supported.add("to_advance");
    if (marketHasDrawOutcome(market)) supported.add("regulation_90");
    if (key.includes("spread") || key.includes("handicap")) supported.add("spread");
    if (key.includes("team") && key.includes("total")) supported.add("team-total");
    else if (key.includes("total")) supported.add("totals");
    if (market.period === "first-half") supported.add("first-half");
    if (market.period === "second-half") supported.add("second-half");
    if (market.propCategory || key.includes("prop")) supported.add("player-props");
  }

  const regulationMarket = markets.find((market) => {
    const key = marketKey(market);
    return !isAdvanceMarketKey(key) && (key.includes("main") || key.includes("winner") || key.includes("moneyline") || key.includes("regulation") || key.includes("90"));
  });
  const mainMarket = regulationMarket ??
    markets.find((market) => {
      const key = marketKey(market);
      return key.includes("main") || key.includes("winner") || key.includes("moneyline") || isAdvanceMarketKey(key);
    }) ?? markets[0];
  const mainKey = mainMarket ? marketKey(mainMarket) : "";
  const eventKey = `${event.sportKey ?? ""} ${event.leagueKey ?? ""} ${event.eventType ?? ""} ${event.description ?? ""}`.toLowerCase();
  const isSoccerMatch = eventKey.includes("soccer") || eventKey.includes("football") || eventKey.includes("world_cup");
  const allowDraw = markets.some(marketHasDrawOutcome);
  const hasAdvanceMarket = supported.has("to_advance");
  const isAdvance = !regulationMarket && isAdvanceMarketKey(mainKey);
  const isTwoWaySoccerWinner = Boolean(
    isSoccerMatch &&
      !allowDraw &&
      mainMarket?.outcomes?.length === 2 &&
      (mainKey.includes("winner") || mainKey.includes("moneyline") || mainKey.includes("main") || mainKey.includes("match")),
  );
  const includesOvertime = hasAdvanceMarket || isAdvance || isTwoWaySoccerWinner || mainKey.includes("overtime") || mainKey.includes("full match");
  const marketProfile: MarketProfile = isAdvance ? "to_advance" : includesOvertime ? "full_match_with_overtime" : "regulation_90";
  const resultMode: ResultMode = allowDraw ? "can_draw_90" : "must_advance";
  supported.add(marketProfile);

  return {
    marketProfile,
    primaryMarketProfile: primaryMarketProfileForResultMode(resultMode),
    resultMode,
    legacyResultMode: legacyResultMode(resultMode),
    gameRules: {
      allowDraw,
      includesOvertime,
      description: event.description ?? (isAdvance || isTwoWaySoccerWinner ? "Advance/full-match market with no draw outcome." : allowDraw ? "Regulation market can settle as draw." : "Winner market has no draw outcome."),
    },
    supportedMarketTypes: [...supported],
  };
};

const reconcileMarketRulesWithVisibleMarkets = (rules: EventMarketRules, markets: EventMarket[]): EventMarketRules => {
  const hasDrawMarket = markets.some(marketHasDrawOutcome);
  const hasAdvanceMarket = markets.some((market) => isAdvanceMarketKey(marketKey(market)));

  if (hasDrawMarket && !hasAdvanceMarket && rules.marketProfile === "full_match_with_overtime") {
    const supported = new Set(rules.supportedMarketTypes);
    supported.delete("full_match_with_overtime");
    supported.add("regulation_90");
    return {
      ...rules,
      marketProfile: "regulation_90",
      primaryMarketProfile: "regulation_90",
      resultMode: "can_draw_90",
      legacyResultMode: "can_draw",
      gameRules: {
        ...rules.gameRules,
        allowDraw: true,
        includesOvertime: false,
        description: "Regulation-time soccer market can settle as home win, draw, or away win.",
      },
      supportedMarketTypes: [...supported],
    };
  }

  return rules;
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
  const marketRules = reconcileMarketRulesWithVisibleMarkets(
    normalizedSoccerRulesFromMetadata(metadata) ?? deriveEventMarketRules(event, markets),
    markets,
  );
  const displayStatus = displayStatusForSummary(event, mobileLiveDetail);

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
    displayStatus,
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
    primaryMarketProfile: marketRules.primaryMarketProfile,
    resultMode: marketRules.resultMode,
    legacyResultMode: marketRules.legacyResultMode,
    gameRules: marketRules.gameRules,
    supportedMarketTypes: marketRules.supportedMarketTypes,
    metadata: event.metadata,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
