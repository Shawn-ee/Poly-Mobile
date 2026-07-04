import {
  extractProviderFixtureMetadataFromEventMetadata,
  extractProviderFixtureMetadataFromPolymarketEvent,
  mergeProviderFixtureMetadata,
} from "@/server/services/mobileLiveProviderFixtureMetadata";
import type { PolymarketGroupedEvent } from "@/server/services/polymarketEventImport";

describe("mobile live provider fixture metadata", () => {
  test("extracts OpticOdds fixture and market metadata from a Polymarket grouped event", () => {
    const fixture = extractProviderFixtureMetadataFromPolymarketEvent(sampleEvent());

    expect(fixture.opticOddsFixtureId).toBe("fixture-123");
    expect(fixture.opticOddsGameId).toBe("game-456");
    expect(fixture.teams).toEqual([
      expect.objectContaining({ name: "Colombia", providerId: 863 }),
      expect.objectContaining({ name: "Ghana", providerId: 1061 }),
    ]);
    expect(fixture.moneylineMarkets).toEqual([
      expect.objectContaining({
        slug: "fifwc-col-gha-2026-07-03-col",
        opticOddsMarketId: "moneyline_3-way",
        opticOddsSelection: "Colombia",
      }),
    ]);
    expect(fixture.lineMarketSourceContract.missingFields).toEqual([]);
  });

  test("round-trips through event metadata", () => {
    const fixture = extractProviderFixtureMetadataFromPolymarketEvent(sampleEvent());
    const merged = mergeProviderFixtureMetadata({ existing: true }, fixture);
    const roundTrip = extractProviderFixtureMetadataFromEventMetadata(merged);

    expect(roundTrip).toEqual(expect.objectContaining({
      providerEventSlug: "fifwc-col-gha-2026-07-03",
      opticOddsFixtureId: "fixture-123",
    }));
  });
});

function sampleEvent(): PolymarketGroupedEvent {
  return {
    eventId: "643888",
    eventSlug: "fifwc-col-gha-2026-07-03",
    title: "Colombia vs. Ghana",
    description: null,
    category: null,
    status: null,
    source: "polymarket",
    externalEventId: "643888",
    externalSlug: "fifwc-col-gha-2026-07-03",
    image: null,
    icon: null,
    active: true,
    closed: false,
    archived: false,
    endDate: null,
    volume: null,
    volume24hr: null,
    liquidity: null,
    liquidityClob: null,
    tags: ["Sports", "Soccer"],
    negativeRiskLike: true,
    raw: {
      seriesSlug: "soccer-fifwc",
      live: true,
      score: "1-0",
      elapsed: "64",
      period: "2H",
      eventMetadata: {
        opticOddsFixtureId: "fixture-123",
        opticOddsGameId: "game-456",
        opticOddsNumericalId: 956965,
        sportradarGameId: "sr:sport_event:53452507",
      },
      teams: [
        { name: "Colombia", abbreviation: "col", ordering: "home", providerId: 863 },
        { name: "Ghana", abbreviation: "gha", ordering: "away", providerId: 1061 },
      ],
      sport: { sport: "fifwc" },
    },
    markets: [
      {
        question: "Will Colombia win on 2026-07-03?",
        slug: "fifwc-col-gha-2026-07-03-col",
        marketId: "2718931",
        conditionId: "condition-1",
        groupItemTitle: "Colombia",
        outcomes: ["Yes", "No"],
        clobTokenIds: ["yes-token", "no-token"],
        outcomePrices: [0.86, 0.14],
        bestBid: 0.86,
        bestAsk: 0.87,
        spread: 0.01,
        lastTradePrice: 0.86,
        volume: 1,
        volume24hr: 1,
        liquidity: 1,
        liquidityClob: 1,
        acceptingOrders: true,
        active: true,
        closed: false,
        archived: false,
        endDate: null,
        image: null,
        icon: null,
        raw: {
          sportsMarketType: "moneyline",
          marketMetadata: {
            opticOddsMarketId: "moneyline_3-way",
            opticOddsMarketName: "Moneyline 3-Way",
            opticOddsSelection: "Colombia",
            opticOddsSelectionLine: "home",
            opticOddsTeamId: "A96127C0FBBAE86D",
          },
        },
      },
    ],
  };
}
