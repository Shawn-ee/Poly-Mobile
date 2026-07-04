import { Prisma } from "@prisma/client";

const getOutcomeQuotes = jest.fn();
const buildPublicOrderbookSnapshot = jest.fn();

jest.mock("@/lib/orderbookPricing", () => ({
  getOutcomeQuotes: (...args: unknown[]) => getOutcomeQuotes(...args),
}));

jest.mock("@/server/services/orderbookSnapshot", () => ({
  buildPublicOrderbookSnapshot: (...args: unknown[]) => buildPublicOrderbookSnapshot(...args),
}));

import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";

const market = (overrides: Partial<Parameters<typeof serializeMobileLiveEventDetail>[0]["event"]["markets"][number]> = {}) => ({
  id: "market-main",
  title: "Curacao vs Cote d'Ivoire: Match Winner",
  description: null,
  status: "LIVE",
  marketGroupKey: "main",
  marketGroupTitle: "Match Winner",
  displayOrder: 0,
  line: null,
  unit: null,
  period: "full-game",
  marketType: "match_winner_1x2",
  propCategory: null,
  rulesText: null,
  outcomes: [
    { id: "home", name: "Curacao", label: "Curacao", side: "home", displayOrder: 0, isTradable: true },
    { id: "away", name: "Cote d'Ivoire", label: "Cote d'Ivoire", side: "away", displayOrder: 1, isTradable: true },
  ],
  ...overrides,
});

describe("mobile live event detail contract", () => {
  beforeEach(() => {
    getOutcomeQuotes.mockReset();
    buildPublicOrderbookSnapshot.mockReset();
    getOutcomeQuotes.mockResolvedValue(
      new Map([
        ["home", { bestBid: 0.59, bestAsk: 0.65, bestBidSize: 1060, bestAskSize: 940, mid: 0.62, spread: 0.06 }],
        ["away", { bestBid: 0.37, bestAsk: 0.43, bestBidSize: 1220, bestAskSize: 1100, mid: 0.4, spread: 0.06 }],
      ]),
    );
    buildPublicOrderbookSnapshot.mockResolvedValue({
      bids: [{ outcomeId: "home", price: 0.59, size: 1060 }],
      asks: [{ outcomeId: "home", price: 0.65, size: 940 }],
    });
  });

  test("returns compact ticket-ready markets with chart history and depth levels", async () => {
    const payload = await serializeMobileLiveEventDetail({
      event: {
        id: "event-1",
        slug: "world-cup-match",
        title: "Curacao vs Cote d'Ivoire",
        description: "M55",
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "match",
        homeTeamName: "Curacao",
        awayTeamName: "Cote d'Ivoire",
        startTime: new Date("2026-06-25T20:00:00.000Z"),
        status: "scheduled",
        liveStatus: "pre_match",
        period: null,
        clock: null,
        homeScore: null,
        awayScore: null,
        imageUrl: null,
        metadata: {},
        markets: [
          market({ id: "market-main", displayOrder: 0 }),
          ...Array.from({ length: 20 }, (_, index) =>
            market({
              id: `market-${index}`,
              title: `Market ${index}`,
              marketGroupKey: "totals",
              marketGroupTitle: "Totals",
              displayOrder: index + 1,
              marketType: "total_goals",
            }),
          ),
        ],
      },
      chartSnapshots: [
        { outcomeId: "home", ts: new Date("2026-07-03T22:00:00.000Z"), price: new Prisma.Decimal("0.59") },
      ],
    });

    expect(payload.markets).toHaveLength(14);
    expect(payload.contract).toMatchObject({
      route: "mobile-live-detail",
      primaryMarketId: "market-main",
      orderbookDepthSource: "orderbook-route",
      chartHistorySource: "market-outcome-snapshot",
    });
    expect(payload.event.chartHistory).toEqual([
      { outcomeId: "home", timestamp: "2026-07-03T22:00:00.000Z", probability: 59 },
    ]);
    expect(payload.markets[0]).toMatchObject({
      id: "market-main",
      marketGroupId: "main",
      marketType: "match_winner_1x2",
      orderbookDepth: [
        { outcomeId: "home", side: "bid", price: 0.59, shares: 1060, total: 625.4 },
        { outcomeId: "home", side: "ask", price: 0.65, shares: 940, total: 611 },
      ],
    });
    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledWith({ marketId: "market-main", maxLevels: 24 });
  });

  test("reserves compact payload slots for rendered line market groups", () => {
    const markets = [
      market({ id: "market-main", displayOrder: 0 }),
      ...Array.from({ length: 16 }, (_, index) =>
        market({
          id: `spread-${index}`,
          title: `Spread ${index}`,
          marketGroupKey: "spreads",
          marketGroupTitle: "Spreads",
          displayOrder: index + 1,
          marketType: "spread",
          line: new Prisma.Decimal(index === 1 ? "1.5" : `${index + 0.5}`),
        }),
      ),
      market({
        id: "totals-25",
        title: "Total goals 2.5",
        marketGroupKey: "totals",
        marketGroupTitle: "Totals",
        displayOrder: 50,
        marketType: "total_goals",
        line: new Prisma.Decimal("2.5"),
      }),
      market({
        id: "team-total-15",
        title: "Curacao goals 1.5",
        marketGroupKey: "team-totals",
        marketGroupTitle: "Team totals",
        displayOrder: 51,
        marketType: "team_total_goals",
        line: new Prisma.Decimal("1.5"),
      }),
    ];

    const compactMarkets = selectCompactLiveMarkets(markets);

    expect(compactMarkets).toHaveLength(14);
    expect(compactMarkets.map((item) => item.id)).toEqual(expect.arrayContaining([
      "market-main",
      "spread-1",
      "totals-25",
      "team-total-15",
    ]));
  });
});
