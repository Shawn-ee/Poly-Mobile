import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toGuardResponse } from "@/lib/marketGuards";
import { serializeDecimals } from "@/lib/serialize";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";
import { enforceOrderRateLimit } from "@/server/services/orderRateLimiter";
import { placeOrderAndMatch } from "@/server/services/matching";

// LEGACY: retained for current UI compatibility. External agents should use POST /api/orders.
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const marketId = typeof body?.marketId === "string" ? body.marketId : "";
  const outcomeId = typeof body?.outcomeId === "string" ? body.outcomeId : "";
  const side = body?.side === "BUY" || body?.side === "SELL" ? body.side : null;
  const price = body?.price;
  const size = body?.size ?? body?.amount;

  if (!marketId || !outcomeId || !side || price === undefined || size === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, visibility: true, mechanism: true, status: true, isCanceled: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.mechanism !== "ORDERBOOK") {
    return NextResponse.json({ error: "Invalid market mechanism" }, { status: 400 });
  }
  if (market.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Order placement is restricted to PUBLIC markets" }, { status: 403 });
  }
  if (market.isCanceled || market.status !== "LIVE") {
    return NextResponse.json({ error: "Market is not open for trading" }, { status: 400 });
  }

  try {
    enforceOrderRateLimit(userId, "place");
    const result = await placeOrderAndMatch({
      marketId,
      userId,
      outcomeId,
      side,
      price,
      size,
    });
    const impacted = new Set<string>([userId]);
    const fills = await prisma.fill.findMany({
      where: { takerOrderId: result.order.id },
      select: { takerUserId: true, makerUserId: true },
    });
    for (const item of fills) {
      impacted.add(item.takerUserId);
      impacted.add(item.makerUserId);
    }
    await Promise.allSettled([
      emitMarketUpdate({ marketId, outcomeId }),
      ...Array.from(impacted.values()).map((id) => emitUserUpdate({ userId: id, marketId })),
    ]);
    return NextResponse.json(serializeDecimals({ ok: true, ...result }));
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
