import { Prisma } from "@prisma/client";
import { upsertReferenceQuoteSnapshots, type ReferenceSnapshotUpsertInput } from "@/server/services/referenceQuoteSnapshots";
import type { MobileLiveProviderFixtureMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";

type LocalMarket = {
  id: string;
  title: string;
  marketType: string;
  line: Prisma.Decimal | null;
  period: string | null;
  referenceMetadata?: Prisma.JsonValue | null;
  outcomes: Array<{
    id: string;
    name: string;
    label: string | null;
    side: string | null;
    referenceMetadata?: Prisma.JsonValue | null;
  }>;
};

export type OpticOddsFixtureOddsResponse = {
  data?: OpticOddsFixtureOddsFixture[];
};

export type OpticOddsFixtureOddsFixture = {
  id: string;
  game_id?: string | null;
  status?: string | null;
  is_live?: boolean | null;
  home_competitors?: Array<{ id?: string | null; name?: string | null; abbreviation?: string | null }>;
  away_competitors?: Array<{ id?: string | null; name?: string | null; abbreviation?: string | null }>;
  odds?: OpticOddsOdd[];
};

export type OpticOddsOdd = {
  id?: string | null;
  sportsbook?: string | null;
  market?: string | null;
  market_id?: string | null;
  name?: string | null;
  selection?: string | null;
  normalized_selection?: string | null;
  selection_line?: string | null;
  team_id?: string | null;
  price?: number | string | null;
  points?: number | string | null;
  is_main?: boolean | null;
  timestamp?: number | string | null;
};

type OpticOddsLineRefreshConfig = {
  apiKey: string | null;
  baseUrl: string;
  sportsbooks: string[];
  markets: string[];
  oddsFormat: "PROBABILITY";
  source: "optic_odds";
};

export function getOpticOddsLineRefreshConfig(env: NodeJS.ProcessEnv = process.env): OpticOddsLineRefreshConfig {
  return {
    apiKey: env.OPTIC_ODDS_API_KEY?.trim() || null,
    baseUrl: env.OPTIC_ODDS_BASE_URL?.trim() || "https://api.opticodds.com/api/v3",
    sportsbooks: splitCsv(env.OPTIC_ODDS_SPORTSBOOKS).slice(0, 5),
    markets: splitCsv(env.OPTIC_ODDS_LINE_MARKETS, [
      "moneyline",
      "point_spread",
      "total_goals",
      "team_total_goals",
      "1st_half_moneyline",
      "2nd_half_moneyline",
      "correct_score",
    ]),
    oddsFormat: "PROBABILITY",
    source: "optic_odds",
  };
}

export async function refreshOpticOddsLineQuoteSnapshots(params: {
  eventSlug: string;
  providerFixture: MobileLiveProviderFixtureMetadata | null;
  compactMarkets: LocalMarket[];
  fetchImpl?: typeof fetch;
}) {
  const config = getOpticOddsLineRefreshConfig();
  if (!params.providerFixture?.opticOddsFixtureId) {
    return skippedReport(params.eventSlug, "missing_provider_fixture", params.compactMarkets.length);
  }
  if (!config.apiKey) {
    return skippedReport(params.eventSlug, "missing_optic_odds_api_key", params.compactMarkets.length, {
      fixtureId: params.providerFixture.opticOddsFixtureId,
      markets: config.markets,
      sportsbooks: config.sportsbooks,
    });
  }
  if (config.sportsbooks.length === 0) {
    return skippedReport(params.eventSlug, "missing_optic_odds_sportsbooks", params.compactMarkets.length, {
      fixtureId: params.providerFixture.opticOddsFixtureId,
      markets: config.markets,
    });
  }

  const response = await fetchOpticOddsFixtureOdds({
    fixtureId: params.providerFixture.opticOddsFixtureId,
    config,
    fetchImpl: params.fetchImpl,
  });
  const rows = buildOpticOddsReferenceQuoteRows({
    providerFixture: params.providerFixture,
    compactMarkets: params.compactMarkets,
    response,
    fetchedAt: new Date().toISOString(),
  });
  const upserted = await upsertReferenceQuoteSnapshots(rows);

  return {
    eventSlug: params.eventSlug,
    generatedAt: new Date().toISOString(),
    source: config.source,
    attempted: true,
    status: "ready" as const,
    fixtureId: params.providerFixture.opticOddsFixtureId,
    sportsbookCount: config.sportsbooks.length,
    requestedMarkets: config.markets,
    compactMarketCount: params.compactMarkets.length,
    matchedMarketCount: new Set(rows.map((row) => row.marketId)).size,
    snapshotRowsBuilt: rows.length,
    snapshotsUpdated: upserted.length,
    skippedReason: null,
  };
}

export async function fetchOpticOddsFixtureOdds(params: {
  fixtureId: string;
  config?: OpticOddsLineRefreshConfig;
  fetchImpl?: typeof fetch;
}) {
  const config = params.config ?? getOpticOddsLineRefreshConfig();
  if (!config.apiKey) throw new Error("OPTIC_ODDS_API_KEY is required to fetch fixture odds.");
  const url = new URL(`${config.baseUrl.replace(/\/$/, "")}/fixtures/odds`);
  url.searchParams.append("fixture_id", params.fixtureId);
  url.searchParams.append("odds_format", config.oddsFormat);
  for (const sportsbook of config.sportsbooks) url.searchParams.append("sportsbook", sportsbook);
  for (const market of config.markets) url.searchParams.append("market", market);

  const response = await (params.fetchImpl ?? fetch)(url, {
    headers: { "X-Api-Key": config.apiKey },
  });
  if (!response.ok) {
    throw new Error(`OpticOdds fixture odds request failed with HTTP ${response.status}.`);
  }
  return response.json() as Promise<OpticOddsFixtureOddsResponse>;
}

export function buildOpticOddsReferenceQuoteRows(params: {
  providerFixture: MobileLiveProviderFixtureMetadata;
  compactMarkets: LocalMarket[];
  response: OpticOddsFixtureOddsResponse;
  fetchedAt: string;
}): ReferenceSnapshotUpsertInput[] {
  const fixture = params.response.data?.find((item) => item.id === params.providerFixture.opticOddsFixtureId)
    ?? params.response.data?.[0]
    ?? null;
  if (!fixture?.odds?.length) return [];

  const odds = fixture.odds.filter((odd) => odd.is_main !== false);
  return params.compactMarkets.flatMap((market) => {
    const reviewedMarketIdentity = parseLineProviderIdentity(market.referenceMetadata);
    const marketOdds = odds.filter((odd) =>
      reviewedMarketIdentity?.providerMarketId
        ? normalize(odd.market_id ?? odd.market) === normalize(reviewedMarketIdentity.providerMarketId)
        : opticMarketMatchesLocalMarket(odd, market),
    );
    if (marketOdds.length === 0) return [];
    return market.outcomes.flatMap((outcome) => {
      const reviewedOutcomeIdentity = parseLineProviderIdentity(outcome.referenceMetadata);
      const odd = reviewedOutcomeIdentity?.providerOddId
        ? marketOdds.find((candidate) => candidate.id === reviewedOutcomeIdentity.providerOddId)
        : marketOdds.find((candidate) => opticOddMatchesOutcome(candidate, outcome, fixture));
      if (!odd) return [];
      const probability = probabilityFromOpticPrice(odd.price);
      if (probability == null) return [];
      return [{
        marketId: market.id,
        outcomeId: outcome.id,
        source: "optic_odds",
        externalSlug: fixture.id,
        externalMarketId: odd.id ?? null,
        conditionId: null,
        tokenId: null,
        outcomeLabel: odd.name ?? odd.selection ?? outcome.label ?? outcome.name,
        outcomePrice: probability,
        bestBid: probability,
        bestAsk: probability,
        spread: null,
        lastTradePrice: probability,
        volume: null,
        volume24hr: null,
        liquidity: null,
        liquidityClob: null,
        acceptingOrders: true,
        qualityStatus: "available",
        mmEligible: false,
        reason: null,
        fetchedAt: params.fetchedAt,
      }];
    });
  });
}

function opticMarketMatchesLocalMarket(odd: OpticOddsOdd, market: LocalMarket) {
  const marketId = normalize(odd.market_id ?? odd.market);
  const localType = normalize(market.marketType);
  const points = numberOrNull(odd.points);
  const line = market.line == null ? null : Number(market.line);

  if (localType.includes("spread")) {
    return (marketId.includes("spread") || marketId.includes("handicap")) && lineValueMatches(points, line);
  }
  if (localType.includes("teamtotal") || localType.includes("team_total")) {
    return (marketId.includes("teamtotal") || marketId.includes("team_total")) && lineValueMatches(points, line);
  }
  if (localType.includes("total")) {
    return (marketId.includes("total") || marketId.includes("overunder")) && !marketId.includes("team") && lineValueMatches(points, line);
  }
  if (market.period === "first-half") {
    return marketId.includes("1sthalf") || marketId.includes("firsthalf") || marketId.includes("1h");
  }
  if (market.period === "second-half") {
    return marketId.includes("2ndhalf") || marketId.includes("secondhalf") || marketId.includes("2h");
  }
  if (localType.includes("moneyline") || localType.includes("winner")) {
    return marketId.includes("moneyline");
  }

  return line == null || points == null || Math.abs(Math.abs(points) - Math.abs(line)) < 0.001;
}

function lineValueMatches(points: number | null, line: number | null) {
  return line == null || points == null || Math.abs(Math.abs(points) - Math.abs(line)) < 0.001;
}

function opticOddMatchesOutcome(odd: OpticOddsOdd, outcome: LocalMarket["outcomes"][number], fixture: OpticOddsFixtureOddsFixture) {
  const outcomeSide = normalize(outcome.side ?? outcome.name ?? outcome.label);
  const selectionLine = normalize(odd.selection_line);
  const selection = normalize(odd.normalized_selection ?? odd.selection ?? odd.name);
  if (outcomeSide.includes("over")) return selectionLine.includes("over") || selection.includes("over");
  if (outcomeSide.includes("under")) return selectionLine.includes("under") || selection.includes("under");
  if (outcomeSide.includes("draw")) return selection.includes("draw");
  if (outcomeSide.includes("home")) return teamSideForOdd(odd, fixture) === "home" || selection.includes("home");
  if (outcomeSide.includes("away")) return teamSideForOdd(odd, fixture) === "away" || selection.includes("away");
  return selection.includes(normalize(outcome.name)) || selection.includes(normalize(outcome.label));
}

function teamSideForOdd(odd: OpticOddsOdd, fixture: OpticOddsFixtureOddsFixture) {
  const teamId = odd.team_id?.trim();
  if (!teamId) return null;
  if (fixture.home_competitors?.some((team) => team.id === teamId)) return "home";
  if (fixture.away_competitors?.some((team) => team.id === teamId)) return "away";
  return null;
}

function parseLineProviderIdentity(value: Prisma.JsonValue | null | undefined) {
  const root = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  const identity = root?.lineProviderIdentity;
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) return null;
  const record = identity as Record<string, unknown>;
  if (record.providerSource !== "optic_odds") return null;
  return {
    providerMarketId: typeof record.providerMarketId === "string" ? record.providerMarketId : null,
    providerOddId: typeof record.providerOddId === "string" ? record.providerOddId : null,
  };
}

function probabilityFromOpticPrice(value: OpticOddsOdd["price"]) {
  const numeric = numberOrNull(value);
  if (numeric == null) return null;
  if (numeric > 0 && numeric <= 1) return Number(numeric.toFixed(4));
  if (numeric > 1) return Number((1 / numeric).toFixed(4));
  if (numeric < 0) return Number((Math.abs(numeric) / (Math.abs(numeric) + 100)).toFixed(4));
  return null;
}

function skippedReport(eventSlug: string, reason: string, compactMarketCount: number, extra?: Record<string, unknown>) {
  return {
    eventSlug,
    generatedAt: new Date().toISOString(),
    source: "optic_odds" as const,
    attempted: false,
    status: "skipped" as const,
    compactMarketCount,
    matchedMarketCount: 0,
    snapshotRowsBuilt: 0,
    snapshotsUpdated: 0,
    skippedReason: reason,
    ...extra,
  };
}

function splitCsv(value: string | undefined, fallback: string[] = []) {
  const raw = value?.trim() ? value : fallback.join(",");
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function numberOrNull(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
