import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertReferenceBotAdmin = jest.fn();
const expireMobileLiveProviderQuoteSnapshots = jest.fn();
const refreshMobileLiveProviderQuoteSnapshots = jest.fn();
const revalidatePath = jest.fn();

jest.mock("@/lib/internalAdminAuth", () => ({
  assertReferenceBotAdmin: (...args: unknown[]) => assertReferenceBotAdmin(...args),
}));

jest.mock("@/server/services/mobileLiveProviderRefresh", () => ({
  expireMobileLiveProviderQuoteSnapshots: (...args: unknown[]) => expireMobileLiveProviderQuoteSnapshots(...args),
  refreshMobileLiveProviderQuoteSnapshots: (...args: unknown[]) => refreshMobileLiveProviderQuoteSnapshots(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

import { POST } from "@/app/api/mobile/events/[slug]/provider-refresh/route";

describe("mobile live provider refresh route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assertReferenceBotAdmin.mockResolvedValue({ id: "internal-admin-api-key", internal: true });
    expireMobileLiveProviderQuoteSnapshots.mockResolvedValue({
      eventSlug: "world-cup-live",
      compactMarketCount: 14,
      expiredSnapshotCount: 31,
      staleFetchedAt: "2026-07-03T22:00:00.000Z",
    });
    refreshMobileProvider();
  });

  test("requires internal/admin auth", async () => {
    assertReferenceBotAdmin.mockRejectedValue(new MarketGuardError("Forbidden", 403));

    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-refresh", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(403);
    expect(refreshMobileLiveProviderQuoteSnapshots).not.toHaveBeenCalled();
  });

  test("expires stale snapshots before executing provider refresh when requested", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-refresh", {
        method: "POST",
        body: JSON.stringify({
          expireFirst: true,
          staleSeconds: 180,
          allowContractProofFallback: true,
        }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(expireMobileLiveProviderQuoteSnapshots).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      staleSeconds: 180,
    });
    expect(refreshMobileLiveProviderQuoteSnapshots).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      allowContractProofFallback: true,
      lineProviderFetchImpl: undefined,
      providerDepthFetchImpl: undefined,
      providerHistoryFetchImpl: undefined,
    });
    expect(body).toEqual({
      ok: true,
      expired: {
        eventSlug: "world-cup-live",
        compactMarketCount: 14,
        expiredSnapshotCount: 31,
        staleFetchedAt: "2026-07-03T22:00:00.000Z",
      },
      providerLifecycle: expect.objectContaining({
        source: "mobile-live-provider-refresh",
        ready: true,
        nextRefreshAt: "2026-07-03T22:02:00.000Z",
      }),
      refresh: expect.objectContaining({
        compactMarketCount: 14,
        lineFamilyCoverage: expect.objectContaining({
          source: "mobile-live-provider-refresh-line-family-coverage",
          providerRefreshableFamilyCount: 2,
          hasReadyProviderMappedBreadth: true,
          optionalLineProviderBlocking: false,
        }),
        providerLifecycle: expect.objectContaining({
          ready: true,
        }),
        postRefresh: expect.objectContaining({
          snapshotCount: 31,
        }),
      }),
      cacheInvalidation: expect.objectContaining({
        source: "next-revalidate-path",
        eventSlug: "world-cup-live",
        marketCount: 1,
        chartMarketCount: 1,
        orderbookMarketCount: 1,
        invalidated: expect.arrayContaining([
          "/api/mobile/events/world-cup-live/live-detail",
          "/api/events/world-cup-live",
          "/api/markets/market-world-cup-live/chart",
          "/api/orderbook/market-world-cup-live/book",
        ]),
        errors: [],
      }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/api/mobile/events/world-cup-live/live-detail");
    expect(revalidatePath).toHaveBeenCalledWith("/api/events/world-cup-live");
    expect(revalidatePath).toHaveBeenCalledWith("/api/markets/market-world-cup-live/chart");
    expect(revalidatePath).toHaveBeenCalledWith("/api/orderbook/market-world-cup-live/book");
  });

  test("runs provider refresh without local proof fallback by default", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-refresh", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(200);
    expect(expireMobileLiveProviderQuoteSnapshots).not.toHaveBeenCalled();
    expect(refreshMobileLiveProviderQuoteSnapshots).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      allowContractProofFallback: false,
      lineProviderFetchImpl: undefined,
      providerDepthFetchImpl: undefined,
      providerHistoryFetchImpl: undefined,
    });
  });
});

