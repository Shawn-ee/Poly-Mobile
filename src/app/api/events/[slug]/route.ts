import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { markets: true },
      },
      markets: {
        select: { status: true },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const activeMarketCount = event.markets.filter((market) => market.status === "LIVE").length;
  const closedMarketCount = event.markets.filter(
    (market) => market.status === "CLOSED" || market.status === "RESOLVED",
  ).length;

  return NextResponse.json({
    event: {
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
      closedMarketCount,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    },
  });
}
