import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";

type Ctx = { params: Promise<{ marketId: string }> };

// LEGACY: retained for current UI compatibility. External agents should use GET /api/orders.
export async function GET(_request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { marketId } = await context.params;
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

    const items = await prisma.order.findMany({
      where: {
        marketId,
        userId,
        status: { in: ["OPEN", "PARTIAL"] },
      },
      orderBy: [{ createdAt: "desc" }],
      include: { outcome: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      orders: items.map((item) => ({
        id: item.id,
        outcomeId: item.outcomeId,
        outcomeName: item.outcome.name,
        side: item.side,
        price: Number(item.price),
        amount: Number(item.amount),
        remaining: Number(item.remaining),
        status: item.status,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
