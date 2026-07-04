import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertReferenceBotAdmin = jest.fn();
const expireMobileLiveProviderQuoteSnapshots = jest.fn();
const refreshMobileLiveProviderQuoteSnapshots = jest.fn();

jest.mock("@/lib/internalAdminAuth", () => ({
  assertReferenceBotAdmin: (...args: unknown[]) => assertReferenceBotAdmin(...args),
}));

jest.mock("@/server/services/mobileLiveProviderRefresh", () => ({
  expireMobileLiveProviderQuoteSnapshots: (...args: unknown[]) => expireMobileLiveProviderQuoteSnapshots(...args),
  refreshMobileLiveProviderQuoteSnapshots: (...args: unknown[]) => refreshMobileLiveProviderQuoteSnapshots(...args),
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
    });
    expect(body).toEqual({
      ok: true,
      expired: {
        eventSlug: "world-cup-live",
        compactMarketCount: 14,
        expiredSnapshotCount: 31,
        staleFetchedAt: "2026-07-03T22:00:00.000Z",
      },
      refresh: expect.objectContaining({
        compactMarketCount: 14,
        postRefresh: expect.objectContaining({
          snapshotCount: 31,
        }),
      }),
    });
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
    provider: {
      source: "polymarket-gamma",
      attempted: false,
      refreshedCount: 0,
      skippedCount: 0,
      snapshotsUpdated: 0,
      refreshed: [],
      skipped: [],
    },
    contractProofFallback: {
      applied: true,
      reason: "local_event_has_no_real_polymarket_market_mapping",
      snapshotsUpdated: 31,
    },
    postRefresh: {
      marketCount: 14,
      snapshotCount: 31,
      latestFetchedAt: "2026-07-03T22:01:00.000Z",
      oldestFetchedAt: "2026-07-03T22:01:00.000Z",
      sourceCount: 1,
    },
  });
}
