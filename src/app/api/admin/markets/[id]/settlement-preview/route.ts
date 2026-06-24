import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { previewOrderbookSettlement } from "@/server/services/settlement";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const body = await request.json().catch(() => null);
  const winningOutcomeId =
    typeof body?.winningOutcomeId === "string"
      ? body.winningOutcomeId
      : typeof body?.outcomeId === "string"
        ? body.outcomeId
        : "";
  if (!winningOutcomeId) {
    return NextResponse.json({ error: "winningOutcomeId is required." }, { status: 400 });
  }

  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_resolve");
    const { id } = await context.params;
    const preview = await previewOrderbookSettlement({
      marketId: id,
      winningOutcomeId,
    });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
