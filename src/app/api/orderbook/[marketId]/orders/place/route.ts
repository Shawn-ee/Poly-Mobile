import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";
import { placeOrder } from "@/server/services/orderbook";
import { enforceOrderRateLimit } from "@/server/services/orderRateLimiter";

type Ctx = { params: Promise<{ marketId: string }> };

// LEGACY: retained for current UI compatibility. External agents should use POST /api/orders.
export async function POST(request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { marketId } = await context.params;
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, mechanism: true, visibility: true, status: true, isCanceled: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  try {
    assertMarketMechanism(market.mechanism, "ORDERBOOK");
    if (market.visibility !== "PUBLIC") {
      return NextResponse.json({ error: "Order placement is restricted to PUBLIC markets" }, { status: 403 });
    }
    if (market.isCanceled || market.status !== "LIVE") {
      return NextResponse.json({ error: "Market is not open for trading" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const outcomeId = typeof body?.outcomeId === "string" ? body.outcomeId : "";
    const side = body?.side === "SELL" ? "SELL" : body?.side === "BUY" ? "BUY" : null;
    const price = body?.price;
    const amount = body?.amount;

    if (!outcomeId || !side || price === undefined || amount === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    enforceOrderRateLimit(userId, "place");

    const result = await placeOrder({
      marketId,
      userId,
      outcomeId,
      side,
      price,
      amount,
    });
    const impacted = new Set<string>([userId]);
    const fills = await prisma.fill.findMany({
      where: { takerOrderId: result.orderId },
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

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
