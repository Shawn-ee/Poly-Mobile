import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  assertAdmin,
  assertMarketMechanism,
  assertMarketStatusTransition,
  toGuardResponse,
} from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { cancelOpenOrderbookOrdersTx } from "@/server/services/settlement";

export async function POST(request: Request) {
  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const body = await request.json().catch(() => null);
  const marketId = typeof body?.marketId === "string" ? body.marketId : "";
  const status = typeof body?.status === "string" ? body.status : "";

  const allowedStatuses = [
    "UPCOMING",
    "LIVE",
    "CLOSED",
    "RESOLVED",
    "ACTIVE",
    "PAUSED",
    "CANCELED",
  ];
  if (!marketId || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const existing = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, mechanism: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  try {
    assertMarketMechanism(existing.mechanism, "ORDERBOOK");
    assertMarketStatusTransition({
      mechanism: existing.mechanism,
      current: existing.status,
      next: status,
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const market =
    status === "CLOSED"
      ? await prisma.$transaction(async (tx) => {
          await cancelOpenOrderbookOrdersTx(tx, marketId);
          return tx.market.update({
            where: { id: marketId },
            data: { status: status as never },
          });
        })
      : await prisma.market.update({
          where: { id: marketId },
          data: { status: status as never },
        });

  return NextResponse.json({ status: market.status });
}
