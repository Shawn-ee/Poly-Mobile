import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { getPublicTradeTape } from "@/server/services/publicTradeTape";

type Ctx = { params: Promise<{ marketId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const { marketId } = await context.params;
  const userId = await getUserId();

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, mechanism: true, visibility: true, ownerId: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  try {
    assertMarketMechanism(market.mechanism, "ORDERBOOK");
    await assertMarketVisibleToUser({ market, userId });

    const items = await getPublicTradeTape({
      marketId,
      limit: 100,
    });

    return NextResponse.json({
      trades: items.map((item) => ({
        id: item.id,
        executionId: item.executionId,
        marketId: item.marketId,
        side: item.side,
        price: item.price,
        quantity: item.quantity,
        shares: item.shares,
        cost: item.cost,
        outcomeId: item.outcomeId,
        outcomeName: item.outcomeName,
        outcome: item.outcome,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
