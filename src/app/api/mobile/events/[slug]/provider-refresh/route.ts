import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import {
  expireMobileLiveProviderQuoteSnapshots,
  refreshMobileLiveProviderQuoteSnapshots,
} from "@/server/services/mobileLiveProviderRefresh";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        expireFirst?: boolean;
        staleSeconds?: number;
        allowContractProofFallback?: boolean;
      }
    | null;

  const expired = body?.expireFirst
    ? await expireMobileLiveProviderQuoteSnapshots({
        eventSlug: slug,
        staleSeconds: typeof body.staleSeconds === "number" ? body.staleSeconds : undefined,
      })
    : null;
  const refresh = await refreshMobileLiveProviderQuoteSnapshots({
    eventSlug: slug,
    allowContractProofFallback: body?.allowContractProofFallback === true,
    lineProviderFetchImpl: undefined,
  });
  const cacheInvalidation = invalidateMobileLiveProviderRefreshCache(slug, refresh.mappingReadiness.markets.map((market) => market.marketId));

  return NextResponse.json({
    ok: true,
    expired,
    refresh,
    cacheInvalidation,
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function invalidateMobileLiveProviderRefreshCache(eventSlug: string, marketIds: string[]) {
  const encodedSlug = encodeURIComponent(eventSlug);
  const paths = [
    `/api/mobile/events/${encodedSlug}/live-detail`,
    `/api/events/${encodedSlug}`,
    ...marketIds.map((marketId) => `/api/orderbook/${encodeURIComponent(marketId)}/book`),
  ];
  const invalidated: string[] = [];
  const errors: Array<{ path: string; error: string }> = [];

  for (const path of paths) {
    try {
      revalidatePath(path);
      invalidated.push(path);
    } catch (error) {
      errors.push({
        path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    source: "next-revalidate-path",
    generatedAt: new Date().toISOString(),
    eventSlug,
    marketCount: marketIds.length,
    invalidated,
    errors,
  };
}
