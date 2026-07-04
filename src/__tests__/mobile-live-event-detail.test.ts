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
  sourceUpdatedAt: new Date(),
  updatedAt: new Date(),
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
        metadata: {
          mobileLiveDetail: {
            liveDataStatus: {
              source: "provider-feed",
              status: "ready",
              lastUpdated: "2026-07-03T22:00:10.000Z",
              reason: "Provider heartbeat accepted.",
            },
          },
        },
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
      maxMarkets: 14,
      orderbookDepthSource: "orderbook-route",
      batchedOrderbookDepthSource: "orderbook-route",
      batchedOrderbookDepthMarketCount: 14,
      batchedOrderbookDepthRequestedMarketCount: 14,
      batchedOrderbookDepthMaxLevels: 24,
      batchedOrderbookDepthCacheTtlSeconds: 3,
      chartHistorySource: "market-outcome-snapshot",
      liveDataStatus: "ready",
    });
    expect(payload.contract.generatedAt).toEqual(expect.any(String));
    expect(new Date(payload.contract.generatedAt).toString()).not.toBe("Invalid Date");
    expect(payload.contract.batchedOrderbookDepthRequestedMarketIds).toEqual([
      "market-main",
      ...Array.from({ length: 13 }, (_, index) => `market-${index}`),
    ]);
    expect(payload.event.liveDataStatus).toMatchObject({
      source: "provider-feed",
      status: "ready",
      lastUpdated: "2026-07-03T22:00:10.000Z",
      staleAfterSeconds: 90,
      isStale: false,
      isSuspended: false,
      isDelayed: false,
      reason: "Provider heartbeat accepted.",
    });
    expect(payload.event.chartHistory).toEqual([
      { outcomeId: "home", timestamp: "2026-07-03T22:00:00.000Z", probability: 59 },
    ]);
    expect(payload.markets[0]).toMatchObject({
      id: "market-main",
      marketGroupId: "main",
      marketType: "match_winner_1x2",
      availability: {
        source: "market-source-updated-at",
        status: "ready",
        marketStatus: "LIVE",
        staleAfterSeconds: 90,
        isStale: false,
        isSuspended: false,
        isDelayed: false,
        reason: "Market orderbook data is fresh.",
      },
      orderbookDepth: [
        { outcomeId: "home", side: "bid", price: 0.59, shares: 1060, total: 625.4 },
        { outcomeId: "home", side: "ask", price: 0.65, shares: 940, total: 611 },
      ],
    });
    expect(payload.markets[1]).toMatchObject({
      id: "market-0",
      liquidity: 1236.4,
      orderbookDepth: [
        { outcomeId: "home", side: "bid", price: 0.59, shares: 1060, total: 625.4 },
        { outcomeId: "home", side: "ask", price: 0.65, shares: 940, total: 611 },
      ],
      outcomes: expect.arrayContaining([
        expect.objectContaining({
          id: "home",
          bestBid: 0.59,
          bestAsk: 0.65,
          bestBidSize: 1060,
          bestAskSize: 940,
        }),
      ]),
    });
    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledWith({ marketId: "market-main", maxLevels: 24 });
    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledWith({ marketId: "market-0", maxLevels: 24 });
    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledTimes(14);
  });

  test("marks live detail unavailable when no provider timestamp is available", async () => {
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
        status: "LIVE",
        liveStatus: "in_progress",
        period: "2H",
        clock: "67'",
        homeScore: 0,
        awayScore: 1,
        imageUrl: null,
        metadata: {},
        markets: [market({ id: "market-main", displayOrder: 0 })],
      },
      chartSnapshots: [],
    });

    expect(payload.contract.liveDataStatus).toBe("unavailable");
    expect(payload.event.liveDataStatus).toMatchObject({
      source: "unknown",
      status: "unavailable",
      lastUpdated: null,
      stalenessSeconds: null,
      staleAfterSeconds: 90,
      isStale: false,
      isSuspended: false,
      isDelayed: false,
      reason: "No provider timestamp available.",
    });
  });

  test("serializes compact market availability from backend market timestamps", async () => {
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
        status: "LIVE",
        liveStatus: "in_progress",
        period: "2H",
        clock: "67'",
        homeScore: 0,
        awayScore: 1,
        imageUrl: null,
        metadata: {},
        markets: [
          market({
            id: "stale-team-total",
            marketGroupKey: "team-totals",
            marketGroupTitle: "Team totals",
            marketType: "team_total_goals",
            line: new Prisma.Decimal("1.5"),
            sourceUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z"),
          }),
        ],
      },
      chartSnapshots: [],
    });

    expect(payload.markets[0]).toMatchObject({
      id: "stale-team-total",
      availability: {
        source: "market-source-updated-at",
        status: "stale",
        marketStatus: "LIVE",
        lastUpdated: "2020-01-01T00:00:00.000Z",
        staleAfterSeconds: 90,
        isStale: true,
        isSuspended: false,
        isDelayed: false,
        reason: "Latest market update is older than 90 seconds.",
      },
    });
    expect(payload.markets[0].availability.stalenessSeconds).toBeGreaterThan(90);
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
      market({
        id: "first-half-winner",
        title: "1st Half Winner",
        marketGroupKey: "halves",
        marketGroupTitle: "Halves",
        displayOrder: 60,
        marketType: "match_winner_1x2",
        period: "first-half",
      }),
      market({
        id: "second-half-winner",
        title: "2nd Half Winner",
        marketGroupKey: "halves",
        marketGroupTitle: "Halves",
        displayOrder: 61,
        marketType: "match_winner_1x2",
        period: "second-half",
      }),
    ];

    const compactMarkets = selectCompactLiveMarkets(markets);

    expect(compactMarkets).toHaveLength(14);
    expect(compactMarkets.map((item) => item.id)).toEqual(expect.arrayContaining([
      "market-main",
      "spread-1",
      "totals-25",
      "team-total-15",
      "first-half-winner",
      "second-half-winner",
    ]));
  });
});
