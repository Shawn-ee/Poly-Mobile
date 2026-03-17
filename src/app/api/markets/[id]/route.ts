import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { getOutcomeMidPrices } from "@/lib/orderbookPricing";
import { toGuardResponse } from "@/lib/marketGuards";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  const { id } = await context.params;

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  try {
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  let pricesByOutcome: Record<string, number> = {};
  if (market.mechanism === "POOL") {
    pricesByOutcome = Object.fromEntries(market.outcomes.map((o) => [o.id, 0.5]));
  } else {
    const mids = await getOutcomeMidPrices(
      market.id,
      market.outcomes.map((o) => o.id)
    );
    pricesByOutcome = Object.fromEntries(
      market.outcomes.map((o) => [o.id, mids.get(o.id) ?? 0.5])
    );
  }

  return NextResponse.json({
    market: {
      id: market.id,
      title: market.title,
      description: market.description,
      status: market.status,
      kind: market.kind,
      visibility: market.visibility,
      mechanism: market.mechanism,
      ownerId: market.ownerId,
      isCanceled: market.isCanceled,
      betCloseTime: market.betCloseTime,
      isListed: market.isListed,
      resolveTime: market.resolveTime,
      createdAt: market.createdAt,
      outcomes: market.outcomes,
      type: market.type,
      category: market.category
        ? { id: market.category.id, name: market.category.name, slug: market.category.slug }
        : null,
      tags: market.tags.map((marketTag) => ({
        id: marketTag.tag.id,
        name: marketTag.tag.name,
        slug: marketTag.tag.slug,
        group: marketTag.tag.group,
      })),
      prices: {
        YES: pricesByOutcome.YES ?? 0.5,
        NO: pricesByOutcome.NO ?? 0.5,
      },
      pricesByOutcome,
    },
  });
}