function refreshMobileProvider() {
  refreshMobileLiveProviderQuoteSnapshots.mockResolvedValue({
    eventSlug: "world-cup-live",
    generatedAt: "2026-07-03T22:01:00.000Z",
    compactMarketCount: 14,
    providerMappedMarketCount: 0,
    unsupportedMarketCount: 14,
    unsupportedMarkets: [],
    mappingReadiness: {
      eventSlug: "world-cup-live",
      compactMarketCount: 14,
      providerRefreshableMarketCount: 0,
      isProviderRefreshReady: false,
      nextRequiredAction: "map_compact_markets_to_polymarket_provider_identity",
      markets: [
        {
          marketId: "market-world-cup-live",
          title: "World Cup Live",
          providerRefreshable: true,
          outcomes: [],
        },
      ],
    },
    provider: {
      source: "polymarket-gamma",
      attempted: false,
      refreshedCount: 0,
      skippedCount: 0,
      snapshotsUpdated: 0,
      refreshed: [],
      skipped: [],
    },
    providerDepth: {
      generatedAt: "2026-07-03T22:01:00.000Z",
      source: "polymarket-clob",
      maxLevels: 24,
      requestedMarketCount: 1,
      refreshedCount: 1,
      depthRowsUpdated: 8,
      skippedCount: 0,
      refreshed: [{ marketId: "market-world-cup-live", depthRowsUpdated: 8 }],
      skipped: [],
    },
    lineFamilyCoverage: {
      source: "mobile-live-provider-refresh-line-family-coverage",
      generatedAt: "2026-07-03T22:01:00.000Z",
      compactMarketCount: 14,
      familyCount: 3,
      providerRefreshableFamilyCount: 2,
      providerRefreshableMarketCount: 2,
      readyProviderRefreshableMarketCount: 2,
      hasProviderMappedBreadth: true,
      hasReadyProviderMappedBreadth: true,
      optionalLineProviderBlocking: false,
      families: [
        {
          family: "moneyline",
          marketCount: 1,
          providerRefreshableMarketCount: 1,
          readyMarketCount: 1,
          notReadyMarketCount: 0,
          statuses: ["ready"],
          marketIds: ["market-world-cup-live"],
          selectorKeys: ["main:full-game:default"],
        },
        {
          family: "spread",
          marketCount: 1,
          providerRefreshableMarketCount: 1,
          readyMarketCount: 1,
          notReadyMarketCount: 0,
          statuses: ["ready"],
          marketIds: ["market-world-cup-spread"],
          selectorKeys: ["spread:full-game:1.5"],
        },
      ],
      markets: [
        {
          marketId: "market-world-cup-live",
          selectorKey: "main:full-game:default",
          marketFamily: "moneyline",
          providerRefreshable: true,
          ready: true,
          notReady: false,
          quote: { source: "polymarket", status: "ready" },
          orderbookDepth: { source: "polymarket-clob", status: "ready" },
          chartHistory: { source: "polymarket-clob-prices-history", status: "ready" },
        },
        {
          marketId: "market-world-cup-spread",
          selectorKey: "spread:full-game:1.5",
          marketFamily: "spread",
          providerRefreshable: true,
          ready: true,
          notReady: false,
          quote: { source: "polymarket", status: "ready" },
          orderbookDepth: { source: "polymarket-clob", status: "ready" },
          chartHistory: { source: "polymarket-clob-prices-history", status: "ready" },
        },
      ],
    },
    contractProofFallback: {
      applied: true,
      reason: "local_event_has_no_real_polymarket_market_mapping",
      snapshotsUpdated: 31,
    },
    providerLifecycle: {
      source: "mobile-live-provider-refresh",
      generatedAt: "2026-07-03T22:01:00.000Z",
      quote: {
        source: "reference-quote-snapshot",
        status: "ready",
        latestAt: "2026-07-03T22:01:00.000Z",
        stalenessSeconds: 0,
        readyAfterSeconds: 60,
        staleAfterSeconds: 90,
        nextRefreshAt: "2026-07-03T22:02:00.000Z",
        shouldRefresh: false,
        reason: "Provider snapshot is fresh.",
      },
      orderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        latestAt: "2026-07-03T22:01:00.000Z",
        stalenessSeconds: 0,
        readyAfterSeconds: 60,
        staleAfterSeconds: 90,
        nextRefreshAt: "2026-07-03T22:02:00.000Z",
        shouldRefresh: false,
        reason: "Provider snapshot is fresh.",
      },
      chartHistory: {
        source: "market-outcome-snapshot",
        status: "ready",
        latestAt: "2026-07-03T22:01:00.000Z",
        stalenessSeconds: 0,
        readyAfterSeconds: 60,
        staleAfterSeconds: 90,
        nextRefreshAt: "2026-07-03T22:02:00.000Z",
        shouldRefresh: false,
        reason: "Provider snapshot is fresh.",
      },
      ready: true,
      refreshDue: false,
      stale: false,
      nextRefreshAt: "2026-07-03T22:02:00.000Z",
    },
    postRefresh: {
      marketCount: 14,
      snapshotCount: 31,
      latestFetchedAt: "2026-07-03T22:01:00.000Z",
      oldestFetchedAt: "2026-07-03T22:01:00.000Z",
      sourceCount: 1,
    },
    postRefreshDepth: {
      marketCount: 1,
      snapshotCount: 8,
      latestFetchedAt: "2026-07-03T22:01:00.000Z",
      oldestFetchedAt: "2026-07-03T22:01:00.000Z",
      sourceCount: 1,
      lifecycle: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        latestAt: "2026-07-03T22:01:00.000Z",
        stalenessSeconds: 0,
        readyAfterSeconds: 60,
        staleAfterSeconds: 90,
        nextRefreshAt: "2026-07-03T22:02:00.000Z",
        shouldRefresh: false,
        reason: "Provider snapshot is fresh.",
      },
    },
    postRefreshHistory: {
      marketCount: 1,
      snapshotCount: 24,
      latestSnapshotAt: "2026-07-03T22:01:00.000Z",
      oldestSnapshotAt: "2026-07-03T20:01:00.000Z",
      outcomeCount: 2,
      source: "market-outcome-snapshot",
      lifecycle: {
        source: "market-outcome-snapshot",
        status: "ready",
        latestAt: "2026-07-03T22:01:00.000Z",
        stalenessSeconds: 0,
        readyAfterSeconds: 60,
        staleAfterSeconds: 90,
        nextRefreshAt: "2026-07-03T22:02:00.000Z",
        shouldRefresh: false,
        reason: "Provider snapshot is fresh.",
      },
    },
  });
}
