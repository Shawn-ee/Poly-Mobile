import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getUserId();
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") ?? "1W").toUpperCase();

  const now = Date.now();
  const cutoff = (() => {
    if (range === "1D") return new Date(now - 24 * 60 * 60 * 1000);
    if (range === "1W") return new Date(now - 7 * 24 * 60 * 60 * 1000);
    if (range === "1M") return new Date(now - 30 * 24 * 60 * 60 * 1000);
    return null;
  })();

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
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

  const snapshots = await prisma.marketOutcomeSnapshot.findMany({
    where: {
      marketId: id,
      ...(cutoff ? { ts: { gte: cutoff } } : {}),
    },
    orderBy: { ts: "asc" },
  });

  const capped =
    snapshots.length > 5000
      ? snapshots.slice(snapshots.length - 5000)
      : snapshots;

  const series: Record<string, { ts: string; price: number }[]> = {};
  for (const snap of capped) {
    if (!series[snap.outcomeId]) series[snap.outcomeId] = [];
    series[snap.outcomeId].push({
      ts: snap.ts.toISOString(),
      price: Number(snap.price),
    });
  }

  return NextResponse.json({
    marketId: id,
    outcomes: market.outcomes.map((o) => ({ id: o.id, name: o.name })),
    series,
  });
}
