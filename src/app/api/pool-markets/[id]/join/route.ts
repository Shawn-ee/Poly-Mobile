import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getExistingUserId } from "@/lib/auth";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { upsertMarketMember } from "@/lib/marketAccess";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: Ctx) {
  const userId = await getExistingUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const market = await prisma.market.findUnique({
    where: { id },
    select: { id: true, mechanism: true, visibility: true, ownerId: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Pool market not found" }, { status: 404 });
  }

  try {
    assertMarketMechanism(market.mechanism, "POOL");
    if (market.visibility !== "PRIVATE") {
      return NextResponse.json({ error: "Join is only required for PRIVATE markets" }, { status: 400 });
    }

    await upsertMarketMember({
      marketId: market.id,
      userId,
      role: market.ownerId === userId ? "OWNER" : "MEMBER",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
