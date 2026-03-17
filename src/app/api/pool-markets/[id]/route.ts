import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import {
  assertMarketMechanism,
  assertMarketStatusTransition,
  toGuardResponse,
} from "@/lib/marketGuards";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getUserId();

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      poolStakePresets: {
        where: { isActive: true },
        orderBy: { amount: "asc" },
      },
    },
  });
  if (!market) {
    return NextResponse.json({ error: "Pool market not found." }, { status: 404 });
  }
  try {
    assertMarketMechanism(market.mechanism, "POOL");
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const now = new Date();
  let currentStatus = market.status;
  if (
    (String(market.status) === "LIVE" || String(market.status) === "ACTIVE") &&
    market.betCloseTime &&
    now >= market.betCloseTime
  ) {
    try {
      assertMarketStatusTransition({
        mechanism: market.mechanism,
        current: market.status,
        next: "CLOSED",
      });
    } catch (error) {
      const response = toGuardResponse(error);
      return NextResponse.json(response.body, { status: response.status });
    }
    const updated = await prisma.market.update({
      where: { id: market.id },
      data: { status: "CLOSED" as never },
      select: { status: true },
    });
    currentStatus = updated.status;
  }

  const grouped = await prisma.poolBet.groupBy({
    by: ["outcomeId"],
    where: { marketId: id },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const participants = await prisma.poolBet.count({ where: { marketId: id } });
  const myBet = userId
    ? await prisma.poolBet.findUnique({
        where: { userId_marketId: { userId, marketId: id } },
      })
    : null;

  const totalsByOutcome = Object.fromEntries(
    grouped.map((entry) => [
      entry.outcomeId,
      {
        amount: Number(entry._sum.amount ?? 0),
        count: entry._count._all,
      },
    ])
  );
  const totalPot = grouped.reduce((sum, entry) => sum + Number(entry._sum.amount ?? 0), 0);
  const hideBreakdown =
    Boolean(market.hidePicksUntilClose) &&
    Boolean(market.betCloseTime) &&
    now < (market.betCloseTime as Date) &&
    userId !== market.ownerId;

  return NextResponse.json({
    market: {
      id: market.id,
      title: market.title,
      description: market.description,
      status: currentStatus,
      isCanceled: market.isCanceled,
      kind: market.kind,
      ownerId: market.ownerId,
      isOwner: userId === market.ownerId,
      betCloseTime: market.betCloseTime,
      resolveTime: market.resolveTime,
      maxParticipants: market.maxParticipants,
      hidePicksUntilClose: market.hidePicksUntilClose,
      outcomes: market.outcomes,
      presets: market.poolStakePresets.map((preset) => Number(preset.amount)),
      participants,
      totalPot,
      totalsByOutcome: hideBreakdown ? {} : totalsByOutcome,
      myBet: myBet
        ? {
            outcomeId: myBet.outcomeId,
            amount: Number(myBet.amount),
          }
        : null,
    },
  });
}
