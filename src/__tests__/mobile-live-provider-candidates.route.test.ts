import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertReferenceBotAdmin = jest.fn();
const discoverMobileLiveProviderCandidates = jest.fn();
const previewMobileLiveProviderCandidatesBySlug = jest.fn();

jest.mock("@/lib/internalAdminAuth", () => ({
  assertReferenceBotAdmin: (...args: unknown[]) => assertReferenceBotAdmin(...args),
}));

jest.mock("@/server/services/mobileLiveProviderCandidates", () => ({
  discoverMobileLiveProviderCandidates: (...args: unknown[]) => discoverMobileLiveProviderCandidates(...args),
  previewMobileLiveProviderCandidatesBySlug: (...args: unknown[]) => previewMobileLiveProviderCandidatesBySlug(...args),
}));

import { GET, POST } from "@/app/api/mobile/events/[slug]/provider-candidates/route";

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
    previewMobileLiveProviderCandidatesBySlug.mockResolvedValue({
      eventSlug: "world-cup-live",
      mode: "manual-slug-preview",
      marketId: "market-1",
      candidateCount: 1,
      attachReadyCandidateCount: 1,
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
      providerSearchMode: null,
      providerEventSlugs: null,
    });
    expect(body).toEqual({
      ok: true,
      result: expect.objectContaining({
        provider: "polymarket-gamma",
      }),
    });
  });

  test("passes provider search mode to the service", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-candidates?providerSearchMode=sports-events&providerEventSlug=fifwc-col-gha-2026-07-03"),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(200);
    expect(discoverMobileLiveProviderCandidates).toHaveBeenCalledWith(expect.objectContaining({
      eventSlug: "world-cup-live",
      providerSearchMode: "sports-events",
      providerEventSlugs: ["fifwc-col-gha-2026-07-03"],
    }));
  });

  test("previews manual Polymarket slugs for a compact market", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-candidates", {
        method: "POST",
        body: JSON.stringify({
          marketId: "market-1",
          slugs: ["curacao-cote-divoire-match-winner"],
        }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(previewMobileLiveProviderCandidatesBySlug).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      marketId: "market-1",
      slugs: ["curacao-cote-divoire-match-winner"],
    });
    expect(body.result).toEqual(expect.objectContaining({
      mode: "manual-slug-preview",
      candidateCount: 1,
    }));
  });
});
