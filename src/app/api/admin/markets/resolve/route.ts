import { NextResponse } from "next/server";
import {
  assertAdmin,
  toGuardResponse,
} from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { resolveOrderbookMarket } from "@/server/services/settlement";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const marketId = typeof body?.marketId === "string" ? body.marketId : "";
  const outcomeId =
    typeof body?.winningOutcomeId === "string"
      ? body.winningOutcomeId
      : typeof body?.outcomeId === "string"
        ? body.outcomeId
        : "";

  if (!marketId || !outcomeId) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const adminUser = await assertAdmin();
    enforceSensitiveRateLimit(adminUser.id, "admin_market_resolve");
    const result = await resolveOrderbookMarket({
      marketId,
      winningOutcomeId: outcomeId,
      actorUserId: adminUser.id,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
