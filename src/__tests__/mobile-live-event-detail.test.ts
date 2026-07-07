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
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-07-03T22:00:40.000Z").getTime());
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
      providerQuoteDepth: {
        source: "reference-quote-snapshot",
        levelCount: 2,
        sizeSource: "liquidity",
        isEstimatedSize: true,
        reason: "Provider quote snapshots expose top-of-book prices; sizes are estimated from provider liquidity fields.",
      },
      providerQuoteOutcomes: [
        {
          outcomeId: "home",
          source: "polymarket",
          outcomePrice: 0.62,
          bestBid: 0.59,
          bestAsk: 0.65,
          acceptingOrders: true,
          fetchedAt: "2026-07-03T22:00:10.000Z",
          updatedAt: "2026-07-03T22:00:11.000Z",
        },
      ],
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

  afterEach(() => {
    jest.restoreAllMocks();
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
      providerLifecycle: {
        source: "mobile-live-detail",
        status: "unavailable",
        ready: false,
        notReady: true,
        stale: false,
        refreshDue: false,
        unavailable: true,
        fallbackApplied: false,
        nextRefreshAt: "2026-07-03T22:01:00.000Z",
        lastFetchedAt: "2026-07-03T22:00:30.000Z",
      },
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
      providerLifecycle: {
        source: "mobile-live-detail-market",
        status: "ready",
        ready: true,
        notReady: false,
        stale: false,
        refreshDue: false,
        unavailable: false,
        empty: false,
        nextRefreshAt: "2026-07-03T22:01:00.000Z",
        lastFetchedAt: "2026-07-03T22:00:10.000Z",
        quote: {
          source: "polymarket",
          status: "ready",
          lastFetchedAt: "2026-07-03T22:00:10.000Z",
          ready: true,
          notReady: false,
        },
        orderbookDepth: {
          source: "polymarket-clob",
          status: "ready",
          lastFetchedAt: "2026-07-03T22:00:09.000Z",
          ready: true,
          notReady: false,
        },
        chartHistory: {
          source: "market-outcome-snapshot",
          status: "ready",
          lastFetchedAt: "2026-07-03T22:00:00.000Z",
          ready: true,
          notReady: false,
        },
      },
      selection: {
        selectorKey: "main:full-game:default",
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
      orderbookIdentity: {
        route: "/api/orderbook/market-main/book",
        marketId: "market-main",
        marketGroupId: "main",
        selectorKey: "main:full-game:default",
        marketFamily: "moneyline",
        period: "full-game",
        line: null,
        providerSource: "polymarket",
        providerStatus: "ready",
        depthSource: "provider-orderbook-depth",
        depthStatus: "ready",
        depthProviderSource: "reference-orderbook-depth-snapshot",
        depthProviderStatus: "ready",
        depthProviderSources: ["polymarket-clob"],
        refreshedAt: "2026-07-03T22:00:09.000Z",
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:01:09.000Z",
        shouldRefresh: false,
        isStale: false,
        ready: true,
        reason: "Depth comes from provider orderbook ladder snapshots.",
      },
      orderbookDepthSource: "provider-orderbook-depth",
      orderbookDepthStatus: "ready",
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
    buildPublicOrderbookSnapshot.mockResolvedValueOnce({
      bids: [],
      asks: [],
      depthSource: "empty",
      depthReason: "No local depth, provider orderbook ladder depth, or provider top-of-book depth is available.",
      providerOrderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "unavailable",
        levelCount: 0,
        snapshotCount: 0,
        latestFetchedAt: null,
        latestUpdatedAt: null,
        stalenessSeconds: null,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: null,
        shouldRefresh: true,
        isStale: false,
        sources: [],
        reason: "No provider orderbook depth snapshot is available.",
      },
      providerQuoteDepth: {
        source: "reference-quote-snapshot",
        levelCount: 0,
        sizeSource: null,
        isEstimatedSize: false,
        reason: "No provider quote snapshot is available.",
      },
      providerQuoteOutcomes: [],
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "unavailable",
        snapshotCount: 0,
        latestFetchedAt: null,
        latestUpdatedAt: null,
        stalenessSeconds: null,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: null,
        shouldRefresh: true,
        refreshKey: null,
        isStale: false,
        acceptingOrders: false,
        outcomeIds: [],
        sources: [],
        reason: "No provider quote snapshot is available for this market.",
      },
    });
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
    expect(payload.providerLifecycle).toMatchObject({
      source: "mobile-live-detail",
      status: "unavailable",
      ready: false,
      notReady: true,
      unavailable: true,
      empty: true,
      nextRefreshAt: null,
      lastFetchedAt: null,
    });
    expect(payload.markets[0].providerLifecycle).toMatchObject({
      source: "mobile-live-detail-market",
      status: "unavailable",
      ready: false,
      notReady: true,
      unavailable: true,
      empty: true,
      quote: {
        status: "unavailable",
        empty: true,
        notReady: true,
      },
      orderbookDepth: {
        status: "unavailable",
        empty: true,
        notReady: true,
      },
      chartHistory: {
        status: "unavailable",
        empty: true,
        notReady: true,
      },
    });
  });

  test("surfaces refresh-due provider lifecycle before stale threshold", async () => {
    buildPublicOrderbookSnapshot.mockResolvedValueOnce({
      bids: [{ outcomeId: "home", price: 0.59, size: 1060 }],
      asks: [{ outcomeId: "home", price: 0.65, size: 940 }],
      depthSource: "provider-orderbook-depth",
      depthReason: "Depth comes from provider orderbook ladder snapshots.",
      providerOrderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        levelCount: 2,
        snapshotCount: 2,
        latestFetchedAt: "2026-07-03T21:59:40.000Z",
        latestUpdatedAt: "2026-07-03T21:59:40.000Z",
        stalenessSeconds: 60,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:00:40.000Z",
        shouldRefresh: true,
        isStale: false,
        sources: ["polymarket-clob"],
        reason: "Provider orderbook depth snapshot is refresh-due.",
      },
      providerQuoteDepth: {
        source: "reference-quote-snapshot",
        levelCount: 2,
        sizeSource: "liquidity",
        isEstimatedSize: true,
        reason: "Provider quote snapshots expose top-of-book prices; sizes are estimated from provider liquidity fields.",
      },
      providerQuoteOutcomes: [
        {
          outcomeId: "home",
          source: "polymarket",
          outcomePrice: 0.62,
          bestBid: 0.59,
          bestAsk: 0.65,
          acceptingOrders: true,
          fetchedAt: "2026-07-03T21:59:40.000Z",
          updatedAt: "2026-07-03T21:59:40.000Z",
        },
      ],
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "ready",
        snapshotCount: 2,
        latestFetchedAt: "2026-07-03T21:59:40.000Z",
        latestUpdatedAt: "2026-07-03T21:59:40.000Z",
        stalenessSeconds: 60,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:00:40.000Z",
        shouldRefresh: true,
        refreshKey: "polymarket:2026-07-03T21:59:40.000Z",
        isStale: false,
        acceptingOrders: true,
        outcomeIds: ["home", "away"],
        sources: ["polymarket"],
        reason: "Provider quote snapshot is refresh-due.",
      },
    });

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
      chartSnapshots: [
        { marketId: "market-main", outcomeId: "home", ts: new Date("2026-07-03T21:59:40.000Z"), price: new Prisma.Decimal("0.59") },
      ],
    });

    expect(payload.markets[0].providerLifecycle).toMatchObject({
      status: "refresh_due",
      ready: false,
      notReady: true,
      refreshDue: true,
      stale: false,
      unavailable: false,
      nextRefreshAt: "2026-07-03T22:00:40.000Z",
      lastFetchedAt: "2026-07-03T21:59:40.000Z",
      quote: { status: "refresh_due", refreshDue: true },
      orderbookDepth: { status: "refresh_due", refreshDue: true },
      chartHistory: { status: "refresh_due", refreshDue: true },
    });
    expect(payload.providerLifecycle).toMatchObject({
      status: "refresh_due",
      refreshDue: true,
      notReady: true,
    });
  });

  test("keeps tablet status fields route-backed on the selected live-detail market", async () => {
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
        markets: [market({ id: "market-main", displayOrder: 0, referenceSource: "polymarket" })],
      },
      chartSnapshots: [
        { marketId: "market-main", outcomeId: "home", ts: new Date("2026-07-03T22:00:00.000Z"), price: new Prisma.Decimal("0.59") },
      ],
    });

    const selectedMarket = payload.markets[0];
    expect(payload.event.liveDataStatus).toMatchObject({
      source: "provider-feed",
      status: "ready",
      lastUpdated: "2026-07-03T22:00:10.000Z",
      reason: "Provider heartbeat accepted.",
    });
    expect(selectedMarket.selection).toMatchObject({
      marketId: "market-main",
      selectorKey: "main:full-game:default",
      marketFamily: "moneyline",
      chart: {
        targetMarketId: "market-main",
        status: "ready",
        source: "polymarket-clob-prices-history",
      },
    });
    expect(selectedMarket.orderbookIdentity).toMatchObject({
      marketId: "market-main",
      selectorKey: "main:full-game:default",
      providerSource: "polymarket",
      providerStatus: "ready",
      depthSource: "provider-orderbook-depth",
      depthStatus: "ready",
      nextRefreshAt: "2026-07-03T22:01:09.000Z",
      refreshedAt: "2026-07-03T22:00:09.000Z",
      ready: true,
      reason: "Depth comes from provider orderbook ladder snapshots.",
    });
    expect(selectedMarket.providerLifecycle).toMatchObject({
      source: "mobile-live-detail-market",
      status: "ready",
      ready: true,
      notReady: false,
      stale: false,
      refreshDue: false,
      unavailable: false,
      reason: "Provider lifecycle surfaces are ready.",
      nextRefreshAt: "2026-07-03T22:01:00.000Z",
      lastFetchedAt: "2026-07-03T22:00:10.000Z",
      quote: {
        source: "polymarket",
        status: "ready",
        reason: "Provider quote snapshot is fresh.",
        nextRefreshAt: "2026-07-03T22:01:10.000Z",
        lastFetchedAt: "2026-07-03T22:00:10.000Z",
        ready: true,
        notReady: false,
      },
      orderbookDepth: {
        source: "polymarket-clob",
        status: "ready",
        reason: "Provider orderbook depth snapshot is fresh.",
        nextRefreshAt: "2026-07-03T22:01:09.000Z",
        lastFetchedAt: "2026-07-03T22:00:09.000Z",
        ready: true,
        notReady: false,
      },
      chartHistory: {
        source: "polymarket-clob-prices-history",
        status: "ready",
        reason: "Provider chart history is fresh.",
        nextRefreshAt: "2026-07-03T22:01:00.000Z",
        lastFetchedAt: "2026-07-03T22:00:00.000Z",
        ready: true,
        notReady: false,
      },
    });
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("mock-ready");
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("fixture-ready");
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("frontend-fixture");
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
        selectorKey: "spreads:full-game:1.5",
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
        selectorKey: "totals:first-half:2.5",
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
            id: "over-25",
            side: "over",
            label: "Over 2.5",
            tokenId: "token-over",
            referenceTokenId: "token-over",
            referenceOutcomeLabel: "Over",
            isTradable: true,
          },
          {
            outcomeId: "under-25",
            id: "under-25",
            side: "under",
            label: "Under 2.5",
            tokenId: "token-under",
            referenceTokenId: "token-under",
            referenceOutcomeLabel: "Under",
            isTradable: true,
          },
        ],
      },
    });
    expect(payload.markets.find((item) => item.id === "team-total-15-2h")).toMatchObject({
      selection: {
        selectorKey: "team-totals:second-half:1.5",
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
      market({
        id: "to-advance",
        title: "Curacao to advance",
        marketGroupKey: "to-advance",
        marketGroupTitle: "To Advance",
        displayOrder: -1,
        marketType: "to_advance",
      }),
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
      "to-advance",
      "market-main",
      "spread-1",
      "totals-25",
      "team-total-15",
      "first-half-winner",
      "second-half-winner",
    ]));
  });

  test("reserves compact payload slots for backend winner-typed half markets", () => {
    const markets = [
      market({
        id: "to-advance",
        title: "Curacao to advance",
        marketGroupKey: "to-advance",
        marketGroupTitle: "To Advance",
        displayOrder: -1,
        marketType: "to_advance",
      }),
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
        marketType: "winner",
        period: "first-half",
        outcomes: [
          { id: "home", name: "Curacao", label: "Curacao", side: "home", displayOrder: 0, isTradable: true },
          { id: "draw", name: "Tie", label: "Tie", side: "draw", displayOrder: 1, isTradable: true },
          { id: "away", name: "Cote d'Ivoire", label: "Cote d'Ivoire", side: "away", displayOrder: 2, isTradable: true },
        ],
      }),
      market({
        id: "second-half-winner",
        title: "2nd Half Winner",
        marketGroupKey: "halves",
        marketGroupTitle: "Halves",
        displayOrder: 61,
        marketType: "winner",
        period: "second-half",
        outcomes: [
          { id: "home", name: "Curacao", label: "Curacao", side: "home", displayOrder: 0, isTradable: true },
          { id: "draw", name: "Tie", label: "Tie", side: "draw", displayOrder: 1, isTradable: true },
          { id: "away", name: "Cote d'Ivoire", label: "Cote d'Ivoire", side: "away", displayOrder: 2, isTradable: true },
        ],
      }),
    ];

    const compactMarkets = selectCompactLiveMarkets(markets);

    expect(compactMarkets).toHaveLength(14);
    expect(compactMarkets.map((item) => item.id)).toEqual(expect.arrayContaining([
      "first-half-winner",
      "second-half-winner",
    ]));
    expect(compactMarkets.find((item) => item.id === "first-half-winner")?.outcomes.map((outcome) => outcome.side)).toContain("draw");
    expect(compactMarkets.find((item) => item.id === "second-half-winner")?.outcomes.map((outcome) => outcome.side)).toContain("draw");
  });

  test("classifies imported binary home-draw-away soccer markets as regulation draw markets", async () => {
    const payload = await serializeMobileLiveEventDetail({
      event: {
        id: "event-imported-three-way",
        slug: "switzerland-vs-colombia",
        title: "Switzerland vs Colombia",
        description: "Imported FIFA World Cup match.",
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "match",
        homeTeamName: "Switzerland",
        awayTeamName: "Colombia",
        startTime: new Date("2026-07-07T20:00:00.000Z"),
        status: "LIVE",
        liveStatus: "in_progress",
        period: "Regulation",
        clock: null,
        homeScore: null,
        awayScore: null,
        imageUrl: null,
        metadata: {},
        markets: [
          market({
            id: "switzerland-win",
            title: "Will Switzerland win on 2026-07-07?",
            marketType: "match_winner_1x2",
            marketGroupKey: "main",
            marketGroupTitle: "Regulation Winner",
            outcomes: [
              { id: "swi-yes", name: "YES", label: "Switzerland", side: "yes", displayOrder: 0, isTradable: true },
              { id: "swi-no", name: "NO", label: "No", side: "no", displayOrder: 1, isTradable: true },
            ],
          }),
          market({
            id: "draw-win",
            title: "Will Switzerland vs Colombia end in a draw?",
            marketType: "match_winner_1x2",
            marketGroupKey: "main",
            marketGroupTitle: "Regulation Winner",
            outcomes: [
              { id: "draw-yes", name: "YES", label: "Draw (Switzerland vs Colombia)", side: "yes", displayOrder: 0, isTradable: true },
              { id: "draw-no", name: "NO", label: "No", side: "no", displayOrder: 1, isTradable: true },
            ],
          }),
          market({
            id: "colombia-win",
            title: "Will Colombia win on 2026-07-07?",
            marketType: "match_winner_1x2",
            marketGroupKey: "main",
            marketGroupTitle: "Regulation Winner",
            outcomes: [
              { id: "col-yes", name: "YES", label: "Colombia", side: "yes", displayOrder: 0, isTradable: true },
              { id: "col-no", name: "NO", label: "No", side: "no", displayOrder: 1, isTradable: true },
            ],
          }),
        ],
      },
      chartSnapshots: [],
    });

    expect(payload.event.marketProfile).toBe("regulation_90");
    expect(payload.event.resultMode).toBe("can_draw");
    expect(payload.event.gameRules).toMatchObject({ allowDraw: true, includesOvertime: false });
    expect(payload.event.supportedMarketTypes).toContain("regulation_90");
    expect(payload.event.supportedMarketTypes).not.toContain("full_match_with_overtime");
  });
});
