import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { assertMarketRoutingInvariant } from "@/lib/marketRouting";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await context.params;
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      outcomes: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  const tradeCounts = await prisma.trade.groupBy({
    by: ["outcomeId"],
    where: { marketId: id },
    _count: { _all: true },
  });
  const positionCounts = await prisma.position.groupBy({
    by: ["outcomeId"],
    where: { marketId: id, shares: { not: 0 } },
    _count: { _all: true },
  });
  const tradeMap = new Map(tradeCounts.map((t) => [t.outcomeId, t._count._all]));
  const positionMap = new Map(
    positionCounts.map((p) => [p.outcomeId, p._count._all])
  );

  return NextResponse.json({
    market: {
      id: market.id,
      title: market.title,
      description: market.description,
      resolveTime: market.resolveTime,
      categoryId: market.categoryId,
      outcomes: market.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
        slug: outcome.slug,
        isActive: outcome.isActive,
        displayOrder: outcome.displayOrder,
        locked:
          (tradeMap.get(outcome.id) ?? 0) > 0 ||
          (positionMap.get(outcome.id) ?? 0) > 0,
      })),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : null;
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const resolveTimeRaw =
    typeof body?.resolveTime === "string" ? body.resolveTime : null;
  const resolveTime = resolveTimeRaw ? new Date(resolveTimeRaw) : null;
  const categoryId =
    typeof body?.categoryId === "string" ? body.categoryId.trim() : null;
  const visibilityInput =
    body?.visibility === "PUBLIC" || body?.visibility === "PRIVATE"
      ? body.visibility
      : null;
  const mechanismInput =
    body?.mechanism === "ORDERBOOK" ||
    body?.mechanism === "POOL"
      ? body.mechanism
      : null;

  const market = await prisma.market.findUnique({ where: { id } });
  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  const nextVisibility = visibilityInput ?? market.visibility;
  const nextMechanism = mechanismInput ?? market.mechanism;
  if (mechanismInput && mechanismInput !== market.mechanism) {
    const [hasOrders, hasTrades, hasPoolBets] = await Promise.all([
      prisma.order.count({ where: { marketId: id } }),
      prisma.trade.count({ where: { marketId: id } }),
      prisma.poolBet.count({ where: { marketId: id } }),
    ]);
    if (hasOrders > 0 || hasTrades > 0 || hasPoolBets > 0) {
      return NextResponse.json(
        { error: "Market mechanism is immutable after activity starts." },
        { status: 400 }
      );
    }
  }
  try {
    assertMarketRoutingInvariant({
      visibility: nextVisibility,
      mechanism: nextMechanism,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid market routing." },
      { status: 400 }
    );
  }

  const updated = await prisma.market.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(categoryId ? { categoryId } : { categoryId: null }),
      ...(visibilityInput ? { visibility: visibilityInput } : {}),
      ...(mechanismInput ? { mechanism: mechanismInput } : {}),
      resolveTime:
        resolveTime && !Number.isNaN(resolveTime.getTime()) ? resolveTime : null,
    },
  });

  return NextResponse.json({ market: updated });
}
