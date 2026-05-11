import { NextRequest, NextResponse } from "next/server";
import { CanonicalApiError } from "@/lib/canonicalApi";
import { requireCanonicalActor } from "@/lib/canonicalAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { serializeDecimals } from "@/lib/serialize";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";

type Ctx = { params: Promise<{ marketId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  let userId: string;
  try {
    const actor = await requireCanonicalActor(request, ["orders:write"]);
    userId = actor.userId;
  } catch (error) {
    if (error instanceof CanonicalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { marketId } = await context.params;
  const body = await request.json().catch(() => null);
  const quantity = body?.quantity ?? body?.size ?? body?.amount;
  if (!marketId || quantity === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    enforceSensitiveRateLimit(userId, "mint");
    const result = await mintCompleteSetForPublicOrderbook({
      marketId,
      userId,
      quantity,
    });

    await Promise.allSettled([
      emitMarketUpdate({ marketId, outcomeId: null }),
      emitUserUpdate({ userId, marketId }),
    ]);

    return NextResponse.json(serializeDecimals({ ok: true, ...result }));
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
