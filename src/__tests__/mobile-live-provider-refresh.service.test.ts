const mockEventFindFirst = jest.fn();
const mockReferenceQuoteSnapshotFindMany = jest.fn();
const mockReferenceOrderbookDepthSnapshotFindMany = jest.fn();
const mockMarketOutcomeSnapshotFindMany = jest.fn();
const mockRefreshPolymarketReferenceSnapshots = jest.fn();
const mockRefreshPolymarketOrderbookDepthSnapshots = jest.fn();
const mockRefreshPolymarketPriceHistorySnapshots = jest.fn();
const mockRefreshOpticOddsLineQuoteSnapshots = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findFirst: (...args: unknown[]) => mockEventFindFirst(...args),
    },
    referenceQuoteSnapshot: {
      findMany: (...args: unknown[]) => mockReferenceQuoteSnapshotFindMany(...args),
      updateMany: jest.fn(),
    },
    referenceOrderbookDepthSnapshot: {
      findMany: (...args: unknown[]) => mockReferenceOrderbookDepthSnapshotFindMany(...args),
    },
    marketOutcomeSnapshot: {
      findMany: (...args: unknown[]) => mockMarketOutcomeSnapshotFindMany(...args),
    },
  },
}));

jest.mock("@/server/services/polymarketReferenceSnapshots", () => ({
  refreshPolymarketReferenceSnapshots: (...args: unknown[]) => mockRefreshPolymarketReferenceSnapshots(...args),
}));

jest.mock("@/server/services/polymarketOrderbookDepthSnapshots", () => ({
  refreshPolymarketOrderbookDepthSnapshots: (...args: unknown[]) => mockRefreshPolymarketOrderbookDepthSnapshots(...args),
}));

jest.mock("@/server/services/polymarketPriceHistorySnapshots", () => ({
  refreshPolymarketPriceHistorySnapshots: (...args: unknown[]) => mockRefreshPolymarketPriceHistorySnapshots(...args),
}));

jest.mock("@/server/services/mobileLiveOpticOddsLineIngestion", () => ({
  refreshOpticOddsLineQuoteSnapshots: (...args: unknown[]) => mockRefreshOpticOddsLineQuoteSnapshots(...args),
}));

import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";

