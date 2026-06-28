import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { applySportsMarketResolution } from "@/server/services/sportsMarketResolution";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  if (!["resolve", "void", "push"].includes(action)) {
    return NextResponse.json({ error: "action must be resolve, void, or push." }, { status: 400 });
  }

  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_resolve");
    const { id } = await context.params;
    const result = await applySportsMarketResolution({
      marketId: id,
      actorUserId: admin.id,
      action: action as "resolve" | "void" | "push",
      winningOutcomeId: typeof body?.winningOutcomeId === "string" ? body.winningOutcomeId : null,
      pushOutcomeId: typeof body?.pushOutcomeId === "string" ? body.pushOutcomeId : null,
      resolutionNote: typeof body?.resolutionNote === "string" ? body.resolutionNote : null,
      resolutionSourceUrl: typeof body?.resolutionSourceUrl === "string" ? body.resolutionSourceUrl : null,
      voidReason: typeof body?.voidReason === "string" ? body.voidReason : null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
