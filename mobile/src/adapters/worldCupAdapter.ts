import type {
  EventDetail as BackendEventDetail,
  EventSummary as BackendEventSummary,
  Market as BackendMarket,
  Outcome as BackendOutcome,
} from "../types";
import type { Event, EventMarketProfile, EventMarketType, EventPrimaryMarketProfile, EventResultMode, Market, Outcome } from "../mocks/worldCup";

const COLORS = ["#2563eb", "#60a5fa", "#ef4444", "#0a8f61", "#f4c20d", "#7c3aed", "#94a3b8"];

const fallbackProbability = (index: number, total: number) => {
  if (total <= 0) return 50;
  return Math.max(1, Math.round(100 / total - index));
};

const asProbability = (value: string | number | null | undefined, index: number, total: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallbackProbability(index, total);
  if (parsed > 1) return Math.max(1, Math.min(99, Math.round(parsed)));
  return Math.max(1, Math.min(99, Math.round(parsed * 100)));
};

const firstPositivePrice = (...values: (string | number | null | undefined)[]) => {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const outcomeProbabilityPrice = (outcome: BackendOutcome) => {
  const price = firstPositivePrice(outcome.price);
  if (price !== null) return price;
  const bid = firstPositivePrice(outcome.bestBid);
  const ask = firstPositivePrice(outcome.bestAsk);
  if (bid !== null && ask !== null) return (bid + ask) / 2;
  return ask ?? bid ?? outcome.price;
};

const asTitleCase = (value: string | null | undefined, fallback: string) => {
  const clean = (value || fallback).replace(/[_-]+/g, " ").trim();
  if (!clean) return fallback;
  return clean.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const asNumberOrNull = (value: string | number | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asOutcomeSide = (value: string | null | undefined): Outcome["side"] | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (["yes", "no", "over", "under", "home", "away", "draw"].includes(normalized)) {
    return normalized as Outcome["side"];
  }
  return undefined;
};

const asMarketContractType = (value: string | null | undefined): Market["marketType"] | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (["moneyline", "match_winner", "match_winner_1x2", "winner"].includes(normalized)) return "moneyline";
  if (["spread", "handicap", "asian_handicap"].includes(normalized)) return "spread";
  if (["totals", "total", "total_goals"].includes(normalized)) return "totals";
  if (["team-total", "team_total", "team_totals", "team_total_goals"].includes(normalized)) return "team-total";
  if (["next-goal", "next_goal"].includes(normalized)) return "next-goal";
  if (["future", "outright"].includes(normalized)) return "future";
  if (normalized) return "prop";
  return undefined;
};

const asPeriod = (value: string | null | undefined): Market["period"] | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase().replace(/_/g, "-");
  if (["full-game", "regulation", "first-half", "second-half"].includes(normalized)) {
    return normalized as Market["period"];
  }
  return undefined;
};

const datePattern = /\b(20\d{2})-(\d{2})-(\d{2})\b/;

const dateOnly = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const dateFromText = (value: string | null | undefined) => {
  const match = `${value ?? ""}`.match(datePattern);
  if (!match) return null;
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isFinite(timestamp) ? timestamp : null;
};

const eventDate = (event: BackendEventSummary) => {
  if (event.startTime) {
    const start = new Date(event.startTime);
    if (!Number.isNaN(start.getTime())) return dateOnly(start);
  }
  return dateFromText(event.externalSlug) ?? dateFromText(event.title);
};

const isFreshLiveEvent = (event: BackendEventSummary) => {
  const day = eventDate(event);
  return day == null || day >= dateOnly(new Date());
};

const hasStaleLiveDataWithoutClock = (event: BackendEventSummary) => {
  const liveDataStatus = `${event.liveDataStatus?.status ?? ""}`.toLowerCase();
  return !event.clock && ["stale", "unavailable", "empty"].includes(liveDataStatus);
};

