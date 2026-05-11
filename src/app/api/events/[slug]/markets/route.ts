import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const markets = await prisma.market.findMany({
    where: { eventId: event.id, visibility: "PUBLIC", isListed: true },
    orderBy: [{ createdAt: "desc" }],
    include: marketReadInclude,
  });

  const payload = await Promise.all(markets.map((market) => serializeMarketReadModel(market)));
  return NextResponse.json({ markets: payload });
}
