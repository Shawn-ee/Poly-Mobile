import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const API_BASE_URL = "https://api.the-odds-api.com/v4";
const DEFAULT_REGION = "us";
const DEFAULT_MARKETS = ["h2h", "spreads", "totals"];
const PREFERRED_MARKETS = [
  "h2h",
  "h2h_3_way",
  "spreads",
  "alternate_spreads",
  "totals",
  "alternate_totals",
  "team_totals",
  "alternate_team_totals",
  "btts",
  "draw_no_bet",
  "totals_h1",
  "h2h_3_way_h1",
  "correct_score",
];
const PROVIDER_SOURCE = "the-odds-api";
const REFERENCE_SOURCE = "sportsbook-odds";
const SINGLE_EVENT_SLUG = "odds-api-single-soccer-test";

export type OddsApiQuotaHeaders = {
  requestsUsed: string | null;
  requestsRemaining: string | null;
  requestsLast: string | null;
};

export type OddsApiCallRecord = {
  name: string;
  method: "GET";
  path: string;
  status: number;
  quota: OddsApiQuotaHeaders;
};

export type OddsApiSport = {
  key: string;
  group?: string;
  title?: string;
  description?: string;
  active?: boolean;
  has_outrights?: boolean;
};

export type OddsApiEvent = {
  id: string;
  sport_key: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
};

type OddsApiOutcome = {
  name: string;
  price: number;
  point?: number;
  description?: string;
};

type OddsApiMarket = {
  key: string;
  last_update?: string;
  outcomes?: OddsApiOutcome[];
};

type OddsApiBookmaker = {
  key: string;
  title: string;
  last_update?: string;
  markets?: OddsApiMarket[];
};

export type OddsApiMarketsResponse = OddsApiEvent & {
  bookmakers?: Array<{
    key: string;
    title: string;
    markets?: Array<{ key: string; last_update?: string }>;
  }>;
};

export type OddsApiEventOddsResponse = OddsApiEvent & {
  bookmakers?: OddsApiBookmaker[];
};

export type OddsApiSingleEventSelection = {
  sport: OddsApiSport;
  event: OddsApiEvent;
  selectedMarketKeys: string[];
};

export type NormalizedOddsApiMarket = {
  marketKey: string;
  bookmakerKey: string;
  bookmakerTitle: string;
  lastUpdate: string | null;
  marketType: string;
  marketGroupKey: string;
  marketGroupTitle: string;
  title: string;
  period: string;
  displayOrder: number;
  line: number | null;
  unit: string | null;
  participantName: string | null;
  outcomes: Array<{
    code: string;
    name: string;
    side: string;
    decimalOdds: number;
    impliedProbability: number;
    normalizedProbability: number;
    point: number | null;
    description: string | null;
  }>;
};

export type OddsApiSeedSummary = {
  event: {
    id: string;
    slug: string | null;
    title: string;
  };
  marketCount: number;
  outcomeCount: number;
  markets: Array<{
    id: string;
    slug: string | null;
    title: string;
    marketType: string;
    marketGroupTitle: string | null;
    line: string | null;
    outcomeCount: number;
  }>;
};

export function oddsApiSingleEventSlug() {
  return SINGLE_EVENT_SLUG;
}

export function sanitizeOddsApiPath(url: URL) {
  const copy = new URL(url.toString());
  copy.searchParams.delete("apiKey");
  return `${copy.pathname}${copy.search}`;
}

export function quotaHeaders(headers: Headers): OddsApiQuotaHeaders {
  return {
    requestsUsed: headers.get("x-requests-used"),
    requestsRemaining: headers.get("x-requests-remaining"),
    requestsLast: headers.get("x-requests-last"),
  };
}

export function quotaCost(headers: OddsApiQuotaHeaders) {
  const last = Number(headers.requestsLast ?? "0");
  return Number.isFinite(last) ? last : 0;
}

