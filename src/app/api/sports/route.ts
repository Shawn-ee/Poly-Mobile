import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const sports = await prisma.event.groupBy({
    by: ["sportKey"],
    where: { category: "sports", sportKey: { not: null } },
    _count: { _all: true },
    orderBy: { sportKey: "asc" },
  });

  return NextResponse.json({
    sports: sports.map((sport) => ({
      sportKey: sport.sportKey,
      eventCount: sport._count._all,
    })),
  });
}
