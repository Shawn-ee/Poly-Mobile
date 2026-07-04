import { Prisma } from "@prisma/client";
import {
  buildOpticOddsReferenceQuoteRows,
  fetchOpticOddsFixtureOdds,
  getOpticOddsLineRefreshConfig,
  type OpticOddsFixtureOddsResponse,
} from "@/server/services/mobileLiveOpticOddsLineIngestion";
import type { MobileLiveProviderFixtureMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";

describe("mobile live OpticOdds line ingestion", () => {
  test("builds reference quote rows for multiple line market families", () => {
    const rows = buildOpticOddsReferenceQuoteRows({
      providerFixture: fixture(),
      compactMarkets: compactMarkets(),
      response: opticResponse(),
      fetchedAt: "2026-07-04T12:00:00.000Z",
    });

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        marketId: "spread-market",
        outcomeId: "spread-home",
        source: "optic_odds",
        externalMarketId: "spread-home-odd",
        outcomePrice: 0.51,
      }),
      expect.objectContaining({
        marketId: "total-market",
        outcomeId: "total-over",
        source: "optic_odds",
        externalMarketId: "total-over-odd",
        outcomePrice: 0.48,
      }),
      expect.objectContaining({
        marketId: "team-total-market",
        outcomeId: "team-total-under",
        source: "optic_odds",
        externalMarketId: "team-total-under-odd",
        outcomePrice: 0.57,
      }),
    ]));
    expect(new Set(rows.map((row) => row.marketId))).toEqual(new Set([
      "spread-market",
      "total-market",
      "team-total-market",
    ]));
  });

  test("fetches fixture odds with repeated sportsbook and market query params", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await fetchOpticOddsFixtureOdds({
      fixtureId: "fixture-123",
      config: {
        apiKey: "key",
        baseUrl: "https://api.opticodds.com/api/v3",
        sportsbooks: ["BetMGM", "DraftKings"],
        markets: ["point_spread", "total_goals"],
        oddsFormat: "PROBABILITY",
        source: "optic_odds",
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const url = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v3/fixtures/odds");
    expect(url.searchParams.getAll("sportsbook")).toEqual(["BetMGM", "DraftKings"]);
    expect(url.searchParams.getAll("market")).toEqual(["point_spread", "total_goals"]);
    expect(fetchImpl.mock.calls[0][1]).toEqual(expect.objectContaining({
      headers: { "X-Api-Key": "key" },
    }));
  });

  test("config is credential gated", () => {
    const config = getOpticOddsLineRefreshConfig({
      OPTIC_ODDS_SPORTSBOOKS: "BetMGM,DraftKings,FanDuel,Caesars,bet365,Extra",
    } as NodeJS.ProcessEnv);

    expect(config.apiKey).toBeNull();
    expect(config.sportsbooks).toEqual(["BetMGM", "DraftKings", "FanDuel", "Caesars", "bet365"]);
    expect(config.markets).toContain("total_goals");
  });
});

function compactMarkets() {
  return [
    {
      id: "spread-market",
      title: "Colombia -1.5",
      marketType: "spread",
      line: new Prisma.Decimal("1.5"),
      period: null,
      outcomes: [
        { id: "spread-home", name: "Colombia -1.5", label: "Colombia", side: "home" },
        { id: "spread-away", name: "Ghana +1.5", label: "Ghana", side: "away" },
      ],
    },
    {
      id: "total-market",
      title: "Over/Under 2.5 total goals",
      marketType: "total_goals",
      line: new Prisma.Decimal("2.5"),
      period: null,
      outcomes: [
        { id: "total-over", name: "Over 2.5", label: "Over", side: "over" },
        { id: "total-under", name: "Under 2.5", label: "Under", side: "under" },
      ],
    },
    {
      id: "team-total-market",
      title: "Colombia total goals 1.5",
      marketType: "team_total_goals",
      line: new Prisma.Decimal("1.5"),
      period: null,
      outcomes: [
        { id: "team-total-over", name: "Colombia over 1.5", label: "Over", side: "over" },
        { id: "team-total-under", name: "Colombia under 1.5", label: "Under", side: "under" },
      ],
    },
  ];
}

function fixture(): MobileLiveProviderFixtureMetadata {
  return {
    providerSource: "polymarket-gamma",
    providerEventSlug: "fifwc-col-gha-2026-07-03",
    providerEventId: "643888",
    seriesSlug: "soccer-fifwc",
    sport: "fifwc",
    live: true,
    score: "1-0",
    elapsed: "74",
    period: "2H",
    opticOddsFixtureId: "fixture-123",
    opticOddsGameId: "game-456",
    opticOddsNumericalId: 956965,
    sportradarGameId: "sr:sport_event:53452507",
    teams: [
      { name: "Colombia", abbreviation: "col", ordering: "home", providerId: 863 },
      { name: "Ghana", abbreviation: "gha", ordering: "away", providerId: 1061 },
    ],
    moneylineMarkets: [],
    lineMarketSourceContract: {
      intendedProvider: "optic_odds",
      fixtureKey: "fixture-123",
      missingFields: [],
      requiredForFamilies: ["spread", "total_goals", "team_total_goals"],
    },
  };
}

function opticResponse(): OpticOddsFixtureOddsResponse {
  return {
    data: [
      {
        id: "fixture-123",
        game_id: "game-456",
        is_live: true,
        home_competitors: [{ id: "home-team", name: "Colombia", abbreviation: "COL" }],
        away_competitors: [{ id: "away-team", name: "Ghana", abbreviation: "GHA" }],
        odds: [
          odd("spread-home-odd", "point_spread", "Colombia", "home-team", 1.5, null, 0.51),
          odd("spread-away-odd", "point_spread", "Ghana", "away-team", 1.5, null, 0.49),
          odd("total-over-odd", "total_goals", "Over 2.5", null, 2.5, "over", 0.48),
          odd("total-under-odd", "total_goals", "Under 2.5", null, 2.5, "under", 0.52),
          odd("team-total-over-odd", "team_total_goals", "Colombia Over 1.5", "home-team", 1.5, "over", 0.43),
          odd("team-total-under-odd", "team_total_goals", "Colombia Under 1.5", "home-team", 1.5, "under", 0.57),
        ],
      },
    ],
  };
}

function odd(
  id: string,
  marketId: string,
  name: string,
  teamId: string | null,
  points: number,
  selectionLine: string | null,
  price: number,
) {
  return {
    id,
    sportsbook: "BetMGM",
    market: marketId,
    market_id: marketId,
    name,
    selection: name,
    normalized_selection: name.toLowerCase().replace(/\s+/g, "_"),
    selection_line: selectionLine,
    team_id: teamId,
    points,
    price,
    is_main: true,
    timestamp: 1783137600,
  };
}
