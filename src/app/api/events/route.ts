import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const source = url.searchParams.get("source")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";

  const where: Prisma.EventWhereInput = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
  };

  const events = await prisma.event.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      markets: {
        where: { visibility: "PUBLIC", isListed: true },
        select: { status: true, title: true, referenceMetadata: true },
      },
    },
  });

  return NextResponse.json({
    events: events
      .map((event) => {
        const metadata =
          event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
            ? (event.metadata as Record<string, unknown>)
            : {};
        const referenceGroup =
          metadata.referenceGroup && typeof metadata.referenceGroup === "object" && !Array.isArray(metadata.referenceGroup)
            ? (metadata.referenceGroup as Record<string, unknown>)
            : null;
        const activeMarketCount = event.markets.filter((market) => market.status === "LIVE").length;
        const topOutcomes = event.markets
          .map((market) => {
            const marketMetadata =
              market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
                ? (market.referenceMetadata as Record<string, unknown>)
                : {};
            const group =
              marketMetadata.group && typeof marketMetadata.group === "object" && !Array.isArray(marketMetadata.group)
                ? (marketMetadata.group as Record<string, unknown>)
                : null;
            return typeof group?.outcomeLabel === "string" ? group.outcomeLabel : null;
          })
          .filter((value): value is string => Boolean(value))
          .slice(0, 4);
        return {
          id: event.id,
          slug: event.slug,
          title: event.title,
          description: event.description,
          category: event.category,
          status: event.status,
          source: event.source,
          externalEventId: event.externalEventId,
          externalSlug: event.externalSlug,
          image: event.image,
          icon: event.icon,
          marketCount: event.markets.length,
          activeMarketCount,
          hasGroupedMarkets: Boolean(referenceGroup),
          groupedSummary:
            referenceGroup && typeof referenceGroup.slug === "string"
              ? {
                  title: typeof referenceGroup.title === "string" ? referenceGroup.title : "Group",
                  slug: referenceGroup.slug,
                }
              : null,
          topOutcomes,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        };
      })
      .filter((event) => event.marketCount > 0),
  });
}
