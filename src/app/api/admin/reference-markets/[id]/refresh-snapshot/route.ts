import { NextRequest, NextResponse } from "next/server";
import { toGuardResponse } from "@/lib/marketGuards";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<unknown> },
) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
  const { id } = (await context.params) as { id: string };
  const report = await refreshPolymarketReferenceSnapshots({ marketId: id });
  return NextResponse.json({
    ok: true,
    ...report,
  });
}
