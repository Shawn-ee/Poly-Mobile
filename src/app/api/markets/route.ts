import { NextRequest, NextResponse } from "next/server";
import { MarketStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOutcomeMidPrices } from "@/lib/orderbookPricing";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category");
  const tagsParam = url.searchParams.get("tags");
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");
  const view = url.searchParams.get("view") ?? "";

  const tagSlugs = tagsParam
    ? tagsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const statusFilter: Prisma.MarketWhereInput = (() => {
    if (status && status !== "ALL") return { status: status as MarketStatus };
    if (view === "resolved") return { status: MarketStatus.RESOLVED };
    if (view === "all") return {};
    return { status: "LIVE" as never };
  })();

  const orderBy: Prisma.MarketOrderByWithRelationInput[] =
    view === "resolved"
      ? [{ resolveTime: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const where: Prisma.MarketWhereInput = {
    visibility: "PUBLIC",
    isListed: true,
    ...statusFilter,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlugs.length
      ? {
          tags: {
            some: {
              tag: { slug: { in: tagSlugs } },
            },
          },
        }
      : {}),
  };

  const markets = await prisma.market.findMany({
    where,
    orderBy,
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  const payload = await Promise.all(
    markets.map(async (market) => {
      const pricesByOutcome: Record<string, number> =
        market.mechanism === "POOL"
          ? Object.fromEntries(market.outcomes.map((o) => [o.id, 0.5]))
          : Object.fromEntries(
              market.outcomes.map((o) => [o.id, 0.5])
            );

      if (market.mechanism === "ORDERBOOK") {
        const mids = await getOutcomeMidPrices(
          market.id,
          market.outcomes.map((o) => o.id)
        );
        for (const outcome of market.outcomes) {
          pricesByOutcome[outcome.id] = mids.get(outcome.id) ?? 0.5;
        }
      }

      return {
        id: market.id,
        title: market.title,
        description: market.description,
        status: market.status,
        resolveTime: market.resolveTime,
        createdAt: market.createdAt,
        outcomes: market.outcomes,
        type: market.type,
        kind: market.kind,
        visibility: market.visibility,
        mechanism: market.mechanism,
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
      };
    })
  );

  return NextResponse.json({ markets: payload });
}