const isOutrightProviderEvent = (event: BackendEventSummary) => {
  const eventType = `${event.eventType ?? ""}`.trim().toLowerCase();
  const marketProfile = `${event.marketProfile ?? ""}`.trim().toLowerCase();
  const supportedMarketTypes = event.supportedMarketTypes ?? [];
  return (
    ["future", "futures", "outright", "outrights"].includes(eventType) ||
    marketProfile === "outright" ||
    supportedMarketTypes.includes("outright")
  );
};

const asEventResultMode = (value: unknown): EventResultMode | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (["one_winner", "can_draw", "no_draw", "can_draw_90", "must_advance"].includes(normalized)) {
    return normalized as EventResultMode;
  }
  return undefined;
};

const asPrimaryMarketProfile = (value: unknown): EventPrimaryMarketProfile | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (["outright", "advance", "regulation_90"].includes(normalized)) {
    return normalized as EventPrimaryMarketProfile;
  }
  return undefined;
};

const eventStatus = (event: BackendEventSummary): Event["status"] => {
  if (isOutrightProviderEvent(event)) return "future";
  const displayStatus = `${event.displayStatus?.mobileStatus ?? ""}`.trim().toLowerCase();
  if (["live", "today", "tomorrow", "future"].includes(displayStatus)) return displayStatus as Event["status"];
  const liveStatus = `${event.liveStatus ?? ""}`.toLowerCase();
  const status = `${event.status ?? ""}`.toLowerCase();
  if ((liveStatus.includes("live") || liveStatus === "in_progress" || status === "live") && isFreshLiveEvent(event) && !hasStaleLiveDataWithoutClock(event)) return "live";
  if (!event.startTime) return "future";
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return "future";
  const now = new Date();
  const startDay = start.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (startDay === now.toDateString()) return "today";
  if (startDay === tomorrow.toDateString()) return "tomorrow";
  return "future";
};

const startsAt = (event: BackendEventSummary) => {
  if (event.displayStatus?.startsAt) return event.displayStatus.startsAt;
  if ((event.liveStatus || event.clock) && eventStatus(event) === "live") {
    return ["Live", event.period, event.clock].filter(Boolean).join(" · ");
  }
  if (!event.startTime) return "Time TBD";
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return "Time TBD";
  const prefix = eventStatus(event) === "tomorrow" ? "Tomorrow" : eventStatus(event) === "today" ? "Today" : "";
  const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return [prefix, time].filter(Boolean).join(" ");
};

const zhPassthrough = (value: string) => value;

const isGenericFixtureTitle = (title: string) => /^fixture\b/i.test(title.trim());

const NON_TRADABLE_MARKET_STATUSES = new Set(["CLOSED", "RESOLVED", "SETTLED", "CANCELED", "CANCELLED", "SUSPENDED", "PAUSED", "INACTIVE"]);

export const isMobileTradableBackendMarket = (market: Pick<BackendMarket, "status" | "outcomes">) => {
  const status = `${market.status ?? ""}`.trim().toUpperCase();
  return market.outcomes.length > 0 && !NON_TRADABLE_MARKET_STATUSES.has(status);
};

const teamCode = (name: string) => {
  const clean = name
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "TBD";
  if (words.length > 1 && words[0].length <= 3) return words[0].slice(0, 3).toUpperCase();
  return words[words.length - 1].slice(0, 3).toUpperCase();
};

