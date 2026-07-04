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
      depthSource: "provider-orderbook-depth",
      depthReason: "Depth comes from provider orderbook ladder snapshots.",
      providerOrderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        levelCount: 2,
        snapshotCount: 2,
        latestFetchedAt: "2026-07-03T22:00:09.000Z",
        latestUpdatedAt: "2026-07-03T22:00:10.000Z",
        stalenessSeconds: 11,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:01:09.000Z",
        shouldRefresh: false,
        isStale: false,
        sources: ["polymarket-clob"],
        reason: "Provider orderbook depth snapshot is fresh.",
      },
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "ready",
        snapshotCount: 2,
        latestFetchedAt: "2026-07-03T22:00:10.000Z",
        latestUpdatedAt: "2026-07-03T22:00:11.000Z",
        stalenessSeconds: 10,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:01:10.000Z",
        shouldRefresh: false,
        refreshKey: "polymarket:2026-07-03T22:00:10.000Z",
        isStale: false,
        acceptingOrders: true,
        outcomeIds: ["away", "home"],
        sources: ["polymarket"],
        reason: "Provider quote snapshot is fresh.",
      },
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
        { marketId: "market-main", outcomeId: "home", ts: new Date("2026-07-03T22:00:00.000Z"), price: new Prisma.Decimal("0.59") },
        { marketId: "market-0", outcomeId: "away", ts: new Date("2026-07-03T22:00:30.000Z"), price: new Prisma.Decimal("0.41") },
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
      batchedProviderOrderbookDepthSource: "reference-orderbook-depth-snapshot",
      batchedProviderOrderbookDepthMarketCount: 14,
      batchedProviderOrderbookDepthReadyCount: 14,
      batchedProviderOrderbookDepthStaleCount: 0,
      batchedProviderOrderbookDepthRefreshDueCount: 0,
      batchedProviderQuoteSnapshotSource: "reference-quote-snapshot",
      batchedProviderQuoteSnapshotMarketCount: 14,
      batchedProviderQuoteSnapshotReadyCount: 14,
      batchedProviderQuoteSnapshotStaleCount: 0,
      batchedProviderQuoteSnapshotRefreshDueCount: 0,
      batchedProviderQuoteSnapshotNextRefreshAt: "2026-07-03T22:01:10.000Z",
      chartHistorySource: "market-outcome-snapshot",
      batchedChartHistorySource: "market-outcome-snapshot",
      batchedChartHistoryMarketCount: 2,
      batchedChartHistoryPointCount: 2,
      batchedChartHistoryRequestedMarketCount: 14,
      liveDataStatus: "ready",
    });
    expect(payload.contract.generatedAt).toEqual(expect.any(String));
    expect(new Date(payload.contract.generatedAt).toString()).not.toBe("Invalid Date");
    expect(payload.contract.batchedOrderbookDepthRequestedMarketIds).toEqual([
      "market-main",
      ...Array.from({ length: 13 }, (_, index) => `market-${index}`),
    ]);
    expect(payload.contract.batchedChartHistoryRequestedMarketIds).toEqual([
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
      chartHistory: [
        { outcomeId: "home", timestamp: "2026-07-03T22:00:00.000Z", probability: 59 },
      ],
      chartHistoryStatus: {
        source: "market-outcome-snapshot",
        status: "ready",
        pointCount: 1,
        outcomeCount: 1,
        lastUpdated: "2026-07-03T22:00:00.000Z",
        emptyState: null,
        range: "1D",
        ranges: ["1D", "1W", "1M", "MAX"],
      },
      selection: {
        selectorKey: "main:full-game:none:market-main",
        marketId: "market-main",
        marketGroupKey: "main",
        marketGroupId: "main",
        marketGroupTitle: "Match Winner",
        marketType: "match_winner_1x2",
        marketFamily: "moneyline",
        displayLabel: "Match Winner",
        period: "full-game",
        line: null,
        lineValue: null,
        unit: null,
        chart: {
          targetMarketId: "market-main",
          source: "market-outcome-snapshot",
          status: "ready",
          pointCount: 1,
          outcomeCount: 1,
          range: "1D",
          ranges: ["1D", "1W", "1M", "MAX"],
          emptyState: null,
        },
        outcomes: [
          { outcomeId: "home", side: "home", label: "Curacao", isTradable: true },
          { outcomeId: "away", side: "away", label: "Cote d'Ivoire", isTradable: true },
        ],
      },
      orderbookDepthSource: "provider-orderbook-depth",
      providerOrderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        levelCount: 2,
        snapshotCount: 2,
        sources: ["polymarket-clob"],
      },
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "ready",
        snapshotCount: 2,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:01:10.000Z",
        shouldRefresh: false,
        refreshKey: "polymarket:2026-07-03T22:00:10.000Z",
        acceptingOrders: true,
        outcomeIds: ["away", "home"],
        sources: ["polymarket"],
      },
    });
    expect(payload.markets[1]).toMatchObject({
      id: "market-0",
      liquidity: 1236.4,
      chartHistory: [
        { outcomeId: "away", timestamp: "2026-07-03T22:00:30.000Z", probability: 41 },
      ],
      chartHistoryStatus: {
        source: "market-outcome-snapshot",
        status: "ready",
        pointCount: 1,
        outcomeCount: 1,
        lastUpdated: "2026-07-03T22:00:30.000Z",
        emptyState: null,
      },
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

  test("keeps selected-market chart readiness separate from primary chart history", async () => {
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
          market({ id: "market-main", displayOrder: 0 }),
          market({
            id: "spread-15",
            title: "Curacao -1.5",
            marketGroupKey: "spreads",
            marketGroupTitle: "Spreads",
            displayOrder: 1,
            marketType: "spread",
            line: new Prisma.Decimal("1.5"),
          }),
        ],
      },
      chartSnapshots: [
        { marketId: "spread-15", outcomeId: "home", ts: new Date("2026-07-03T22:05:00.000Z"), price: new Prisma.Decimal("0.52") },
      ],
    });

    expect(payload.event.chartHistory).toEqual([]);
    expect(payload.contract).toMatchObject({
      chartHistorySource: "empty",
      batchedChartHistorySource: "market-outcome-snapshot",
      batchedChartHistoryMarketCount: 1,
      batchedChartHistoryPointCount: 1,
    });
    expect(payload.markets.find((item) => item.id === "market-main")).toMatchObject({
      chartHistory: [],
      chartHistoryStatus: {
        source: "empty",
        status: "unavailable",
        emptyState: "no-history",
      },
    });
    expect(payload.markets.find((item) => item.id === "spread-15")).toMatchObject({
      chartHistory: [
        { outcomeId: "home", timestamp: "2026-07-03T22:05:00.000Z", probability: 52 },
      ],
      chartHistoryStatus: {
        source: "market-outcome-snapshot",
        status: "ready",
        pointCount: 1,
        outcomeCount: 1,
        lastUpdated: "2026-07-03T22:05:00.000Z",
      },
      selection: {
        selectorKey: "spreads:full-game:1.5:spread-15",
        marketId: "spread-15",
        marketGroupKey: "spreads",
        marketGroupId: "spreads",
        marketGroupTitle: "Spreads",
        marketType: "spread",
        marketFamily: "spread",
        displayLabel: "Spreads 1.5",
        period: "full-game",
        line: "1.5",
        lineValue: 1.5,
        unit: null,
        chart: {
          targetMarketId: "spread-15",
          source: "market-outcome-snapshot",
          status: "ready",
          pointCount: 1,
          outcomeCount: 1,
          range: "1D",
          ranges: ["1D", "1W", "1M", "MAX"],
          emptyState: null,
        },
        outcomes: [
          { outcomeId: "home", side: "home", label: "Curacao", isTradable: true },
          { outcomeId: "away", side: "away", label: "Cote d'Ivoire", isTradable: true },
        ],
      },
    });
  });

  test("exposes selector-ready identity for line and period switching without UI-only inference", async () => {
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
          market({ id: "market-main", displayOrder: 0 }),
          market({
            id: "total-25-1h",
            title: "1st Half Total Goals 2.5",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 1,
            marketType: "total_goals",
            period: "first-half",
            line: new Prisma.Decimal("2.5"),
            unit: "goals",
            outcomes: [
              { id: "over-25", name: "Over", label: "Over 2.5", side: "over", displayOrder: 0, isTradable: true, referenceTokenId: "token-over", referenceOutcomeLabel: "Over" },
              { id: "under-25", name: "Under", label: "Under 2.5", side: "under", displayOrder: 1, isTradable: true, referenceTokenId: "token-under", referenceOutcomeLabel: "Under" },
            ],
          }),
          market({
            id: "team-total-15-2h",
            title: "2nd Half Curacao Total Goals 1.5",
            marketGroupKey: "team-totals",
            marketGroupTitle: "Team totals",
            displayOrder: 2,
            marketType: "team_total_goals",
            period: "second-half",
            line: new Prisma.Decimal("1.5"),
            unit: "goals",
          }),
        ],
      },
      chartSnapshots: [
        { marketId: "total-25-1h", outcomeId: "over-25", ts: new Date("2026-07-03T22:06:00.000Z"), price: new Prisma.Decimal("0.54") },
      ],
    });

    expect(payload.markets.find((item) => item.id === "total-25-1h")).toMatchObject({
      selection: {
        selectorKey: "totals:first-half:2.5:total-25-1h",
        marketId: "total-25-1h",
        marketGroupKey: "totals",
        marketGroupId: "totals",
        marketGroupTitle: "Totals",
        marketType: "total_goals",
        marketFamily: "total",
        displayLabel: "Totals first-half 2.5",
        period: "first-half",
        line: "2.5",
        lineValue: 2.5,
        unit: "goals",
        chart: {
          targetMarketId: "total-25-1h",
          status: "ready",
          source: "market-outcome-snapshot",
          pointCount: 1,
          outcomeCount: 1,
          emptyState: null,
        },
        outcomes: [
          {
            outcomeId: "over-25",
            side: "over",
            label: "Over 2.5",
            referenceTokenId: "token-over",
            referenceOutcomeLabel: "Over",
            isTradable: true,
          },
          {
            outcomeId: "under-25",
            side: "under",
            label: "Under 2.5",
            referenceTokenId: "token-under",
            referenceOutcomeLabel: "Under",
            isTradable: true,
          },
        ],
      },
    });
    expect(payload.markets.find((item) => item.id === "team-total-15-2h")).toMatchObject({
      selection: {
        selectorKey: "team-totals:second-half:1.5:team-total-15-2h",
        marketFamily: "team_total",
        displayLabel: "Team totals second-half 1.5",
        period: "second-half",
        line: "1.5",
        lineValue: 1.5,
        unit: "goals",
        chart: {
          targetMarketId: "team-total-15-2h",
          status: "unavailable",
          source: "empty",
          pointCount: 0,
          outcomeCount: 0,
          emptyState: "no-history",
        },
      },
    });
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
