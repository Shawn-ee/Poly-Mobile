import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";
import { getPublicTradeTape } from "@/server/services/publicTradeTape";

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
  const trades = await getPublicTradeTape({
    marketId: id,
    limit: 20,
  });

  return NextResponse.json({
    trades: trades.map((trade) => ({
      id: trade.id,
      executionId: trade.executionId,
      marketId: trade.marketId,
      outcomeId: trade.outcomeId,
      outcomeName: trade.outcomeName,
      outcome: trade.outcome,
      side: trade.side,
      price: trade.price,
      quantity: trade.quantity,
      shares: trade.shares,
      cost: trade.cost,
      createdAt: trade.createdAt,
    })),
  });
}
