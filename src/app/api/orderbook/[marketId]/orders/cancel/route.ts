import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";
import { cancelOrder } from "@/server/services/orderbook";
import { enforceOrderRateLimit } from "@/server/services/orderRateLimiter";

type Ctx = { params: Promise<{ marketId: string }> };

// LEGACY: retained for current UI compatibility. External agents should use DELETE /api/orders/:id.
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
      return NextResponse.json({ error: "Cancel is restricted to PUBLIC markets" }, { status: 403 });
    }
    if (market.isCanceled || market.status !== "LIVE") {
      return NextResponse.json({ error: "Market is not open for trading" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    if (!orderId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    enforceOrderRateLimit(userId, "cancel");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { marketId: true, outcomeId: true },
    });

    const result = await cancelOrder({ orderId, userId });
    await Promise.allSettled([
      emitMarketUpdate({ marketId, outcomeId: order?.outcomeId ?? null }),
      emitUserUpdate({ userId, marketId }),
    ]);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
