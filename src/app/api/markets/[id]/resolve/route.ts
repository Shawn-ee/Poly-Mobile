import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { resolveOrderbookMarket } from "@/server/services/settlement";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const body = await request.json().catch(() => null);
  const winningOutcomeId =
    typeof body?.winningOutcomeId === "string" ? body.winningOutcomeId : "";
  const { id } = await context.params;
  const marketId = id;

  if (!marketId || !winningOutcomeId) {
    return NextResponse.json(
      { error: "Missing marketId or winningOutcomeId." },
      { status: 400 }
    );
  }

  try {
    const adminUser = await assertAdmin();
    enforceSensitiveRateLimit(adminUser.id, "admin_market_resolve");
    const result = await resolveOrderbookMarket({
      marketId,
      winningOutcomeId,
      actorUserId: adminUser.id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
