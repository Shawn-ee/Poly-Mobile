import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { assertMarketRoutingInvariant } from "@/lib/marketRouting";

const stringField = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const numberField = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const decimalField = (value: unknown) => {
  const parsed = numberField(value);
  return parsed === null ? null : new Prisma.Decimal(parsed);
};

const intField = (value: unknown) => {
  const parsed = numberField(value);
  return parsed === null ? null : Math.trunc(parsed);
};

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

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
      eventId: market.eventId,
      marketGroupKey: market.marketGroupKey,
      marketGroupTitle: market.marketGroupTitle,
      marketType: market.marketType,
      displayOrder: market.displayOrder,
      line: market.line?.toString() ?? null,
      unit: market.unit,
      period: market.period,
      participantType: market.participantType,
      participantName: market.participantName,
      participantId: market.participantId,
      propCategory: market.propCategory,
      rulesText: market.rulesText,
      status: market.status,
      outcomes: market.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
        label: outcome.label,
        code: outcome.code,
        side: outcome.side,
        status: outcome.status,
        resolvedResult: outcome.resolvedResult,
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
  const bodyRecord =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const title = typeof bodyRecord.title === "string" ? bodyRecord.title.trim() : null;
  const description =
    typeof bodyRecord.description === "string" ? bodyRecord.description.trim() : null;
  const resolveTimeRaw =
    typeof bodyRecord.resolveTime === "string" ? bodyRecord.resolveTime : null;
  const resolveTime = resolveTimeRaw ? new Date(resolveTimeRaw) : null;
  const categoryId =
    typeof bodyRecord.categoryId === "string" ? bodyRecord.categoryId.trim() : null;
  const eventId = stringField(bodyRecord.eventId);
  const marketGroupKey = stringField(bodyRecord.marketGroupKey);
  const marketGroupTitle = stringField(bodyRecord.marketGroupTitle);
  const marketType = stringField(bodyRecord.marketType);
  const displayOrder = intField(bodyRecord.displayOrder);
  const line = decimalField(bodyRecord.line);
  const unit = stringField(bodyRecord.unit);
  const period = stringField(bodyRecord.period);
  const participantType = stringField(bodyRecord.participantType);
  const participantName = stringField(bodyRecord.participantName);
  const participantId = stringField(bodyRecord.participantId);
  const propCategory = stringField(bodyRecord.propCategory);
  const rulesText = stringField(bodyRecord.rulesText);
  const visibilityInput =
    bodyRecord.visibility === "PUBLIC" || bodyRecord.visibility === "PRIVATE"
      ? bodyRecord.visibility
      : null;
  const mechanismInput =
    bodyRecord.mechanism === "ORDERBOOK" ||
    bodyRecord.mechanism === "POOL"
      ? bodyRecord.mechanism
      : null;

  const market = await prisma.market.findUnique({ where: { id } });
  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  if (eventId) {
    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!eventRecord) {
      return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    }
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
      ...(hasOwn(bodyRecord, "categoryId") ? { categoryId } : {}),
      ...(hasOwn(bodyRecord, "eventId") ? { eventId } : {}),
      ...(hasOwn(bodyRecord, "marketGroupKey") ? { marketGroupKey } : {}),
      ...(hasOwn(bodyRecord, "marketGroupTitle") ? { marketGroupTitle } : {}),
      ...(marketType ? { marketType } : {}),
      ...(displayOrder !== null ? { displayOrder } : {}),
      ...(hasOwn(bodyRecord, "line") ? { line } : {}),
      ...(hasOwn(bodyRecord, "unit") ? { unit } : {}),
      ...(hasOwn(bodyRecord, "period") ? { period } : {}),
      ...(hasOwn(bodyRecord, "participantType") ? { participantType } : {}),
      ...(hasOwn(bodyRecord, "participantName") ? { participantName } : {}),
      ...(hasOwn(bodyRecord, "participantId") ? { participantId } : {}),
      ...(hasOwn(bodyRecord, "propCategory") ? { propCategory } : {}),
      ...(hasOwn(bodyRecord, "rulesText") ? { rulesText } : {}),
      ...(visibilityInput ? { visibility: visibilityInput } : {}),
      ...(mechanismInput ? { mechanism: mechanismInput } : {}),
      ...(hasOwn(bodyRecord, "resolveTime")
        ? { resolveTime: resolveTime && !Number.isNaN(resolveTime.getTime()) ? resolveTime : null }
        : {}),
    },
  });

  return NextResponse.json({ market: updated });
}
