import { NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { settleComboOrder } from "@/server/services/comboSettlement";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_resolve");
    const { id } = await context.params;
    const result = await settleComboOrder({ comboOrderId: id, actorUserId: admin.id });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
