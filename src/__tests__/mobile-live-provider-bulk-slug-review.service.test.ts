const previewMobileLiveProviderCandidatesBulkBySlug = jest.fn();
const attachMobileLiveProviderIdentities = jest.fn();

jest.mock("@/server/services/mobileLiveProviderCandidates", () => ({
  previewMobileLiveProviderCandidatesBulkBySlug: (...args: unknown[]) =>
    previewMobileLiveProviderCandidatesBulkBySlug(...args),
}));

jest.mock("@/server/services/mobileLiveProviderIdentityAttach", () => ({
  attachMobileLiveProviderIdentities: (...args: unknown[]) => attachMobileLiveProviderIdentities(...args),
}));

import { reviewMobileLiveProviderBulkSlugMappings } from "@/server/services/mobileLiveProviderBulkSlugReview";

describe("mobile live provider bulk slug review workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previewMobileLiveProviderCandidatesBulkBySlug.mockResolvedValue({
      eventSlug: "world-cup-live",
      mode: "bulk-manual-slug-preview",
      reviewCount: 2,
      attachReadyReviewCount: 2,
      mappings: [
        {
          marketId: "market-1",
          referenceSource: "polymarket",
          externalSlug: "slug-1",
          externalMarketId: "gamma-1",
          conditionId: "condition-1",
          outcomes: [],
        },
      ],
    });
    attachMobileLiveProviderIdentities.mockResolvedValue({
      dryRun: true,
      applied: false,
    });
  });

  test("dry-runs attach when every bulk slug review passes", async () => {
    const result = await reviewMobileLiveProviderBulkSlugMappings({
      eventSlug: "world-cup-live",
      dryRun: true,
      confirmApply: false,
      reviews: [
        { marketId: "market-1", slugs: ["slug-1"] },
        { marketId: "market-2", slugs: ["slug-2"] },
      ],
    });

    expect(previewMobileLiveProviderCandidatesBulkBySlug).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      reviews: [
        { marketId: "market-1", slugs: ["slug-1"] },
        { marketId: "market-2", slugs: ["slug-2"] },
      ],
      fetchImpl: undefined,
    });
    expect(attachMobileLiveProviderIdentities).toHaveBeenCalledWith({
      eventSlug: "world-cup-live",
      dryRun: true,
      confirmApply: false,
      mappings: [
        expect.objectContaining({
          marketId: "market-1",
          externalSlug: "slug-1",
        }),
      ],
    });
    expect(result).toEqual(expect.objectContaining({
      blocked: false,
      applied: false,
      nextRequiredAction: "confirm_apply_bulk_provider_identity_mappings",
    }));
  });

  test("blocks apply when any bulk slug review fails", async () => {
    previewMobileLiveProviderCandidatesBulkBySlug.mockResolvedValueOnce({
      eventSlug: "world-cup-live",
      mode: "bulk-manual-slug-preview",
      reviewCount: 2,
      attachReadyReviewCount: 1,
      mappings: [
        {
          marketId: "market-1",
          externalSlug: "slug-1",
          externalMarketId: "gamma-1",
          conditionId: "condition-1",
          outcomes: [],
        },
      ],
    });

    const result = await reviewMobileLiveProviderBulkSlugMappings({
      eventSlug: "world-cup-live",
      dryRun: false,
      confirmApply: true,
      reviews: [
        { marketId: "market-1", slugs: ["slug-1"] },
        { marketId: "line-market", slugs: ["wrong-family-slug"] },
      ],
    });

    expect(attachMobileLiveProviderIdentities).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      applied: false,
      blocked: true,
      blockReason: "bulk_review_has_failed_items",
      nextRequiredAction: "fix_failed_slug_reviews_before_bulk_apply",
    }));
  });

  test("applies mappings only when every review passes and confirmApply is true", async () => {
    attachMobileLiveProviderIdentities.mockResolvedValueOnce({
      dryRun: false,
      applied: true,
    });

    const result = await reviewMobileLiveProviderBulkSlugMappings({
      eventSlug: "world-cup-live",
      dryRun: false,
      confirmApply: true,
      reviews: [
        { marketId: "market-1", slugs: ["slug-1"] },
        { marketId: "market-2", slugs: ["slug-2"] },
      ],
    });

    expect(attachMobileLiveProviderIdentities).toHaveBeenCalledWith(expect.objectContaining({
      dryRun: false,
      confirmApply: true,
    }));
    expect(result).toEqual(expect.objectContaining({
      applied: true,
      blocked: false,
      nextRequiredAction: "run_provider_refresh_without_contract_fallback",
    }));
  });
});