const countryFlagByName: Record<string, string> = {
  argentina: "\uD83C\uDDE6\uD83C\uDDF7",
  australia: "\uD83C\uDDE6\uD83C\uDDFA",
  belgium: "\uD83C\uDDE7\uD83C\uDDEA",
  brazil: "\uD83C\uDDE7\uD83C\uDDF7",
  canada: "\uD83C\uDDE8\uD83C\uDDE6",
  colombia: "\uD83C\uDDE8\uD83C\uDDF4",
  "congo dr": "\uD83C\uDDE8\uD83C\uDDE9",
  croatia: "\uD83C\uDDED\uD83C\uDDF7",
  ecuador: "\uD83C\uDDEA\uD83C\uDDE8",
  egypt: "\uD83C\uDDEA\uD83C\uDDEC",
  england: "\uD83C\uDFF4",
  france: "\uD83C\uDDEB\uD83C\uDDF7",
  germany: "\uD83C\uDDE9\uD83C\uDDEA",
  italy: "\uD83C\uDDEE\uD83C\uDDF9",
  japan: "\uD83C\uDDEF\uD83C\uDDF5",
  mexico: "\uD83C\uDDF2\uD83C\uDDFD",
  morocco: "\uD83C\uDDF2\uD83C\uDDE6",
  netherlands: "\uD83C\uDDF3\uD83C\uDDF1",
  norway: "\uD83C\uDDF3\uD83C\uDDF4",
  paraguay: "\uD83C\uDDF5\uD83C\uDDFE",
  portugal: "\uD83C\uDDF5\uD83C\uDDF9",
  spain: "\uD83C\uDDEA\uD83C\uDDF8",
  switzerland: "\uD83C\uDDE8\uD83C\uDDED",
  usa: "\uD83C\uDDFA\uD83C\uDDF8",
  "united states": "\uD83C\uDDFA\uD83C\uDDF8",
  uruguay: "\uD83C\uDDFA\uD83C\uDDFE",
};

const normalizedTeamNameKey = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const teamFlagForName = (name: string) => countryFlagByName[normalizedTeamNameKey(name)] ?? teamCode(name);

const normalizeOutcome = (outcome: BackendOutcome, index: number, total: number): Outcome => ({
  id: outcome.id,
  label: outcome.label || outcome.name || `Outcome ${index + 1}`,
  zhLabel: zhPassthrough(outcome.label || outcome.name || `选项 ${index + 1}`),
  probability: asProbability(outcomeProbabilityPrice(outcome), index, total),
  side: asOutcomeSide(outcome.side),
  referenceTokenId: outcome.referenceTokenId ?? null,
  referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
  bestBid: asNumberOrNull(outcome.bestBid),
  bestAsk: asNumberOrNull(outcome.bestAsk),
  bestBidSize: asNumberOrNull(outcome.bestBidSize),
  bestAskSize: asNumberOrNull(outcome.bestAskSize),
  color: COLORS[index % COLORS.length],
});

const marketType = (market: BackendMarket): Market["type"] => {
  const key = `${market.marketType ?? ""} ${market.marketGroupTitle ?? ""} ${market.propCategory ?? ""} ${market.title}`.toLowerCase();
  const structuredMarketType = `${market.marketType ?? ""}`.trim().toLowerCase();
  if (["future", "futures", "outright", "outrights"].includes(structuredMarketType)) return "future";
  if (["spread", "handicap", "totals", "total", "total_goals", "team-total", "team_total", "team_totals", "team_total_goals"].includes(structuredMarketType)) return "game-line";
  if (key.includes("future") || key.includes("outright") || key.includes("cup")) return "future";
  if (key.includes("to_advance") || key.includes("to advance")) return "game-line";
  if (key.includes("winner") || key.includes("moneyline") || key.includes("match")) return "game-line";
  if (key.includes("live")) return "live";
  return "prop";
};

const isAdvanceMarketKey = (key: string) =>
  /(^|[\s_-])(to[\s_-]?advance|to[\s_-]?qualify|team[\s_-]?to[\s_-]?qualify|qualify)([\s_-]|$)/i.test(key);