describe("mobile live provider refresh service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-07-04T12:00:30.000Z").getTime());
    mockEventFindFirst.mockImplementation(async (args) => {
      if (args?.include?.markets) {
        return {
          slug: "world-cup-live",
          markets: [
            {
              id: "market-world-cup-live",
              title: "World Cup Live",
              description: null,
              status: "LIVE",
              referenceSource: "polymarket",
              externalSlug: "world-cup-live",
              externalMarketId: "gamma-market-1",
              conditionId: "condition-1",
              marketGroupKey: "main",
              marketGroupTitle: "Match Winner",
              displayOrder: 0,
              line: null,
              unit: null,
              period: "full-game",
              marketType: "moneyline",
              propCategory: null,
              rulesText: null,
              outcomes: [
                {
                  id: "outcome-home",
                  name: "Home",
                  label: "Home",
                  side: "home",
                  displayOrder: 0,
                  isTradable: true,
                  referenceTokenId: "token-home",
                  referenceOutcomeLabel: "Home",
                },
                {
                  id: "outcome-away",
                  name: "Away",
                  label: "Away",
                  side: "away",
                  displayOrder: 1,
                  isTradable: true,
                  referenceTokenId: "token-away",
                  referenceOutcomeLabel: "Away",
                },
              ],
            },
          ],
        };
      }
      return { metadata: {} };
    });
    mockRefreshPolymarketReferenceSnapshots.mockResolvedValue({
      generatedAt: "2026-07-04T12:00:00.000Z",
      refreshedCount: 1,
      snapshotsUpdated: 2,
      skippedCount: 0,
      refreshed: [{ marketId: "market-world-cup-live" }],
      skipped: [],
    });
    mockRefreshPolymarketOrderbookDepthSnapshots.mockResolvedValue({
      generatedAt: "2026-07-04T12:00:00.000Z",
      source: "polymarket-clob",
      maxLevels: 24,
      requestedMarketCount: 1,
      refreshedCount: 1,
      depthRowsUpdated: 8,
      skippedCount: 0,
      refreshed: [{ marketId: "market-world-cup-live", depthRowsUpdated: 8 }],
      skipped: [],
    });
    mockRefreshPolymarketPriceHistorySnapshots.mockResolvedValue({
      generatedAt: "2026-07-04T12:00:00.000Z",
      source: "polymarket-clob-prices-history",
      interval: "1d",
      fidelityMinutes: 5,
      requestedMarketCount: 1,
      refreshedCount: 1,
      snapshotsCreated: 24,
      skippedCount: 0,
      refreshed: [{ marketId: "market-world-cup-live", snapshotsCreated: 24 }],
      skipped: [],
    });
    mockRefreshOpticOddsLineQuoteSnapshots.mockResolvedValue({
      source: "optic_odds",
      attempted: false,
      status: "skipped",
      skippedReason: "missing_optic_odds_api_key",
      refreshedCount: 0,
      snapshotsUpdated: 0,
      skippedCount: 0,
      refreshed: [],
      skipped: [],
    });
    mockReferenceQuoteSnapshotFindMany.mockResolvedValue([
      { source: "polymarket", fetchedAt: new Date("2026-07-04T12:00:00.000Z") },
      { source: "polymarket", fetchedAt: new Date("2026-07-04T12:00:05.000Z") },
    ]);
    mockReferenceOrderbookDepthSnapshotFindMany.mockResolvedValue([
      { source: "polymarket-clob", fetchedAt: new Date("2026-07-04T12:00:00.000Z") },
      { source: "polymarket-clob", fetchedAt: new Date("2026-07-04T12:00:00.000Z") },
    ]);
    mockMarketOutcomeSnapshotFindMany.mockResolvedValue([
      { outcomeId: "outcome-home", ts: new Date("2026-07-04T11:55:00.000Z") },
      { outcomeId: "outcome-away", ts: new Date("2026-07-04T11:55:00.000Z") },
      { outcomeId: "outcome-home", ts: new Date("2026-07-04T12:00:00.000Z") },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("summarizes chart history after provider refresh for compact markets", async () => {
    const report = await refreshMobileLiveProviderQuoteSnapshots({
      eventSlug: "world-cup-live",
      allowContractProofFallback: false,
    });

    expect(mockRefreshPolymarketOrderbookDepthSnapshots).toHaveBeenCalledWith({
      marketIds: ["market-world-cup-live"],
      fetchImpl: undefined,
    });
    expect(mockRefreshPolymarketPriceHistorySnapshots).toHaveBeenCalledWith({
      marketIds: ["market-world-cup-live"],
      interval: "1d",
      fidelityMinutes: 5,
      fetchImpl: undefined,
    });
    expect(mockMarketOutcomeSnapshotFindMany).toHaveBeenCalledWith({
      where: { marketId: { in: ["market-world-cup-live"] } },
      select: { outcomeId: true, ts: true },
    });
    expect(mockReferenceOrderbookDepthSnapshotFindMany).toHaveBeenCalledWith({
      where: { marketId: { in: ["market-world-cup-live"] } },
      select: { source: true, fetchedAt: true },
    });
    expect(report.providerHistory).toMatchObject({
      source: "polymarket-clob-prices-history",
      requestedMarketCount: 1,
      refreshedCount: 1,
      snapshotsCreated: 24,
    });
    expect(report.providerLifecycle).toMatchObject({
      source: "mobile-live-provider-refresh",
      status: "ready",
      ready: true,
      notReady: false,
      refreshDue: false,
      stale: false,
      unavailable: false,
      empty: false,
      refreshStarted: true,
      refreshing: false,
      refreshStatus: "completed",
      fallbackApplied: false,
      reason: "Provider lifecycle surfaces are ready after refresh.",
      lastFetchedAt: "2026-07-04T12:00:05.000Z",
      quote: {
        source: "reference-quote-snapshot",
        status: "ready",
        lastFetchedAt: "2026-07-04T12:00:05.000Z",
        ready: true,
        notReady: false,
        nextRefreshAt: "2026-07-04T12:01:05.000Z",
      },
      orderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        lastFetchedAt: "2026-07-04T12:00:00.000Z",
        ready: true,
        notReady: false,
        nextRefreshAt: "2026-07-04T12:01:00.000Z",
      },
      chartHistory: {
        source: "market-outcome-snapshot",
        status: "ready",
        lastFetchedAt: "2026-07-04T12:00:00.000Z",
        ready: true,
        notReady: false,
        nextRefreshAt: "2026-07-04T12:01:00.000Z",
      },
      lineProvider: {
        source: "optic_odds",
        status: "unconfigured",
        attempted: false,
        optional: true,
        blocking: false,
        skippedReason: "missing_optic_odds_api_key",
        reason: "OPTIC_ODDS_API_KEY is optional enrichment and is not configured.",
      },
      nextRefreshAt: "2026-07-04T12:01:00.000Z",
    });
    expect(report.providerLifecycle.refreshStartedAt).toEqual(expect.any(String));
    expect(report.providerLifecycle.refreshCompletedAt).toEqual(expect.any(String));
    expect(report.postRefreshDepth).toMatchObject({
      marketCount: 1,
      snapshotCount: 2,
      sourceCount: 1,
      latestFetchedAt: "2026-07-04T12:00:00.000Z",
      lifecycle: expect.objectContaining({
        status: "ready",
        shouldRefresh: false,
      }),
    });
    expect(report.postRefreshHistory).toEqual({
      marketCount: 1,
      snapshotCount: 3,
      latestSnapshotAt: "2026-07-04T12:00:00.000Z",
      oldestSnapshotAt: "2026-07-04T11:55:00.000Z",
      outcomeCount: 2,
      source: "market-outcome-snapshot",
      lifecycle: expect.objectContaining({
        source: "market-outcome-snapshot",
        status: "ready",
        latestAt: "2026-07-04T12:00:00.000Z",
        nextRefreshAt: "2026-07-04T12:01:00.000Z",
        shouldRefresh: false,
      }),
    });
  });

  test("distinguishes refresh-due lifecycle snapshots from stale snapshots", async () => {
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-07-04T12:01:05.000Z").getTime());
    mockReferenceQuoteSnapshotFindMany.mockResolvedValue([
      { source: "polymarket", fetchedAt: new Date("2026-07-04T12:00:00.000Z") },
    ]);
    mockReferenceOrderbookDepthSnapshotFindMany.mockResolvedValue([
      { source: "polymarket-clob", fetchedAt: new Date("2026-07-04T11:59:00.000Z") },
    ]);
    mockMarketOutcomeSnapshotFindMany.mockResolvedValue([
      { outcomeId: "outcome-home", ts: new Date("2026-07-04T12:00:00.000Z") },
    ]);

    const report = await refreshMobileLiveProviderQuoteSnapshots({
      eventSlug: "world-cup-live",
      allowContractProofFallback: false,
    });

    expect(report.providerLifecycle).toMatchObject({
      status: "stale",
      ready: false,
      notReady: true,
      refreshDue: true,
      stale: true,
      unavailable: false,
      quote: expect.objectContaining({ status: "refresh_due", shouldRefresh: true }),
      orderbookDepth: expect.objectContaining({ status: "stale", shouldRefresh: true }),
      chartHistory: expect.objectContaining({ status: "refresh_due", shouldRefresh: true }),
    });
  });

  test("keeps empty provider surfaces explicitly unavailable", async () => {
    mockReferenceQuoteSnapshotFindMany.mockResolvedValue([]);
    mockReferenceOrderbookDepthSnapshotFindMany.mockResolvedValue([]);
    mockMarketOutcomeSnapshotFindMany.mockResolvedValue([]);

    const report = await refreshMobileLiveProviderQuoteSnapshots({
      eventSlug: "world-cup-live",
      allowContractProofFallback: false,
    });

    expect(report.providerLifecycle).toMatchObject({
      status: "unavailable",
      ready: false,
      notReady: true,
      refreshDue: false,
      stale: false,
      unavailable: true,
      empty: true,
      nextRefreshAt: null,
      lastFetchedAt: null,
      quote: {
        source: "empty",
        status: "unavailable",
        lastFetchedAt: null,
        shouldRefresh: true,
        unavailable: true,
        empty: true,
        notReady: true,
        reason: "No provider quote snapshot is available for compact markets.",
      },
      orderbookDepth: {
        source: "empty",
        status: "unavailable",
        lastFetchedAt: null,
        shouldRefresh: true,
        unavailable: true,
        empty: true,
        notReady: true,
        reason: "No provider orderbook depth snapshot is available for compact markets.",
      },
      chartHistory: {
        source: "empty",
        status: "unavailable",
        lastFetchedAt: null,
        shouldRefresh: true,
        unavailable: true,
        empty: true,
        notReady: true,
        reason: "No chart history snapshot is available for compact markets.",
      },
    });
  });
});