export function assertQuotaBudget(params: {
  calls: OddsApiCallRecord[];
  maxCredits: number;
  minRemaining: number;
}) {
  const spent = params.calls.reduce((total, call) => total + quotaCost(call.quota), 0);
  const latestRemaining = [...params.calls]
    .reverse()
    .map((call) => Number(call.quota.requestsRemaining ?? "NaN"))
    .find((value) => Number.isFinite(value));

  if (spent > params.maxCredits) {
    throw new Error(`The Odds API quota guard stopped after ${spent} credits, above the ${params.maxCredits} credit budget.`);
  }
  if (latestRemaining != null && latestRemaining < params.minRemaining) {
    throw new Error(`The Odds API quota guard stopped because remaining credits are low: ${latestRemaining}.`);
  }
}

export async function oddsApiGetJson<T>(params: {
  name: string;
  path: string;
  apiKey: string;
  calls: OddsApiCallRecord[];
  searchParams?: Record<string, string | undefined>;
}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${params.path}`);
  url.searchParams.set("apiKey", params.apiKey);
  for (const [key, value] of Object.entries(params.searchParams ?? {})) {
    if (value != null && value !== "") url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  const record: OddsApiCallRecord = {
    name: params.name,
    method: "GET",
    path: sanitizeOddsApiPath(url),
    status: response.status,
    quota: quotaHeaders(response.headers),
  };
  params.calls.push(record);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : `HTTP ${response.status}`;
    throw new Error(`The Odds API ${params.name} failed: ${message}`);
  }
  return body as T;
}

export function selectCandidateSoccerSports(sports: OddsApiSport[], maxSports = 8) {
  const activeSoccer = sports.filter((sport) =>
    sport.active !== false &&
    sport.group?.toLowerCase() === "soccer" &&
    !sport.has_outrights &&
    sport.key.startsWith("soccer_")
  );
  const score = (sport: OddsApiSport) => {
    const value = `${sport.key} ${sport.title ?? ""} ${sport.description ?? ""}`.toLowerCase();
    let result = 0;
    if (value.includes("fifa")) result += 100;
    if (value.includes("world")) result += 90;
    if (value.includes("international")) result += 70;
    if (value.includes("uefa")) result += 50;
    if (value.includes("usa_mls")) result += 40;
    if (value.includes("epl") || value.includes("england")) result += 30;
    return result;
  };
  return activeSoccer
    .sort((left, right) => score(right) - score(left) || left.key.localeCompare(right.key))
    .slice(0, maxSports);
}

export function tomorrowUtcWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2, 0, 0, 0));
  return { from: oddsApiIso(start), to: oddsApiIso(end) };
}

export function selectPreferredEvent(events: OddsApiEvent[]) {
  return [...events].sort((left, right) => {
    const leftTime = Date.parse(left.commence_time);
    const rightTime = Date.parse(right.commence_time);
    return leftTime - rightTime || left.home_team.localeCompare(right.home_team);
  })[0] ?? null;
}

export function availableMarketKeysFromResponse(response: OddsApiMarketsResponse) {
  const keys = new Set<string>();
  for (const bookmaker of response.bookmakers ?? []) {
    for (const market of bookmaker.markets ?? []) {
      if (market.key) keys.add(market.key);
    }
  }
  return Array.from(keys).sort();
}

export function selectOddsMarkets(availableKeys: string[], maxExtra = 3) {
  const available = new Set(availableKeys);
  const primary = DEFAULT_MARKETS.filter((key) => available.has(key));
  const extras = PREFERRED_MARKETS
    .filter((key) => !DEFAULT_MARKETS.includes(key) && available.has(key))
    .slice(0, maxExtra);
  return Array.from(new Set([...primary, ...extras]));
}

export function normalizeDecimalOddsMarket(params: {
  event: OddsApiEvent;
  bookmaker: OddsApiBookmaker;
  market: OddsApiMarket;
  displayOrder: number;
}): NormalizedOddsApiMarket | null {
  const outcomes = (params.market.outcomes ?? []).filter((outcome) =>
    typeof outcome.name === "string" &&
    typeof outcome.price === "number" &&
    Number.isFinite(outcome.price) &&
    outcome.price > 1
  );
  if (outcomes.length < 2) return null;
  if (params.market.key === "correct_score" && outcomes.length > 30) return null;

  const implied = outcomes.map((outcome) => 1 / outcome.price);
  const overround = implied.reduce((total, value) => total + value, 0);
  if (!Number.isFinite(overround) || overround <= 0) return null;

  const line = commonPoint(outcomes);
  const marketShape = marketShapeForOddsKey({
    key: params.market.key,
    event: params.event,
    line,
    firstOutcome: outcomes[0]!,
  });
  if (!marketShape) return null;

  return {
    marketKey: params.market.key,
    bookmakerKey: params.bookmaker.key,
    bookmakerTitle: params.bookmaker.title,
    lastUpdate: params.market.last_update ?? params.bookmaker.last_update ?? null,
    displayOrder: params.displayOrder,
    ...marketShape,
    outcomes: outcomes.map((outcome, index) => ({
      code: outcomeCode(outcome, index),
      name: outcomeName(outcome),
      side: outcomeSide(outcome, params.event),
      decimalOdds: outcome.price,
      impliedProbability: roundProbability(1 / outcome.price),
      normalizedProbability: roundProbability((1 / outcome.price) / overround),
      point: typeof outcome.point === "number" && Number.isFinite(outcome.point) ? outcome.point : null,
      description: outcome.description ?? null,
    })),
  };
}

export function normalizeOddsApiEvent(response: OddsApiEventOddsResponse): NormalizedOddsApiMarket[] {
  const bookmakers = response.bookmakers ?? [];
  const selectedBookmaker = [...bookmakers]
    .filter((bookmaker) => (bookmaker.markets ?? []).some((market) => PREFERRED_MARKETS.includes(market.key)))
    .sort((left, right) => {
      const leftCount = (left.markets ?? []).filter((market) => PREFERRED_MARKETS.includes(market.key)).length;
      const rightCount = (right.markets ?? []).filter((market) => PREFERRED_MARKETS.includes(market.key)).length;
      return rightCount - leftCount || left.key.localeCompare(right.key);
    })[0];
  if (!selectedBookmaker) return [];

  return (selectedBookmaker.markets ?? [])
    .filter((market) => PREFERRED_MARKETS.includes(market.key))
    .flatMap((market, index) => {
      const normalized = normalizeDecimalOddsMarket({
        event: response,
        bookmaker: selectedBookmaker,
        market,
        displayOrder: (index + 1) * 10,
      });
      return normalized ? expandLineMarketsByPoint(normalized) : [];
    });
}

export function expandLineMarketsByPoint(market: NormalizedOddsApiMarket): NormalizedOddsApiMarket[] {
  if (!["spread", "total_goals", "team_total_goals"].includes(market.marketType)) return [market];
  const pointOutcomes = market.outcomes.filter((outcome) => typeof outcome.point === "number" && Number.isFinite(outcome.point));
  if (pointOutcomes.length < 4 || market.line != null) return [market];

  const byPoint = new Map<string, NormalizedOddsApiMarket["outcomes"]>();
  for (const outcome of pointOutcomes) {
    const key = String(Math.abs(outcome.point ?? 0));
    byPoint.set(key, [...(byPoint.get(key) ?? []), outcome]);
  }

  const groups = Array.from(byPoint.entries())
    .filter(([, outcomes]) => outcomes.length >= 2)
    .sort(([left], [right]) => Number(left) - Number(right));
  if (groups.length <= 1) return [market];

  return groups.map(([point, outcomes], index) => {
    const totalImplied = outcomes.reduce((total, outcome) => total + (1 / outcome.decimalOdds), 0);
    const line = Number(point);
    return {
      ...market,
      displayOrder: market.displayOrder + index,
      title: titleWithLine(market.title, line),
      line,
      participantName: market.marketType === "spread" ? outcomes.find((outcome) => outcome.side === "home")?.name.replace(/\s[-+]\d+(\.\d+)?$/, "") ?? market.participantName : market.participantName,
      outcomes: outcomes.map((outcome) => ({
        ...outcome,
        normalizedProbability: roundProbability((1 / outcome.decimalOdds) / totalImplied),
      })),
    };
  });
}

export async function seedOddsApiSingleEvent(params: {
  oddsEvent: OddsApiEventOddsResponse;
  markets: NormalizedOddsApiMarket[];
  region: string;
  oddsFormat: string;
  seededAt?: Date;
}): Promise<OddsApiSeedSummary> {
  const now = params.seededAt ?? new Date();
  const title = `${params.oddsEvent.away_team} vs. ${params.oddsEvent.home_team}`;
  const startTime = new Date(params.oddsEvent.commence_time);
  const event = await prisma.event.upsert({
    where: { slug: SINGLE_EVENT_SLUG },
    create: {
      slug: SINGLE_EVENT_SLUG,
      title,
      description: "Temporary sportsbook-derived soccer event for Holiwyn internal MVP testing.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: params.oddsEvent.home_team,
      awayTeamName: params.oddsEvent.away_team,
      startTime,
      status: "active",
      liveStatus: "LIVE",
      source: PROVIDER_SOURCE,
      externalEventId: params.oddsEvent.id,
      externalSlug: `${params.oddsEvent.sport_key}-${params.oddsEvent.id}`,
      sourceUpdatedAt: now,
      metadata: eventMetadata(params),
    },
    update: {
      title,
      description: "Temporary sportsbook-derived soccer event for Holiwyn internal MVP testing.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: params.oddsEvent.home_team,
      awayTeamName: params.oddsEvent.away_team,
      startTime,
      status: "active",
      liveStatus: "LIVE",
      source: PROVIDER_SOURCE,
      externalEventId: params.oddsEvent.id,
      externalSlug: `${params.oddsEvent.sport_key}-${params.oddsEvent.id}`,
      sourceUpdatedAt: now,
      metadata: eventMetadata(params),
    },
    select: { id: true, slug: true, title: true },
  });

  const seededMarkets = [];
  for (const marketSpec of params.markets) {
    seededMarkets.push(await seedOddsMarket({
      event: { id: event.id, slug: event.slug!, title: event.title },
      oddsEvent: params.oddsEvent,
      spec: marketSpec,
      region: params.region,
      oddsFormat: params.oddsFormat,
      now,
    }));
  }

  const activeMarketIds = seededMarkets.map(({ market }) => market.id);
  await prisma.market.updateMany({
    where: {
      eventId: event.id,
      referenceSource: REFERENCE_SOURCE,
      id: { notIn: activeMarketIds },
    },
    data: { isListed: false, status: "CLOSED" },
  });

  return {
    event,
    marketCount: seededMarkets.length,
    outcomeCount: seededMarkets.reduce((total, item) => total + item.outcomeCount, 0),
    markets: seededMarkets.map(({ market, outcomeCount }) => ({
      id: market.id,
      slug: market.slug,
      title: market.title,
      marketType: market.marketType,
      marketGroupTitle: market.marketGroupTitle,
      line: market.line?.toString() ?? null,
      outcomeCount,
    })),
  };
}

function eventMetadata(params: {
  oddsEvent: OddsApiEventOddsResponse;
  region: string;
  oddsFormat: string;
  markets: NormalizedOddsApiMarket[];
}) {
  return {
    providerSource: PROVIDER_SOURCE,
    referenceSource: REFERENCE_SOURCE,
    sportsbookDerived: true,
    temporarySingleEventProvider: true,
    externalEventId: params.oddsEvent.id,
    sportKey: params.oddsEvent.sport_key,
    sportTitle: params.oddsEvent.sport_title ?? null,
    region: params.region,
    oddsFormat: params.oddsFormat,
    importedMarketKeys: Array.from(new Set(params.markets.map((market) => market.marketKey))),
    excludes: ["real-money", "polymarket-backed-claim", "orderbook-ui", "chat", "live-stats"],
  };
}

async function seedOddsMarket(params: {
  event: { id: string; slug: string; title: string };
  oddsEvent: OddsApiEventOddsResponse;
  spec: NormalizedOddsApiMarket;
  region: string;
  oddsFormat: string;
  now: Date;
}) {
  const marketIdentity = `${params.oddsEvent.id}:${params.spec.bookmakerKey}:${params.spec.marketKey}:${params.spec.line ?? "main"}:${params.spec.participantName ?? "all"}`;
  const marketSlug = `${params.event.slug}-${slugify(params.spec.marketKey)}-${shortHash(marketIdentity)}`;
  const externalMarketId = `${params.oddsEvent.id}:${params.spec.bookmakerKey}:${params.spec.marketKey}:${params.spec.line ?? "main"}`;
  const conditionId = `odds-api-${shortHash(marketIdentity, 24)}`;
  const market = await prisma.market.upsert({
    where: { slug: marketSlug },
    create: {
      slug: marketSlug,
      title: `${params.event.title}: ${params.spec.title}`,
      description: "Sportsbook-derived fake-token market for Holiwyn internal MVP testing.",
      categoryLegacy: "sports",
      type: "BINARY",
      marketType: params.spec.marketType,
      marketGroupKey: params.spec.marketGroupKey,
      marketGroupTitle: params.spec.marketGroupTitle,
      displayOrder: params.spec.displayOrder,
      line: params.spec.line == null ? undefined : dec(params.spec.line),
      unit: params.spec.unit ?? undefined,
      period: params.spec.period,
      participantName: params.spec.participantName ?? undefined,
      participantType: params.spec.participantName ? "team" : undefined,
      propCategory: propCategoryForMarketType(params.spec.marketType),
      status: "LIVE",
      eventId: params.event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      isListed: true,
      referenceSource: REFERENCE_SOURCE,
      externalSlug: `${params.oddsEvent.sport_key}-${params.oddsEvent.id}`,
      externalMarketId,
      conditionId,
      sourceUpdatedAt: params.now,
      rules: {
        source: REFERENCE_SOURCE,
        providerSource: PROVIDER_SOURCE,
        marketKey: params.spec.marketKey,
        line: params.spec.line,
        period: params.spec.period,
      },
      rulesText: "Internal fake-token market seeded from sportsbook odds. Not Polymarket-backed.",
      referenceMetadata: marketReferenceMetadata(params),
    },
    update: {
      title: `${params.event.title}: ${params.spec.title}`,
      description: "Sportsbook-derived fake-token market for Holiwyn internal MVP testing.",
      marketType: params.spec.marketType,
      marketGroupKey: params.spec.marketGroupKey,
      marketGroupTitle: params.spec.marketGroupTitle,
      displayOrder: params.spec.displayOrder,
      line: params.spec.line == null ? null : dec(params.spec.line),
      unit: params.spec.unit,
      period: params.spec.period,
      participantName: params.spec.participantName,
      participantType: params.spec.participantName ? "team" : null,
      propCategory: propCategoryForMarketType(params.spec.marketType),
      status: "LIVE",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      isListed: true,
      referenceSource: REFERENCE_SOURCE,
      externalSlug: `${params.oddsEvent.sport_key}-${params.oddsEvent.id}`,
      externalMarketId,
      conditionId,
      sourceUpdatedAt: params.now,
      rules: {
        source: REFERENCE_SOURCE,
        providerSource: PROVIDER_SOURCE,
        marketKey: params.spec.marketKey,
        line: params.spec.line,
        period: params.spec.period,
      },
      rulesText: "Internal fake-token market seeded from sportsbook odds. Not Polymarket-backed.",
      referenceMetadata: marketReferenceMetadata(params),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      externalSlug: true,
      externalMarketId: true,
      conditionId: true,
      marketType: true,
      marketGroupTitle: true,
      line: true,
    },
  });

  const outcomes = [];
  for (const [index, outcomeSpec] of params.spec.outcomes.entries()) {
    outcomes.push(await seedOddsOutcome({
      marketId: market.id,
      marketSlug,
      spec: outcomeSpec,
      index,
      provider: params.spec,
    }));
  }
  await prisma.outcome.updateMany({
    where: { marketId: market.id, id: { notIn: outcomes.map((outcome) => outcome.id) } },
    data: { isActive: false, status: "archived" },
  });
  await upsertReferenceQuoteSnapshots(outcomes.map((outcome, index) => {
    const outcomeSpec = params.spec.outcomes[index]!;
    const price = clampPrice(outcomeSpec.normalizedProbability);
    return {
      marketId: market.id,
      outcomeId: outcome.id,
      source: REFERENCE_SOURCE,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      outcomeLabel: outcome.referenceOutcomeLabel,
      outcomePrice: price,
      bestBid: Math.max(0.01, Number((price - 0.02).toFixed(4))),
      bestAsk: Math.min(0.99, Number((price + 0.02).toFixed(4))),
      spread: 0.04,
      lastTradePrice: price,
      volume: 0,
      volume24hr: 0,
      liquidity: 1000,
      liquidityClob: 0,
      acceptingOrders: true,
      qualityStatus: "approved",
      mmEligible: false,
      reason: "temporary_sportsbook_odds_single_event_provider",
      fetchedAt: params.now,
    };
  }));

  return { market, outcomeCount: outcomes.length };
}

async function seedOddsOutcome(params: {
  marketId: string;
  marketSlug: string;
  spec: NormalizedOddsApiMarket["outcomes"][number];
  index: number;
  provider: NormalizedOddsApiMarket;
}) {
  const existing = await prisma.outcome.findFirst({
    where: { marketId: params.marketId, code: params.spec.code },
    select: { id: true },
  });
  const referenceTokenId = `odds-api-${shortHash(`${params.marketSlug}:${params.spec.code}`, 24)}`;
  const data = {
    name: params.spec.name,
    label: params.spec.name,
    side: params.spec.side,
    displayOrder: params.index,
    isActive: true,
    isTradable: true,
    status: "active",
    referenceTokenId,
    referenceOutcomeLabel: params.spec.name,
    referenceMetadata: {
      providerSource: PROVIDER_SOURCE,
      referenceSource: REFERENCE_SOURCE,
      sportsbookDerived: true,
      decimalOdds: params.spec.decimalOdds,
      impliedProbability: params.spec.impliedProbability,
      normalizedProbability: params.spec.normalizedProbability,
      point: params.spec.point,
      description: params.spec.description,
      lineProviderIdentity: {
        providerSource: "the_odds_api",
        externalMarketId: `${params.provider.bookmakerKey}:${params.provider.marketKey}`,
        externalOutcomeId: params.spec.code,
        line: params.spec.point,
      },
    },
  };

  return existing
    ? prisma.outcome.update({ where: { id: existing.id }, data })
    : prisma.outcome.create({
        data: {
          marketId: params.marketId,
          code: params.spec.code,
          slug: `${params.marketSlug}-${slugify(params.spec.code)}`,
          ...data,
        },
      });
}

function marketReferenceMetadata(params: {
  oddsEvent: OddsApiEventOddsResponse;
  spec: NormalizedOddsApiMarket;
  region: string;
  oddsFormat: string;
  now: Date;
}) {
  return {
    providerSource: PROVIDER_SOURCE,
    referenceSource: REFERENCE_SOURCE,
    sportsbookDerived: true,
    importStatus: "approved",
    referenceOnly: false,
    tradable: true,
    providerBacked: true,
    externalEventId: params.oddsEvent.id,
    bookmaker: {
      key: params.spec.bookmakerKey,
      title: params.spec.bookmakerTitle,
    },
    marketKey: params.spec.marketKey,
    lastUpdate: params.spec.lastUpdate,
    region: params.region,
    oddsFormat: params.oddsFormat,
    importedAt: params.now.toISOString(),
    lineProviderIdentity: {
      providerSource: "the_odds_api",
      externalEventId: params.oddsEvent.id,
      externalMarketId: `${params.spec.bookmakerKey}:${params.spec.marketKey}`,
      marketKey: params.spec.marketKey,
      line: params.spec.line,
    },
  };
}

function marketShapeForOddsKey(params: {
  key: string;
  event: OddsApiEvent;
  line: number | null;
  firstOutcome: OddsApiOutcome;
}): Omit<NormalizedOddsApiMarket, "marketKey" | "bookmakerKey" | "bookmakerTitle" | "lastUpdate" | "displayOrder" | "outcomes"> | null {
  switch (params.key) {
    case "h2h":
    case "h2h_3_way":
      return {
        marketType: "match_winner_1x2",
        marketGroupKey: "regulation-winner",
        marketGroupTitle: "Regulation Time Winner",
        title: "Regulation Time Winner",
        period: "regulation",
        line: null,
        unit: null,
        participantName: null,
      };
    case "spreads":
    case "alternate_spreads":
      return {
        marketType: "spread",
        marketGroupKey: "spread",
        marketGroupTitle: "Spread",
        title: params.line == null ? "Spread" : `Spread ${formatSigned(params.line)}`,
        period: "regulation",
        line: params.line == null ? null : Math.abs(params.line),
        unit: "goals",
        participantName: params.firstOutcome.name,
      };
    case "totals":
    case "alternate_totals":
    case "totals_h1":
      return {
        marketType: "total_goals",
        marketGroupKey: params.key === "totals_h1" ? "first-half-totals" : "totals",
        marketGroupTitle: params.key === "totals_h1" ? "First Half Total Goals" : "Total Goals",
        title: params.line == null ? "Total Goals" : `Total Goals ${params.line}`,
        period: params.key === "totals_h1" ? "first-half" : "regulation",
        line: params.line,
        unit: "goals",
        participantName: null,
      };
    case "team_totals":
    case "alternate_team_totals":
      return {
        marketType: "team_total_goals",
        marketGroupKey: "team-totals",
        marketGroupTitle: "Team Total Goals",
        title: `${params.firstOutcome.description ?? params.firstOutcome.name} Total Goals ${params.line ?? ""}`.trim(),
        period: "regulation",
        line: params.line,
        unit: "goals",
        participantName: params.firstOutcome.description ?? null,
      };
    case "btts":
      return {
        marketType: "both_teams_to_score",
        marketGroupKey: "both-teams-to-score",
        marketGroupTitle: "Both Teams To Score",
        title: "Both Teams To Score",
        period: "regulation",
        line: null,
        unit: null,
        participantName: null,
      };
    case "draw_no_bet":
      return {
        marketType: "draw_no_bet",
        marketGroupKey: "draw-no-bet",
        marketGroupTitle: "Draw No Bet",
        title: "Draw No Bet",
        period: "regulation",
        line: null,
        unit: null,
        participantName: null,
      };
    case "h2h_3_way_h1":
      return {
        marketType: "match_winner_1x2",
        marketGroupKey: "first-half-winner",
        marketGroupTitle: "First Half Winner",
        title: "First Half Winner",
        period: "first-half",
        line: null,
        unit: null,
        participantName: null,
      };
    case "correct_score":
      return {
        marketType: "correct_score",
        marketGroupKey: "correct-score",
        marketGroupTitle: "Correct Score",
        title: "Correct Score",
        period: "regulation",
        line: null,
        unit: "score",
        participantName: null,
      };
    default:
      return null;
  }
}

function commonPoint(outcomes: OddsApiOutcome[]) {
  const points = outcomes
    .map((outcome) => outcome.point)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (points.length === 0) return null;
  const abs = points.map((value) => Math.abs(value));
  const first = abs[0]!;
  return abs.every((value) => value === first) ? first : null;
}

function outcomeName(outcome: OddsApiOutcome) {
  const description = outcome.description?.trim();
  if (description && !outcome.name.includes(description)) return `${description} ${outcome.name}`;
  if (typeof outcome.point === "number") return `${outcome.name} ${formatSigned(outcome.point)}`;
  return outcome.name;
}

function outcomeSide(outcome: OddsApiOutcome, event: OddsApiEvent) {
  const value = `${outcome.name} ${outcome.description ?? ""}`.toLowerCase();
  if (value.includes("over")) return "over";
  if (value.includes("under")) return "under";
  if (value.includes("yes")) return "yes";
  if (value.includes("no")) return "no";
  if (value.includes("draw") || value.includes("tie")) return "draw";
  if (value.includes(event.home_team.toLowerCase())) return "home";
  if (value.includes(event.away_team.toLowerCase())) return "away";
  return "selection";
}

function outcomeCode(outcome: OddsApiOutcome, index: number) {
  return slugify(`${outcome.description ?? ""}-${outcome.name}-${outcome.point ?? ""}`) || `outcome-${index + 1}`;
}

function propCategoryForMarketType(marketType: string) {
  if (marketType.includes("total")) return "goals";
  if (marketType === "spread") return "handicap";
  if (marketType === "correct_score") return "score";
  return undefined;
}

function titleWithLine(title: string, line: number) {
  const base = title.replace(/\s[-+]?\d+(\.\d+)?$/, "").trim();
  return `${base} ${line}`;
}

function roundProbability(value: number) {
  return Number(Math.max(0.01, Math.min(0.99, value)).toFixed(4));
}

function clampPrice(value: number) {
  return Number(Math.max(0.01, Math.min(0.99, value)).toFixed(4));
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortHash(value: string, length = 10) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function dec(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function oddsApiIso(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
