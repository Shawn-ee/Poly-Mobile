import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";
import { parseBotInitializationMetadata } from "@/server/services/referenceBotInitialization";
import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  const { id } = await context.params;

  const market = await prisma.market.findUnique({
    where: { id },
    select: {
      id: true,
      visibility: true,
      mechanism: true,
      ownerId: true,
      referenceSource: true,
      externalSlug: true,
      externalMarketId: true,
      conditionId: true,
      referenceMetadata: true,
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

  const plans = await getLatestReferenceQuotePlansForMarket(market.id);
  const hasSnapshot = plans.some((plan) => plan.hasSnapshot);
  const botInitialization = parseBotInitializationMetadata(market.referenceMetadata);
  const botUserId = botInitialization?.capital?.botUserId ?? null;
  const [openOrders, balance, positions] = botUserId
    ? await Promise.all([
        prisma.order.findMany({
          where: {
            marketId: market.id,
            userId: botUserId,
            status: { in: ["OPEN", "PARTIAL"] },
          },
          select: {
            id: true,
            outcomeId: true,
            side: true,
            price: true,
            remaining: true,
            reservedNotional: true,
            createdAt: true,
          },
        }),
        prisma.userBalance.findUnique({
          where: { userId: botUserId },
          select: {
            availableUSDC: true,
            lockedUSDC: true,
          },
        }),
        prisma.position.findMany({
          where: {
            marketId: market.id,
            userId: botUserId,
          },
          select: {
            outcomeId: true,
            shares: true,
            reservedShares: true,
            realizedPnl: true,
          },
        }),
      ])
    : [[], null, []];
  const activeByOutcome = new Map<
    string,
    {
      activeBotBid: number | null;
      activeBotAsk: number | null;
      activeBidOrderId: string | null;
      activeAskOrderId: string | null;
    }
  >();
  let openOrderNotionalCents = 0;
  for (const order of openOrders) {
    openOrderNotionalCents += Math.round(Number(order.reservedNotional) * 100);
    const existing = activeByOutcome.get(order.outcomeId) ?? {
      activeBotBid: null,
      activeBotAsk: null,
      activeBidOrderId: null,
      activeAskOrderId: null,
    };
    const numericPrice = Number(order.price);
    if (order.side === "BUY") {
      if (existing.activeBotBid == null || numericPrice > existing.activeBotBid) {
        existing.activeBotBid = numericPrice;
        existing.activeBidOrderId = order.id;
      }
    } else if (existing.activeBotAsk == null || numericPrice < existing.activeBotAsk) {
      existing.activeBotAsk = numericPrice;
      existing.activeAskOrderId = order.id;
    }
    activeByOutcome.set(order.outcomeId, existing);
  }
  const dailyLossCents = Math.max(
    0,
    Math.round(
      positions.reduce((sum, position) => sum + Math.min(0, Number(position.realizedPnl ?? 0)), 0) * -100,
    ),
  );

  return NextResponse.json({
    marketId: market.id,
    source: market.referenceSource,
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    hasSnapshot,
    reason: hasSnapshot ? null : "no_reference_snapshot",
    dryRun: process.env.SYSTEM_LIQUIDITY_DRY_RUN !== "false",
    liveOrdersEnabled: process.env.LIVE_SYSTEM_LIQUIDITY_ENABLED === "true",
    botInitialization: botInitialization
      ? {
          ...botInitialization,
          capital: botInitialization.capital
            ? {
                ...botInitialization.capital,
                openOrderNotionalCents,
                dailyLossCents,
                availableCashUSDC: balance ? Number(balance.availableUSDC) : null,
                lockedCashUSDC: balance ? Number(balance.lockedUSDC) : null,
              }
            : null,
        }
      : null,
    outcomes: plans.map((plan) => ({
      ...plan,
      activeBotBid: activeByOutcome.get(plan.localOutcomeId)?.activeBotBid ?? null,
      activeBotAsk: activeByOutcome.get(plan.localOutcomeId)?.activeBotAsk ?? null,
      activeBidOrderId: activeByOutcome.get(plan.localOutcomeId)?.activeBidOrderId ?? null,
      activeAskOrderId: activeByOutcome.get(plan.localOutcomeId)?.activeAskOrderId ?? null,
      formula: "plannedBotBid = referenceBid - 2 ticks; plannedBotAsk = referenceAsk + 2 ticks",
    })),
  });
}
