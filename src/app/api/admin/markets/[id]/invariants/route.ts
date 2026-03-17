import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { toGuardResponse } from "@/lib/marketGuards";
import { getPublicBinaryInvariantState } from "@/server/services/orderbookCollateral";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const marketId = id;
  if (!marketId) {
    return NextResponse.json({ error: "Missing marketId" }, { status: 400 });
  }

  try {
    const state = await getPublicBinaryInvariantState(marketId);
    return NextResponse.json(state);
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