const equivalentMarketType = (market: Market): EventMarketType | null => {
  const key = `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase();
  if (market.type === "future" || market.marketType === "future" || key.includes("outright")) return "outright";
  if (isAdvanceMarketKey(key)) return "to_advance";
  if (market.period === "first-half") return "first-half";
  if (market.period === "second-half") return "second-half";
  if (market.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label))) return "regulation_90";
  if (market.marketType === "spread") return "spread";
  if (market.marketType === "totals") return "totals";
  if (market.marketType === "team-total") return "team-total";
  if (market.type === "prop") return "player-props";
  return null;
};

const deriveMarketRules = (event: BackendEventSummary, markets: Market[]) => {
  const supported = new Set<EventMarketType>();
  for (const market of markets) {
    const type = equivalentMarketType(market);
    if (type) supported.add(type);
  }
  const eventType = `${event.eventType ?? ""}`.trim().toLowerCase();
  const isOutrightEvent =
    ["future", "futures", "outright", "outrights"].includes(eventType) ||
    (markets.length > 0 && markets.every((market) => market.type === "future"));
  if (isOutrightEvent) {
    supported.add("outright");
    return {
      marketProfile: "outright" as const,
      primaryMarketProfile: "outright" as const,
      resultMode: "one_winner" as const,
      gameRules: {
        allowDraw: false,
        includesOvertime: false,
        description: event.description || "Tournament outright winner market.",
      },
      supportedMarketTypes: [...supported],
    };
  }

  const regulationMarket = markets.find((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase();
    return !isAdvanceMarketKey(key) && (market.marketType === "moneyline" || key.includes("winner") || key.includes("regulation") || key.includes("90"));
  });
  const mainMarket = regulationMarket ?? markets.find((market) => market.type !== "prop" && market.type !== "future") ?? markets[0];
  const mainKey = `${mainMarket?.marketType ?? ""} ${mainMarket?.title ?? ""} ${mainMarket?.marketGroupId ?? ""}`.toLowerCase();
  const eventKey = `${event.sportKey ?? ""} ${event.leagueKey ?? ""} ${event.description ?? ""}`.toLowerCase();
  const isSoccerMatch = eventKey.includes("soccer") || eventKey.includes("football") || eventKey.includes("world_cup");
  const hasDraw = Boolean(mainMarket?.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label)));
  const hasAdvanceMarket = markets.some((market) => equivalentMarketType(market) === "to_advance");
  const isAdvance = !regulationMarket && (isAdvanceMarketKey(mainKey) || mainMarket?.marketType === "future");
  const isTwoWaySoccerWinner = Boolean(
    isSoccerMatch &&
      !hasDraw &&
      mainMarket?.outcomes.length === 2 &&
      (mainKey.includes("winner") || mainKey.includes("moneyline") || mainKey.includes("main") || mainKey.includes("match")),
  );
  const includesOvertime = hasAdvanceMarket || isTwoWaySoccerWinner || mainKey.includes("overtime") || mainKey.includes("full match") || mainKey.includes("including overtime");
  const marketProfile: EventMarketProfile = isAdvance ? "to_advance" : includesOvertime ? "full_match_with_overtime" : "regulation_90";
  supported.add(marketProfile);
  if (marketProfile === "regulation_90") supported.add("regulation_90");

  return {
    marketProfile,
    primaryMarketProfile: hasAdvanceMarket || isTwoWaySoccerWinner ? "advance" as const : "regulation_90" as const,
    resultMode: hasAdvanceMarket || isTwoWaySoccerWinner ? "must_advance" as const : hasDraw ? "can_draw_90" as const : "must_advance" as const,
    gameRules: {
      allowDraw: hasDraw,
      includesOvertime,
      description: event.description || (isAdvance || isTwoWaySoccerWinner ? "Advancement/full-match market with no draw outcome." : hasDraw ? "Regulation market can settle as draw." : "Winner market has no draw outcome."),
    },
    supportedMarketTypes: [...supported],
  };
};

export const normalizeMarket = (market: BackendMarket): Market => ({
  id: market.id,
  marketGroupId: market.marketGroupId ?? market.marketGroupKey ?? undefined,
  marketType: asMarketContractType(market.marketType),
  period: asPeriod(market.period),
  line: market.line ?? null,
  referenceSource: market.referenceSource ?? null,
  externalSlug: market.externalSlug ?? null,
  externalMarketId: market.externalMarketId ?? null,
  conditionId: market.conditionId ?? null,
  title: market.marketGroupTitle || market.title,
  zhTitle: zhPassthrough(market.marketGroupTitle || market.title),
  type: marketType(market),
  liquidity: asNumberOrNull(market.liquidity) ?? undefined,
  orderbookDepth: market.orderbookDepth?.map((level) => ({
    outcomeId: level.outcomeId,
    side: level.side,
    price: level.price,
    shares: level.shares,
    total: level.total,
  })),
  availability: market.availability,
  outcomes: market.outcomes.map((outcome, index) => normalizeOutcome(outcome, index, market.outcomes.length)),
});

export const normalizeEventSummary = (event: BackendEventSummary, markets: BackendMarket[] = []): Event => {
  const home = event.homeTeamName || event.title.split(/\s+vs\.?\s+/i)[0] || "Home";
  const away = event.awayTeamName || event.title.split(/\s+vs\.?\s+/i)[1] || "Away";
  const status = eventStatus(event);
  const normalizedMarkets = markets
    .filter(isMobileTradableBackendMarket)
    .map(normalizeMarket)
    .filter((market) => market.outcomes.length > 0);
  const rules = deriveMarketRules(event, normalizedMarkets);
  const depthMarket = normalizedMarkets.find((market) => (market.orderbookDepth?.length ?? 0) > 0);
  const isFuturesBundle = normalizedMarkets.length > 0 && normalizedMarkets.every((market) => market.type === "future");
  const title = isGenericFixtureTitle(event.title) && isFuturesBundle ? "World Cup futures" : event.title;
  return {
    id: event.slug || event.id,
    slug: event.slug || event.id,
    title,
    zhTitle: isGenericFixtureTitle(event.title) && isFuturesBundle ? "世界杯期货" : zhPassthrough(title),
    league: asTitleCase(event.leagueKey, "World Cup"),
    startsAt: startsAt(event),
    status,
    tag: event.displayStatus?.label ?? (status === "live" ? "Live" : asTitleCase(event.status, "World Cup")),
    zhTag: status === "live" ? "滚球" : asTitleCase(event.status, "世界杯"),
    teams: [
      { name: home, zhName: zhPassthrough(home), flag: teamFlagForName(home) },
      { name: away, zhName: zhPassthrough(away), flag: teamFlagForName(away) },
    ],
    liveStats: event.liveStats,
    liveDataStatus: event.liveDataStatus,
    chartHistory: event.chartHistory,
    marketSourceSummary: event.marketSourceSummary,
    marketProfile: event.marketProfile ?? rules.marketProfile,
    primaryMarketProfile: asPrimaryMarketProfile(event.primaryMarketProfile) ?? rules.primaryMarketProfile,
    resultMode: asEventResultMode(event.resultMode) ?? rules.resultMode,
    gameRules: event.gameRules ?? rules.gameRules,
    supportedMarketTypes: event.supportedMarketTypes ?? rules.supportedMarketTypes,
    chartHistorySource: event.chartHistorySource ?? (event.chartHistory?.length ? "embedded" : undefined),
    chartHistoryStatus: event.chartHistoryStatus ?? (event.chartHistory?.length ? "ready" : undefined),
    chartHistoryRange: event.chartHistoryRange,
    chartHistoryLastUpdated: event.chartHistoryLastUpdated,
    chartHistoryEmptyState: event.chartHistoryEmptyState,
    orderbookDepthSource: depthMarket ? "orderbook-route" : undefined,
    orderbookDepthStatus: depthMarket ? "ready" : undefined,
    orderbookDepthMarketId: depthMarket?.id,
    orderbookDepthEmptyState: depthMarket ? null : undefined,
    orderbookAvailability: depthMarket?.availability,
    markets: normalizedMarkets,
  };
};

export const normalizeEventDetail = (detail: BackendEventDetail): Event | null => {
  const event = normalizeEventSummary(detail.event, detail.markets);
  if (event.markets.length === 0) return null;
  return event;
};
