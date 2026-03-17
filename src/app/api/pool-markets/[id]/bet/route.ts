import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import {
  assertMarketMechanism,
  assertMarketStatusTransition,
  toGuardResponse,
} from "@/lib/marketGuards";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";

type LockedBalanceRow = {
  userId: string;
  availableUSDC: Prisma.Decimal;
  lockedUSDC: Prisma.Decimal;
};

const lockUserBalanceRow = async (tx: Prisma.TransactionClient, userId: string) => {
  await tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const rows = await tx.$queryRaw<LockedBalanceRow[]>`
    SELECT "userId", "availableUSDC", "lockedUSDC"
    FROM "UserBalance"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const outcomeId = typeof body?.outcomeId === "string" ? body.outcomeId : "";
  const amount = Number(body?.amount ?? 0);

  if (!outcomeId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      outcomes: { where: { isActive: true } },
      poolStakePresets: { where: { isActive: true } },
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

  if (market.isCanceled) {
    return NextResponse.json({ error: "Market has been canceled." }, { status: 400 });
  }

  const now = new Date();
  if (String(market.status) !== "LIVE" && String(market.status) !== "ACTIVE") {
    return NextResponse.json({ error: "Betting is closed." }, { status: 400 });
  }
  if (market.betCloseTime && now >= market.betCloseTime) {
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
    await prisma.market.update({
      where: { id: market.id },
      data: { status: "CLOSED" as never },
    });
    return NextResponse.json({ error: "Betting is closed." }, { status: 400 });
  }

  const selectedOutcome = market.outcomes.find((outcome) => outcome.id === outcomeId);
  if (!selectedOutcome) {
    return NextResponse.json({ error: "Invalid outcome." }, { status: 400 });
  }
  const allowedAmounts = market.poolStakePresets.map((preset) => Number(preset.amount));
  if (!allowedAmounts.includes(amount)) {
    return NextResponse.json({ error: "Amount is not an allowed preset." }, { status: 400 });
  }

  const existing = await prisma.poolBet.findUnique({
    where: { userId_marketId: { userId, marketId: id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already placed a bet in this market." },
      { status: 400 }
    );
  }

  const participants = await prisma.poolBet.count({ where: { marketId: id } });
  if (participants >= market.maxParticipants) {
    return NextResponse.json({ error: "Market participant cap reached." }, { status: 400 });
  }

  const amountDecimal = new Prisma.Decimal(amount);

  try {
    await prisma.$transaction(async (tx) => {
      const balance = await lockUserBalanceRow(tx, userId);
      if (!balance || balance.availableUSDC.lt(amountDecimal)) {
        throw new Error("Insufficient available USDC.");
      }

      await tx.poolBet.create({
        data: {
          userId,
          marketId: id,
          outcomeId,
          amount: amountDecimal,
        },
      });

      await tx.userBalance.update({
        where: { userId },
        data: {
          availableUSDC: { decrement: amountDecimal },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId,
          amountDelta: amountDecimal.neg(),
          reason: "POOL_BET",
          operation: "POOL_BET",
          referenceType: "PoolBet",
          referenceId: id,
          deltaAvailableUSDC: amountDecimal.neg(),
          deltaLockedUSDC: new Prisma.Decimal(0),
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to place bet.";
    if (message.includes("Insufficient available USDC")) {
      return NextResponse.json({ error: "Insufficient balance." }, { status: 400 });
    }
    throw error;
  }

  const grouped = await prisma.poolBet.groupBy({
    by: ["outcomeId"],
    where: { marketId: id },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const totalPot = grouped.reduce((sum, entry) => sum + Number(entry._sum.amount ?? 0), 0);

  return NextResponse.json({
    ok: true,
    totalPot,
    totalsByOutcome: Object.fromEntries(
      grouped.map((entry) => [
        entry.outcomeId,
        {
          amount: Number(entry._sum.amount ?? 0),
          count: entry._count._all,
        },
      ])
    ),
  });
}
