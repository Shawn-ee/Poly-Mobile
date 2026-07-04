import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertReferenceBotAdmin = jest.fn();
const getMobileLiveProviderMappingReadiness = jest.fn();
const attachMobileLiveProviderIdentities = jest.fn();
const reviewMobileLiveProviderBulkSlugMappings = jest.fn();
const reviewMobileLiveLineProviderIdentities = jest.fn();

jest.mock("@/lib/internalAdminAuth", () => ({
  assertReferenceBotAdmin: (...args: unknown[]) => assertReferenceBotAdmin(...args),
}));

jest.mock("@/server/services/mobileLiveProviderMapping", () => ({
  getMobileLiveProviderMappingReadiness: (...args: unknown[]) => getMobileLiveProviderMappingReadiness(...args),
}));

jest.mock("@/server/services/mobileLiveProviderIdentityAttach", () => ({
  attachMobileLiveProviderIdentities: (...args: unknown[]) => attachMobileLiveProviderIdentities(...args),
}));

jest.mock("@/server/services/mobileLiveProviderBulkSlugReview", () => ({
  reviewMobileLiveProviderBulkSlugMappings: (...args: unknown[]) => reviewMobileLiveProviderBulkSlugMappings(...args),
}));

jest.mock("@/server/services/mobileLiveLineProviderIdentityReview", () => ({
  reviewMobileLiveLineProviderIdentities: (...args: unknown[]) => reviewMobileLiveLineProviderIdentities(...args),
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
    reviewMobileLiveProviderBulkSlugMappings.mockResolvedValue({
      eventSlug: "world-cup-live",
      mode: "bulk-manual-slug-review-apply",
      dryRun: true,
      applied: false,
      blocked: false,
      preview: {
        reviewCount: 2,
        attachReadyReviewCount: 2,
        mappings: [],
      },
      attach: {
        dryRun: true,
        applied: false,
      },
      nextRequiredAction: "confirm_apply_bulk_provider_identity_mappings",
    });
    reviewMobileLiveLineProviderIdentities.mockResolvedValue({
      eventSlug: "world-cup-live",
      mode: "line-provider-identity-review",
      dryRun: true,
      applied: false,
      blocked: false,
      validation: { valid: true, errors: [] },
      nextRequiredAction: "confirm_apply_line_provider_identity_reviews",
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

  test("review-first bulk slug mappings are dry-run by default", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping", {
        method: "POST",
        body: JSON.stringify({
          reviews: [
            { marketId: "market-1", slugs: ["fifwc-col-gha-2026-07-03-col"] },
            { marketId: "market-2", slugs: ["fifwc-col-gha-2026-07-03-draw"] },
          ],
        }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(reviewMobileLiveProviderBulkSlugMappings).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      dryRun: true,
      confirmApply: false,
      reviews: [
        { marketId: "market-1", slugs: ["fifwc-col-gha-2026-07-03-col"] },
        { marketId: "market-2", slugs: ["fifwc-col-gha-2026-07-03-draw"] },
      ],
    });
    expect(attachMobileLiveProviderIdentities).not.toHaveBeenCalled();
    expect(body.result).toEqual(expect.objectContaining({
      mode: "bulk-manual-slug-review-apply",
      blocked: false,
    }));
  });

  test("passes confirm apply through review-first bulk slug mapping workflow", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          confirmApply: true,
          reviews: [
            { marketId: "market-1", slugs: ["fifwc-col-gha-2026-07-03-col"] },
          ],
        }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(200);
    expect(reviewMobileLiveProviderBulkSlugMappings).toHaveBeenCalledWith(expect.objectContaining({
      eventSlug: "world-cup-live",
      dryRun: false,
      confirmApply: true,
    }));
  });

  test("routes reviewed line provider identity reviews through the protected mapping workflow", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/mobile/events/world-cup-live/provider-mapping", {
        method: "POST",
        body: JSON.stringify({
          dryRun: false,
          confirmApply: true,
          lineIdentityReviews: [
            {
              marketId: "total-market",
              providerSource: "optic_odds",
              fixtureId: "fixture-123",
              sportsbook: "BetMGM",
              providerMarketId: "total_goals",
              points: 2.5,
              period: null,
              outcomes: [
                { outcomeId: "over", providerOddId: "odd-over", selection: "Over 2.5", selectionLine: "over" },
                { outcomeId: "under", providerOddId: "odd-under", selection: "Under 2.5", selectionLine: "under" },
              ],
            },
          ],
        }),
      }),
      { params: Promise.resolve({ slug: "world-cup-live" }) },
    );

    expect(response.status).toBe(200);
    expect(reviewMobileLiveLineProviderIdentities).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      dryRun: false,
      confirmApply: true,
      reviews: [
        {
          marketId: "total-market",
          providerSource: "optic_odds",
          fixtureId: "fixture-123",
          sportsbook: "BetMGM",
          providerMarketId: "total_goals",
          points: 2.5,
          period: null,
          outcomes: [
            { outcomeId: "over", providerOddId: "odd-over", selection: "Over 2.5", selectionLine: "over" },
            { outcomeId: "under", providerOddId: "odd-under", selection: "Under 2.5", selectionLine: "under" },
          ],
        },
      ],
    });
    expect(attachMobileLiveProviderIdentities).not.toHaveBeenCalled();
    expect(reviewMobileLiveProviderBulkSlugMappings).not.toHaveBeenCalled();
  });
});
