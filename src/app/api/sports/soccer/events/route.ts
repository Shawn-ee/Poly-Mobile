import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEventSummary } from "@/server/services/eventReadModel";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { category: "sports", sportKey: "soccer" },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { markets: true } },
      markets: { select: { status: true } },
    },
  });

  return NextResponse.json({
    events: events.map((event) => serializeEventSummary(event)),
  });
}
