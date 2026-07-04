import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      markets: {
        where: {
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          status: "LIVE",
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const compactMarketIds = compactMarkets.map((market) => market.id);
  const chartSnapshots = compactMarketIds.length
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: { marketId: { in: compactMarketIds } },
        orderBy: [{ marketId: "asc" }, { ts: "asc" }],
        take: compactMarketIds.length * 240,
      })
    : [];

  return NextResponse.json(await serializeMobileLiveEventDetail({ event, chartSnapshots }));
}
