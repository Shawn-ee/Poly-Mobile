import {
  previewMobileLiveProviderCandidatesBulkBySlug,
  type ProviderCandidateBulkSlugPreviewOptions,
} from "@/server/services/mobileLiveProviderCandidates";
import { attachMobileLiveProviderIdentities } from "@/server/services/mobileLiveProviderIdentityAttach";

export type ReviewMobileLiveProviderBulkSlugMappingsOptions = ProviderCandidateBulkSlugPreviewOptions & {
  dryRun: boolean;
  confirmApply?: boolean;
};

export async function reviewMobileLiveProviderBulkSlugMappings(
  options: ReviewMobileLiveProviderBulkSlugMappingsOptions,
) {
  const preview = await previewMobileLiveProviderCandidatesBulkBySlug({
    eventSlug: options.eventSlug,
    reviews: options.reviews,
    fetchImpl: options.fetchImpl,
  });
  const allReviewsAttachReady = preview.reviewCount > 0 && preview.attachReadyReviewCount === preview.reviewCount;

  if (!allReviewsAttachReady) {
    return {
      eventSlug: options.eventSlug,
      mode: "bulk-manual-slug-review-apply",
      dryRun: options.dryRun,
      applied: false,
      blocked: true,
      blockReason: "bulk_review_has_failed_items",
      preview,
      attach: null,
      nextRequiredAction:
        preview.attachReadyReviewCount > 0
          ? "fix_failed_slug_reviews_before_bulk_apply"
          : "supply_better_polymarket_slugs_for_bulk_review",
    };
  }

  const attach = await attachMobileLiveProviderIdentities({
    eventSlug: options.eventSlug,
    dryRun: options.dryRun,
    confirmApply: options.confirmApply === true,
    mappings: preview.mappings,
  });

  return {
    eventSlug: options.eventSlug,
    mode: "bulk-manual-slug-review-apply",
    dryRun: options.dryRun,
    applied: attach.applied,
    blocked: false,
    blockReason: null,
    preview,
    attach,
    nextRequiredAction: attach.applied
      ? "run_provider_refresh_without_contract_fallback"
      : "confirm_apply_bulk_provider_identity_mappings",
  };
}
