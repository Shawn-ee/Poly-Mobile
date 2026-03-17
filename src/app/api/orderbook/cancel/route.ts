import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { toGuardResponse } from "@/lib/marketGuards";
import { serializeDecimals } from "@/lib/serialize";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";
import { enforceOrderRateLimit } from "@/server/services/orderRateLimiter";
import { cancelOrderAndUnlock } from "@/server/services/matching";

// LEGACY: retained for current UI compatibility. External agents should use DELETE /api/orders/:id.
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      market: {
        select: { id: true, mechanism: true, visibility: true, status: true, isCanceled: true },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.market.mechanism !== "ORDERBOOK") {
    return NextResponse.json({ error: "Invalid market mechanism" }, { status: 400 });
  }
  if (order.market.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Cancel is restricted to PUBLIC markets" }, { status: 403 });
  }
  if (order.market.isCanceled || order.market.status !== "LIVE") {
    return NextResponse.json({ error: "Market is not open for trading" }, { status: 400 });
  }

  try {
    enforceOrderRateLimit(userId, "cancel");
    const result = await cancelOrderAndUnlock({ orderId, userId });
    await Promise.allSettled([
      emitMarketUpdate({ marketId: order.marketId, outcomeId: order.outcomeId }),
      emitUserUpdate({ userId, marketId: order.marketId }),
    ]);
    return NextResponse.json(serializeDecimals({ ok: true, ...result }));
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
