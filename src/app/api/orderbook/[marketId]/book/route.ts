import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

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

    const snapshot = await buildPublicOrderbookSnapshot({
      marketId,
      outcomeId,
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
