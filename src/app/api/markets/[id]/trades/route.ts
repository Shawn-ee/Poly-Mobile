import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getUserId();
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
  const trades = await prisma.trade.findMany({
    where: { marketId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { outcome: true, user: true },
  });

  return NextResponse.json({
    trades: trades.map((trade) => ({
      id: trade.id,
      side: trade.side,
      shares: Number(trade.shares),
      cost: Number(trade.cost),
      createdAt: trade.createdAt,
      outcome: trade.outcome.name,
      user: trade.user.username,
    })),
  });
}
