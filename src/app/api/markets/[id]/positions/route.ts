import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const market = await prisma.market.findUnique({
    where: { id },
    select: { id: true, mechanism: true, visibility: true, ownerId: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }
  try {
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
  const outcomeId = request.nextUrl.searchParams.get("outcomeId");

  const positions = await prisma.position.findMany({
    where: { userId, marketId: id, ...(outcomeId ? { outcomeId } : {}) },
    include: { outcome: true },
  });

  return NextResponse.json({
    positions: positions.map((position) => ({
      id: position.id,
      outcomeId: position.outcomeId,
      outcomeName: position.outcome.name,
      shares: Number(position.shares),
      reservedShares: Number(position.reservedShares ?? 0),
      avgCost: Number(position.avgCost),
      realizedPnl: Number(position.realizedPnl ?? 0),
    })),
  });
}
