const mockEventFindMany = jest.fn();
const mockReferenceQuoteSnapshotFindMany = jest.fn();
const mockRefreshMobileLiveProviderQuoteSnapshots = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
    },
    referenceQuoteSnapshot: {
      findMany: (...args: unknown[]) => mockReferenceQuoteSnapshotFindMany(...args),
    },
  },
}));

jest.mock("@/server/services/mobileLiveProviderRefresh", () => ({
  refreshMobileLiveProviderQuoteSnapshots: (...args: unknown[]) =>
    mockRefreshMobileLiveProviderQuoteSnapshots(...args),
}));

import { runScheduledMobileLiveProviderRefresh } from "@/server/services/mobileLiveProviderScheduler";

const providerEvent = () => ({
  slug: "world-cup-provider-live",
  title: "Provider Live Match",
  markets: [
    {
      id: "market-home",
      title: "Home wins",
      outcomes: [{ id: "home-yes" }, { id: "home-no" }],
    },
    {
      id: "market-away",
      title: "Away wins",
      outcomes: [{ id: "away-yes" }, { id: "away-no" }],
    },
  ],
});

describe("mobile live provider scheduler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-07-04T12:00:00.000Z"));
    mockEventFindMany.mockResolvedValue([providerEvent()]);
    mockRefreshMobileLiveProviderQuoteSnapshots.mockResolvedValue({
      mappingReadiness: {
        markets: [
          { marketId: "market-home" },
          { marketId: "market-away" },
        ],
      },
      provider: { snapshotsUpdated: 4 },
      postRefresh: { snapshotCount: 4 },
      postRefreshHistory: { snapshotCount: 8 },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("refreshes stale or missing provider-backed live events", async () => {
    mockReferenceQuoteSnapshotFindMany.mockResolvedValue([
      { marketId: "market-home", outcomeId: "home-yes", fetchedAt: new Date("2026-07-04T11:58:00.000Z") },
      { marketId: "market-home", outcomeId: "home-no", fetchedAt: new Date("2026-07-04T11:58:00.000Z") },
      { marketId: "market-away", outcomeId: "away-yes", fetchedAt: new Date("2026-07-04T11:59:50.000Z") },
    ]);

    const report = await runScheduledMobileLiveProviderRefresh({
      eventSlugs: ["world-cup-provider-live"],
      refreshTtlSeconds: 60,
      maxEvents: 3,
    });

    expect(mockEventFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        slug: { in: ["world-cup-provider-live"] },
      }),
    }));
    expect(mockRefreshMobileLiveProviderQuoteSnapshots).toHaveBeenCalledWith({
      eventSlug: "world-cup-provider-live",
      allowContractProofFallback: false,
    });
    expect(report).toMatchObject({
      runId: "mobile-live-provider-scheduler:2026-07-04T12:00:00.000Z",
      source: "mobile-live-provider-scheduler",
      status: "completed",
      startedAt: "2026-07-04T12:00:00.000Z",
      completedAt: "2026-07-04T12:00:00.000Z",
      durationMs: 0,
      refreshTtlSeconds: 60,
      candidateCount: 1,
      dueEventCount: 1,
      attemptedEventCount: 1,
      refreshedEventCount: 1,
      successfulEventCount: 1,
      failedEventCount: 0,
      dryRunEventCount: 0,
      candidates: [
        {
          eventSlug: "world-cup-provider-live",
          providerMarketCount: 2,
          providerOutcomeCount: 4,
          snapshotCount: 3,
          dueMarketIds: ["market-home", "market-away"],
          dueMarketCount: 2,
          missingOutcomeCount: 1,
          staleOutcomeCount: 2,
          shouldRefresh: true,
          nextAction: "refresh_provider_event",
        },
      ],
      refreshed: [
        {
          eventSlug: "world-cup-provider-live",
          status: "completed",
          dryRun: false,
          dueMarketCount: 2,
          cacheInvalidationContract: {
            liveDetailPath: "/api/mobile/events/world-cup-provider-live/live-detail",
            eventPath: "/api/events/world-cup-provider-live",
            chartPaths: [
              "/api/markets/market-home/chart",
              "/api/markets/market-away/chart",
            ],
            orderbookPaths: [
              "/api/orderbook/market-home/book",
              "/api/orderbook/market-away/book",
            ],
          },
        },
      ],
    });
  });

  test("skips fresh provider-backed events", async () => {
    mockReferenceQuoteSnapshotFindMany.mockResolvedValue([
      { marketId: "market-home", outcomeId: "home-yes", fetchedAt: new Date("2026-07-04T11:59:30.000Z") },
      { marketId: "market-home", outcomeId: "home-no", fetchedAt: new Date("2026-07-04T11:59:30.000Z") },
      { marketId: "market-away", outcomeId: "away-yes", fetchedAt: new Date("2026-07-04T11:59:30.000Z") },
      { marketId: "market-away", outcomeId: "away-no", fetchedAt: new Date("2026-07-04T11:59:30.000Z") },
    ]);

    const report = await runScheduledMobileLiveProviderRefresh({
      eventSlugs: ["world-cup-provider-live"],
      refreshTtlSeconds: 60,
    });

    expect(mockRefreshMobileLiveProviderQuoteSnapshots).not.toHaveBeenCalled();
    expect(report).toMatchObject({
      status: "completed",
      candidateCount: 1,
      dueEventCount: 0,
      attemptedEventCount: 0,
      refreshedEventCount: 0,
      successfulEventCount: 0,
      failedEventCount: 0,
      dryRunEventCount: 0,
      candidates: [
        {
          eventSlug: "world-cup-provider-live",
          dueMarketCount: 0,
          missingOutcomeCount: 0,
          staleOutcomeCount: 0,
          shouldRefresh: false,
          nextAction: "none",
        },
      ],
      refreshed: [],
    });
  });

  test("reports failed refresh attempts without using contract fallback", async () => {
    mockReferenceQuoteSnapshotFindMany.mockResolvedValue([
      { marketId: "market-home", outcomeId: "home-yes", fetchedAt: new Date("2026-07-04T11:58:00.000Z") },
      { marketId: "market-home", outcomeId: "home-no", fetchedAt: new Date("2026-07-04T11:58:00.000Z") },
    ]);
    mockRefreshMobileLiveProviderQuoteSnapshots.mockRejectedValue(new Error("provider unavailable"));

    const report = await runScheduledMobileLiveProviderRefresh({
      eventSlugs: ["world-cup-provider-live"],
      refreshTtlSeconds: 60,
    });

    expect(mockRefreshMobileLiveProviderQuoteSnapshots).toHaveBeenCalledWith({
      eventSlug: "world-cup-provider-live",
      allowContractProofFallback: false,
    });
    expect(report).toMatchObject({
      status: "completed_with_errors",
      candidateCount: 1,
      dueEventCount: 1,
      attemptedEventCount: 1,
      refreshedEventCount: 0,
      successfulEventCount: 0,
      failedEventCount: 1,
      dryRunEventCount: 0,
      refreshed: [
        {
          eventSlug: "world-cup-provider-live",
          status: "failed",
          dryRun: false,
          dueMarketCount: 2,
          refresh: null,
          error: {
            name: "Error",
            message: "provider unavailable",
          },
          cacheInvalidationContract: {
            liveDetailPath: "/api/mobile/events/world-cup-provider-live/live-detail",
            eventPath: "/api/events/world-cup-provider-live",
            chartPaths: [
              "/api/markets/market-home/chart",
              "/api/markets/market-away/chart",
            ],
            orderbookPaths: [
              "/api/orderbook/market-home/book",
              "/api/orderbook/market-away/book",
            ],
          },
        },
      ],
    });
  });
});
