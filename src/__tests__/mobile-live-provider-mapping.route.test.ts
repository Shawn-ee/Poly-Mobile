import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertReferenceBotAdmin = jest.fn();
const getMobileLiveProviderMappingReadiness = jest.fn();
const attachMobileLiveProviderIdentities = jest.fn();

jest.mock("@/lib/internalAdminAuth", () => ({
  assertReferenceBotAdmin: (...args: unknown[]) => assertReferenceBotAdmin(...args),
}));

jest.mock("@/server/services/mobileLiveProviderMapping", () => ({
  getMobileLiveProviderMappingReadiness: (...args: unknown[]) => getMobileLiveProviderMappingReadiness(...args),
}));

jest.mock("@/server/services/mobileLiveProviderIdentityAttach", () => ({
  attachMobileLiveProviderIdentities: (...args: unknown[]) => attachMobileLiveProviderIdentities(...args),
}));

import { GET, POST } from "@/app/api/mobile/events/[slug]/provider-mapping/route";

describe("mobile live provider mapping route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assertReferenceBotAdmin.mockResolvedValue({ id: "internal-admin-api-key", internal: true });
    getMobileLiveProviderMappingReadiness.mockResolvedValue({
      eventSlug: "world-cup-live",
      compactMarketCount: 14,
      providerRefreshableMarketCount: 0,
      unsupportedSourceMarketCount: 14,
      isProviderRefreshReady: false,
      nextRequiredAction: "map_compact_markets_to_polymarket_provider_identity",
      markets: [],
    });
    attachMobileLiveProviderIdentities.mockResolvedValue({
      eventSlug: "world-cup-live",
      dryRun: true,
      applied: false,
      validation: { valid: true, compactMarketCount: 14, requestedMarketCount: 1, errors: [] },
      before: { providerRefreshableMarketCount: 0 },
      after: { providerRefreshableMarketCount: 1 },
    });
  });

  test("requires internal/admin auth", async () => {
    assertReferenceBotAdmin.mockRejectedValue(new MarketGuardError("Forbidden", 403));

    const response = await GET(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping"),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(403);
    expect(getMobileLiveProviderMappingReadiness).not.toHaveBeenCalled();
  });

  test("returns provider mapping readiness for the compact live event", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping"),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getMobileLiveProviderMappingReadiness).toHaveBeenCalledWith("world-cup-live");
    expect(body).toEqual({
      ok: true,
      readiness: expect.objectContaining({
        eventSlug: "world-cup-live",
        compactMarketCount: 14,
        providerRefreshableMarketCount: 0,
        isProviderRefreshReady: false,
        nextRequiredAction: "map_compact_markets_to_polymarket_provider_identity",
      }),
    });
  });

  test("dry-runs provider identity attachment by default", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping", {
        method: "POST",
        body: JSON.stringify({
          mappings: [
            {
              marketId: "market-1",
              externalSlug: "provider-market",
              externalMarketId: "gamma-market-1",
              conditionId: "condition-1",
              outcomes: [],
            },
          ],
        }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(attachMobileLiveProviderIdentities).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      dryRun: true,
      confirmApply: false,
      mappings: [
        {
          marketId: "market-1",
          externalSlug: "provider-market",
          externalMarketId: "gamma-market-1",
          conditionId: "condition-1",
          outcomes: [],
        },
      ],
    });
    expect(body.result).toEqual(expect.objectContaining({
      dryRun: true,
      applied: false,
    }));
  });

  test("requires internal/admin auth for provider identity attachment", async () => {
    assertReferenceBotAdmin.mockRejectedValue(new MarketGuardError("Forbidden", 403));

    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping", {
        method: "POST",
        body: JSON.stringify({ mappings: [] }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(403);
    expect(attachMobileLiveProviderIdentities).not.toHaveBeenCalled();
  });
});
