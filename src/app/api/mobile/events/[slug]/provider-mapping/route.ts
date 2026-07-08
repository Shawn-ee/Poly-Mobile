import { NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { getMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";
import { attachMobileLiveProviderIdentities } from "@/server/services/mobileLiveProviderIdentityAttach";
import { reviewMobileLiveProviderBulkSlugMappings } from "@/server/services/mobileLiveProviderBulkSlugReview";
import {
  reviewMobileLiveLineProviderIdentities,
  type LineProviderMarketReviewInput,
} from "@/server/services/mobileLiveLineProviderIdentityReview";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { slug } = await context.params;
  const readiness = await getMobileLiveProviderMappingReadiness(slug);

  return NextResponse.json({
    ok: true,
    readiness,
  });
}

export async function POST(request: Request, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        dryRun?: boolean;
        confirmApply?: boolean;
        mappings?: Parameters<typeof attachMobileLiveProviderIdentities>[0]["mappings"];
        reviews?: Parameters<typeof reviewMobileLiveProviderBulkSlugMappings>[0]["reviews"];
        lineIdentityReviews?: LineProviderMarketReviewInput[];
      }
    | null;

  if (Array.isArray(body?.lineIdentityReviews)) {
    const result = await reviewMobileLiveLineProviderIdentities({
      eventSlug: slug,
      dryRun: body?.dryRun !== false,
      confirmApply: body?.confirmApply === true,
      reviews: body.lineIdentityReviews,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  }

  if (Array.isArray(body?.reviews)) {
    const result = await reviewMobileLiveProviderBulkSlugMappings({
      eventSlug: slug,
      dryRun: body?.dryRun !== false,
      confirmApply: body?.confirmApply === true,
      reviews: body.reviews,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  }

  const result = await attachMobileLiveProviderIdentities({
    eventSlug: slug,
    dryRun: body?.dryRun !== false,
    confirmApply: body?.confirmApply === true,
    mappings: Array.isArray(body?.mappings) ? body.mappings : [],
  });

  return NextResponse.json({
    ok: true,
    result,
  });
}
