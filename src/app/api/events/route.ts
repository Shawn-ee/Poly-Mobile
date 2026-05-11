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
      _count: {
        select: { markets: true },
      },
      markets: {
        select: { status: true },
      },
    },
  });

  return NextResponse.json({
    events: events.map((event) => {
      const activeMarketCount = event.markets.filter((market) => market.status === "LIVE").length;
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
        marketCount: event._count.markets,
        activeMarketCount,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };
    }),
  });
}
