import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertReferenceBotAdmin = jest.fn();
const discoverMobileLiveProviderCandidates = jest.fn();

jest.mock("@/lib/internalAdminAuth", () => ({
  assertReferenceBotAdmin: (...args: unknown[]) => assertReferenceBotAdmin(...args),
}));

jest.mock("@/server/services/mobileLiveProviderCandidates", () => ({
  discoverMobileLiveProviderCandidates: (...args: unknown[]) => discoverMobileLiveProviderCandidates(...args),
}));

import { GET } from "@/app/api/mobile/events/[slug]/provider-candidates/route";

describe("mobile live provider candidates route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assertReferenceBotAdmin.mockResolvedValue({ id: "internal-admin-api-key", internal: true });
    discoverMobileLiveProviderCandidates.mockResolvedValue({
      eventSlug: "world-cup-live",
      provider: "polymarket-gamma",
      targetMarketCount: 1,
      attachReadyCandidateCount: 0,
      targets: [],
    });
  });

  test("requires internal/admin auth", async () => {
    assertReferenceBotAdmin.mockRejectedValue(new MarketGuardError("Forbidden", 403));

    const response = await GET(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-candidates"),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(403);
    expect(discoverMobileLiveProviderCandidates).not.toHaveBeenCalled();
  });

  test("passes provider discovery query params to the service", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-candidates?marketId=market-1&fetchProvider=false&maxCandidatesPerMarket=3"),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(discoverMobileLiveProviderCandidates).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      marketId: "market-1",
      fetchProvider: false,
      maxCandidatesPerMarket: 3,
    });
    expect(body).toEqual({
      ok: true,
      result: expect.objectContaining({
        provider: "polymarket-gamma",
      }),
    });
  });
});
