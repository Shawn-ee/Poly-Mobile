import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ownedMarkets, joinedBets] = await Promise.all([
    prisma.market.findMany({
      where: { mechanism: "POOL", ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        outcomes: {
          where: { isActive: true },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.poolBet.findMany({
      where: { userId, market: { mechanism: "POOL" } },
      orderBy: { createdAt: "desc" },
      include: {
        outcome: true,
        market: {
          include: {
            outcomes: {
              where: { isActive: true },
              orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    }),
  ]);

  const totals = await prisma.poolBet.groupBy({
    by: ["marketId"],
    where: {
      marketId: {
        in: Array.from(
          new Set([
            ...ownedMarkets.map((market) => market.id),
            ...joinedBets.map((bet) => bet.marketId),
          ])
        ),
      },
    },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const totalsByMarket = new Map(
    totals.map((entry) => [
      entry.marketId,
      {
        pot: entry._sum.amount ?? 0,
        participants: entry._count._all ?? 0,
      },
    ])
  );

  return NextResponse.json({
    owned: ownedMarkets.map((market) => ({
      id: market.id,
      title: market.title,
      status: market.status,
      betCloseTime: market.betCloseTime,
      resolveTime: market.resolveTime,
      resolvedOutcomeId: market.resolvedOutcomeId,
      outcomes: market.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
      })),
      totalPot: totalsByMarket.get(market.id)?.pot ?? 0,
      participants: totalsByMarket.get(market.id)?.participants ?? 0,
    })),
    joined: joinedBets.map((bet) => ({
      id: bet.market.id,
      title: bet.market.title,
      status: bet.market.status,
      betCloseTime: bet.market.betCloseTime,
      resolveTime: bet.market.resolveTime,
      resolvedOutcomeId: bet.market.resolvedOutcomeId,
      outcomes: bet.market.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
      })),
      myBet: {
        outcomeId: bet.outcomeId,
        outcomeName: bet.outcome.name,
        amount: bet.amount,
      },
      totalPot: totalsByMarket.get(bet.market.id)?.pot ?? 0,
      participants: totalsByMarket.get(bet.market.id)?.participants ?? 0,
      isOwner: bet.market.ownerId === userId,
    })),
  });
}
