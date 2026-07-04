import { NextRequest, NextResponse } from "next/server";
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
  });

  return NextResponse.json({
    ok: true,
    expired,
    refresh,
  });
}
