import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { id } = await context.params;
  const market = await prisma.market.update({
    where: { id },
    data: { status: "PAUSED", closeTime: new Date() },
  });
  return NextResponse.json({ marketId: market.id, status: market.status });
}
