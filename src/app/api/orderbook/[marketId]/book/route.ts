import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

type Ctx = { params: Promise<{ marketId: string }> };

const asDepthLevels = (
  levels: Array<{ outcomeId: string; price: number; size: number }>,
  side: "bid" | "ask",
) =>
  levels.map((level) => ({
    outcomeId: level.outcomeId,
    side,
    price: level.price,
    shares: level.size,
    total: Number((level.price * level.size).toFixed(6)),
  }));

export async function GET(request: NextRequest, context: Ctx) {
  const { marketId } = await context.params;
  const userId = await getUserId();
  const outcomeId = request.nextUrl.searchParams.get("outcomeId");
  const maxLevelsParam = Number(request.nextUrl.searchParams.get("maxLevels"));
  const maxLevels = Number.isFinite(maxLevelsParam) && maxLevelsParam > 0
    ? Math.min(Math.floor(maxLevelsParam), 200)
    : undefined;

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
      maxLevels,
    });
    const levels = [
      ...asDepthLevels(snapshot.bids, "bid"),
      ...asDepthLevels(snapshot.asks, "ask"),
    ];

    return NextResponse.json({
      marketId,
      outcomeId,
      generatedAt: new Date().toISOString(),
      emptyState: levels.length === 0 ? "no-depth" : null,
      levels,
      ...snapshot,
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
