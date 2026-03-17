import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";

type Ctx = { params: Promise<{ marketId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { marketId } = await context.params;
  const userId = await getUserId();
  const outcomeId = request.nextUrl.searchParams.get("outcomeId");

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

    const openStatuses: OrderStatus[] = ["OPEN", "PARTIAL"];
    const where = {
      marketId,
      status: { in: openStatuses },
      ...(outcomeId ? { outcomeId } : {}),
    };

    const [bids, asks] = await Promise.all([
      prisma.order.groupBy({
        by: ["outcomeId", "price"],
        where: { ...where, side: "BUY" },
        _sum: { remaining: true },
        orderBy: [{ price: "desc" }],
      }),
      prisma.order.groupBy({
        by: ["outcomeId", "price"],
        where: { ...where, side: "SELL" },
        _sum: { remaining: true },
        orderBy: [{ price: "asc" }],
      }),
    ]);

    return NextResponse.json({
      bids: bids.map((row) => ({
        outcomeId: row.outcomeId,
        price: Number(row.price),
        size: Number(row._sum?.remaining ?? 0),
      })),
      asks: asks.map((row) => ({
        outcomeId: row.outcomeId,
        price: Number(row.price),
        size: Number(row._sum?.remaining ?? 0),
      })),
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
