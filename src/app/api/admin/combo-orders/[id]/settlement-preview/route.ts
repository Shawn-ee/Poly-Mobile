import { NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { previewComboSettlement } from "@/server/services/comboSettlement";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_resolve");
    const { id } = await context.params;
    const preview = await previewComboSettlement({ comboOrderId: id });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
