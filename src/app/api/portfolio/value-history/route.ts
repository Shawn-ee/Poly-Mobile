import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { requireCanonicalActor } from "@/lib/canonicalAuth";
import {
  buildPortfolioValueHistory,
  getPortfolioValueHistoryStart,
  parsePortfolioValueHistoryRange,
} from "@/server/services/portfolioValueHistory";

export const dynamic = "force-dynamic";

async function getPortfolioValueHistoryUserId(request: NextRequest) {
  if (request.headers.get("Authorization")) {
    const actor = await requireCanonicalActor(request, ["account:read"]);
    return actor.userId;
  }
  return getUserId();
}

export async function GET(request: NextRequest) {
  const userId = await getPortfolioValueHistoryUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = parsePortfolioValueHistoryRange(request.nextUrl.searchParams.get("range"));
  if (!range) {
    return NextResponse.json(
      { error: "Invalid range. Expected one of 1D, 1W, 1M, All." },
      { status: 400 },
    );
  }

  const now = new Date();
  const [custody, positions] = await Promise.all([
    prisma.userBalance.findUnique({ where: { userId } }),
    prisma.position.findMany({
      where: { userId, shares: { not: 0 } },
      select: {
        marketId: true,
        outcomeId: true,
        shares: true,
        avgCost: true,
      },
    }),
  ]);

  const snapshots = positions.length
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: {
          ts: { gte: getPortfolioValueHistoryStart(range, now) },
          OR: positions.map((position) => ({
            marketId: position.marketId,
            outcomeId: position.outcomeId,
          })),
        },
        orderBy: [{ ts: "asc" }, { id: "asc" }],
        select: {
          marketId: true,
          outcomeId: true,
          ts: true,
          price: true,
        },
      })
    : [];

  return NextResponse.json(
    buildPortfolioValueHistory({
      range,
      now,
      walletAvailableUSDC: custody?.availableUSDC ?? 0,
      walletLockedUSDC: custody?.lockedUSDC ?? 0,
      positions,
      snapshots,
    }),
  );
}
