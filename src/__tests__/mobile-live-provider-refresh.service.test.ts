const mockEventFindFirst = jest.fn();
const mockReferenceQuoteSnapshotFindMany = jest.fn();
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
      source: "optic-odds",
      attempted: false,
      skippedReason: "missing_api_key",
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
    mockMarketOutcomeSnapshotFindMany.mockResolvedValue([
      { outcomeId: "outcome-home", ts: new Date("2026-07-04T11:55:00.000Z") },
      { outcomeId: "outcome-away", ts: new Date("2026-07-04T11:55:00.000Z") },
      { outcomeId: "outcome-home", ts: new Date("2026-07-04T12:00:00.000Z") },
    ]);
  });

  test("summarizes chart history after provider refresh for compact markets", async () => {
    const report = await refreshMobileLiveProviderQuoteSnapshots({
      eventSlug: "world-cup-live",
      allowContractProofFallback: false,
    });

    expect(mockRefreshPolymarketPriceHistorySnapshots).toHaveBeenCalledWith({
      marketIds: ["market-world-cup-live"],
      interval: "1d",
      fidelityMinutes: 5,
    });
    expect(mockMarketOutcomeSnapshotFindMany).toHaveBeenCalledWith({
      where: { marketId: { in: ["market-world-cup-live"] } },
      select: { outcomeId: true, ts: true },
    });
    expect(report.providerHistory).toMatchObject({
      source: "polymarket-clob-prices-history",
      requestedMarketCount: 1,
      refreshedCount: 1,
      snapshotsCreated: 24,
    });
    expect(report.postRefreshHistory).toEqual({
      marketCount: 1,
      snapshotCount: 3,
      latestSnapshotAt: "2026-07-04T12:00:00.000Z",
      oldestSnapshotAt: "2026-07-04T11:55:00.000Z",
      outcomeCount: 2,
      source: "market-outcome-snapshot",
    });
  });
});
