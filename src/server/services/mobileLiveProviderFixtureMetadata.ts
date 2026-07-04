import { Prisma } from "@prisma/client";
import type { PolymarketGroupedEvent } from "@/server/services/polymarketEventImport";

export type MobileLiveProviderFixtureMetadata = {
  providerSource: "polymarket-gamma";
  providerEventSlug: string;
  providerEventId: string;
  seriesSlug: string | null;
  sport: string | null;
  live: boolean | null;
  score: string | null;
  elapsed: string | null;
  period: string | null;
  opticOddsFixtureId: string | null;
  opticOddsGameId: string | null;
  opticOddsNumericalId: number | null;
  sportradarGameId: string | null;
  teams: Array<{
    name: string;
    abbreviation: string | null;
    ordering: string | null;
    providerId: number | null;
  }>;
  moneylineMarkets: Array<{
    slug: string;
    externalMarketId: string;
    conditionId: string | null;
    sportsMarketType: string | null;
    opticOddsMarketId: string | null;
    opticOddsMarketName: string | null;
    opticOddsSelection: string | null;
    opticOddsSelectionLine: string | null;
    opticOddsTeamId: string | null;
  }>;
  lineMarketSourceContract: {
    intendedProvider: "optic_odds";
    fixtureKey: string | null;
    missingFields: string[];
    requiredForFamilies: string[];
  };
};

export function extractProviderFixtureMetadataFromPolymarketEvent(
  event: PolymarketGroupedEvent,
): MobileLiveProviderFixtureMetadata {
  const eventMetadata = asRecord(event.raw.eventMetadata);
  const sport = asRecord(event.raw.sport);
  const teams = parseTeams(event.raw.teams);
  const moneylineMarkets = event.markets.map((market) => {
    const marketMetadata = asRecord(market.raw.marketMetadata);
    return {
      slug: market.slug,
      externalMarketId: market.marketId,
      conditionId: market.conditionId,
      sportsMarketType: asString(market.raw.sportsMarketType),
      opticOddsMarketId: asString(marketMetadata?.opticOddsMarketId),
      opticOddsMarketName: asString(marketMetadata?.opticOddsMarketName),
      opticOddsSelection: asString(marketMetadata?.opticOddsSelection),
      opticOddsSelectionLine: asString(marketMetadata?.opticOddsSelectionLine),
      opticOddsTeamId: asString(marketMetadata?.opticOddsTeamId),
    };
  });
  const fixtureKey = asString(eventMetadata?.opticOddsFixtureId);
  const missingFields = [
    fixtureKey ? null : "opticOddsFixtureId",
    teams.length >= 2 ? null : "teams",
    moneylineMarkets.some((market) => market.opticOddsMarketId) ? null : "moneylineMarketMetadata",
  ].filter((field): field is string => Boolean(field));

  return {
    providerSource: "polymarket-gamma",
    providerEventSlug: event.externalSlug,
    providerEventId: event.externalEventId,
    seriesSlug: asString(event.raw.seriesSlug),
    sport: asString(sport?.sport),
    live: asBoolean(event.raw.live),
    score: asString(event.raw.score),
    elapsed: asString(event.raw.elapsed),
    period: asString(event.raw.period),
    opticOddsFixtureId: fixtureKey,
    opticOddsGameId: asString(eventMetadata?.opticOddsGameId),
    opticOddsNumericalId: asNumber(eventMetadata?.opticOddsNumericalId),
    sportradarGameId: asString(eventMetadata?.sportradarGameId),
    teams,
    moneylineMarkets,
    lineMarketSourceContract: {
      intendedProvider: "optic_odds",
      fixtureKey,
      missingFields,
      requiredForFamilies: [
        "spread",
        "total_goals",
        "team_total_goals",
        "first_half",
        "second_half",
        "corners",
        "correct_score",
      ],
    },
  };
}

export function extractProviderFixtureMetadataFromEventMetadata(
  metadata: Prisma.JsonValue | null | undefined,
): MobileLiveProviderFixtureMetadata | null {
  const root = asRecord(metadata);
  const fixture = asRecord(root?.providerFixture);
  if (!fixture || fixture.providerSource !== "polymarket-gamma") return null;

  const contract = asRecord(fixture.lineMarketSourceContract);
  return {
    providerSource: "polymarket-gamma",
    providerEventSlug: asString(fixture.providerEventSlug) ?? "",
    providerEventId: asString(fixture.providerEventId) ?? "",
    seriesSlug: asString(fixture.seriesSlug),
    sport: asString(fixture.sport),
    live: asBoolean(fixture.live),
    score: asString(fixture.score),
    elapsed: asString(fixture.elapsed),
    period: asString(fixture.period),
    opticOddsFixtureId: asString(fixture.opticOddsFixtureId),
    opticOddsGameId: asString(fixture.opticOddsGameId),
    opticOddsNumericalId: asNumber(fixture.opticOddsNumericalId),
    sportradarGameId: asString(fixture.sportradarGameId),
    teams: Array.isArray(fixture.teams) ? fixture.teams.map(parseTeam).filter((team) => team.name) : [],
    moneylineMarkets: Array.isArray(fixture.moneylineMarkets)
      ? fixture.moneylineMarkets.map(parseMoneylineMarket).filter((market) => market.slug && market.externalMarketId)
      : [],
    lineMarketSourceContract: {
      intendedProvider: "optic_odds",
      fixtureKey: asString(contract?.fixtureKey),
      missingFields: parseStringArray(contract?.missingFields),
      requiredForFamilies: parseStringArray(contract?.requiredForFamilies),
    },
  };
}

export function mergeProviderFixtureMetadata(
  current: Prisma.JsonValue | null | undefined,
  providerFixture: MobileLiveProviderFixtureMetadata,
): Prisma.InputJsonValue {
  const root = asRecord(current) ?? {};
  return {
    ...root,
    providerFixture: providerFixture as unknown as Prisma.InputJsonValue,
  };
}

function parseTeams(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(parseTeam).filter((team) => team.name);
}

function parseTeam(value: unknown) {
  const record = asRecord(value);
  return {
    name: asString(record?.name) ?? "",
    abbreviation: asString(record?.abbreviation),
    ordering: asString(record?.ordering),
    providerId: asNumber(record?.providerId),
  };
}

function parseMoneylineMarket(value: unknown) {
  const record = asRecord(value);
  return {
    slug: asString(record?.slug) ?? "",
    externalMarketId: asString(record?.externalMarketId) ?? "",
    conditionId: asString(record?.conditionId),
    sportsMarketType: asString(record?.sportsMarketType),
    opticOddsMarketId: asString(record?.opticOddsMarketId),
    opticOddsMarketName: asString(record?.opticOddsMarketName),
    opticOddsSelection: asString(record?.opticOddsSelection),
    opticOddsSelectionLine: asString(record?.opticOddsSelectionLine),
    opticOddsTeamId: asString(record?.opticOddsTeamId),
  };
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
