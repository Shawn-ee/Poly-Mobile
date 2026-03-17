import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";

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

    const items = await prisma.trade.findMany({
      where: { marketId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { username: true } },
        outcome: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      trades: items.map((item) => ({
        id: item.id,
        side: item.side,
        shares: Number(item.shares),
        cost: Number(item.cost),
        user: item.user.username,
        outcomeId: item.outcomeId,
        outcome: item.outcome.name,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
