import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { requireCanonicalActor } from "@/lib/canonicalAuth";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { buildTicketSelectionMetadata } from "@/server/services/ticketSelectionMetadata";

export const dynamic = "force-dynamic";

// LEGACY: retained for current UI compatibility. External agents should use GET /api/account/positions
// and GET /api/account/balance for canonical machine-facing account data.
async function getPortfolioUserId(request: NextRequest) {
  if (request.headers.get("Authorization")) {
    const actor = await requireCanonicalActor(request, ["account:read"]);
    return actor.userId;
  }
  return getUserId();
}

export async function GET(request: NextRequest) {
  const userId = await getPortfolioUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const positions = await prisma.position.findMany({
    where: { userId, shares: { not: 0 } },
    include: {
      outcome: true,
      market: true,
    },
  });

  const realizedAgg = await prisma.position.aggregate({
    where: { userId },
    _sum: { realizedPnl: true },
  });
  const custody = await prisma.userBalance.findUnique({ where: { userId } });
  const openOrders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: ["OPEN", "PARTIAL"] },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 25,
    include: {
      outcome: {
        select: { id: true, name: true, label: true, side: true },
      },
      market: {
        select: {
          id: true,
          title: true,
          status: true,
          marketGroupKey: true,
          marketType: true,
          line: true,
          period: true,
        },
      },
      apiOrderRequest: {
        select: {
          requestBody: true,
        },
      },
    },
  });
  const comboOrders = await prisma.comboOrder.findMany({
    where: {
      userId,
      status: "OPEN",
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 25,
    include: {
      legs: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          market: { select: { id: true, title: true, status: true } },
          outcome: { select: { id: true, name: true, label: true, side: true, code: true } },
        },
      },
    },
  });

  const marketOutcomeMap = new Map<string, string[]>();
  for (const p of positions) {
    const existing = marketOutcomeMap.get(p.marketId) ?? [];
    if (!existing.includes(p.outcomeId)) existing.push(p.outcomeId);
    marketOutcomeMap.set(p.marketId, existing);
  }

  const marketOutcomeQuotes = new Map<string, Awaited<ReturnType<typeof getOutcomeQuotes>>>();
  for (const [marketId, outcomeIds] of marketOutcomeMap.entries()) {
    const quotes = await getOutcomeQuotes(marketId, outcomeIds);
    marketOutcomeQuotes.set(marketId, quotes);
  }

  const items = positions.map((position) => {
    const shares = Number(position.shares);
    const avgCost = Number(position.avgCost);
    const quotes = marketOutcomeQuotes.get(position.marketId);
    const quote = quotes?.get(position.outcomeId) ?? null;
    const currentPrice =
      position.market.mechanism === "POOL" ? 0.5 : quote?.mid ?? 0.5;

    const valueTokens = shares * currentPrice;
    const costBasisTokens = shares * avgCost;
    const pnlTokens = valueTokens - costBasisTokens;

    return {
      market: {
        id: position.market.id,
        title: position.market.title,
        status: position.market.status,
        resolveTime: position.market.resolveTime,
        createdAt: position.market.createdAt,
      },
      outcomeId: position.outcomeId,
      outcome: position.outcome.name,
      selection: buildTicketSelectionMetadata({
        market: position.market,
        outcome: position.outcome,
      }),
      shares,
      avgCost,
      currentPrice,
      bestBid: quote?.bestBid ?? null,
      bestAsk: quote?.bestAsk ?? null,
      bestBidSize: quote?.bestBidSize ?? null,
      bestAskSize: quote?.bestAskSize ?? null,
      valueTokens,
      costBasisTokens,
      totalCostBasisTokens: costBasisTokens,
      pnlTokens,
    };
  });

  items.sort((a, b) => b.valueTokens - a.valueTokens);

  const totalValue = items.reduce((sum, item) => sum + item.valueTokens, 0);
  const totalCostBasis = items.reduce((sum, item) => sum + item.costBasisTokens, 0);
  const totalPnl = totalValue - totalCostBasis;
  const walletAvailableUSDC = Number(custody?.availableUSDC ?? 0);
  const walletLockedUSDC = Number(custody?.lockedUSDC ?? 0);
  const walletTotalUSDC = walletAvailableUSDC + walletLockedUSDC;
  const totalRealizedPnl = Number(realizedAgg._sum.realizedPnl ?? 0);

  return NextResponse.json({
    walletAvailableUSDC,
    walletLockedUSDC,
    walletTotalUSDC,
    walletBalance: walletTotalUSDC,
    totalValue,
    totalCostBasis,
    totalRealizedPnl,
    totalPnl,
    positions: items,
    openOrders: openOrders.map((order) => ({
      id: order.id,
      market: {
        id: order.market.id,
        title: order.market.title,
        status: order.market.status,
      },
      outcome: {
        id: order.outcome.id,
        name: order.outcome.name,
      },
      selection: buildTicketSelectionMetadata({
        requestBody: order.apiOrderRequest?.requestBody,
        market: order.market,
        outcome: order.outcome,
      }),
      side: order.side,
      status: order.status,
      price: Number(order.price),
      size: Number(order.amount),
      remaining: Number(order.remaining),
      reservedNotional: Number(order.reservedNotional),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
    comboOrders: comboOrders.map((combo) => ({
      id: combo.id,
      status: combo.status,
      stakeUSDC: Number(combo.stakeUSDC),
      comboPrice: Number(combo.comboPrice),
      potentialPayout: Number(combo.potentialPayout),
      createdAt: combo.createdAt,
      updatedAt: combo.updatedAt,
      legs: combo.legs.map((leg) => ({
        id: leg.id,
        market: {
          id: leg.market.id,
          title: leg.market.title,
          status: leg.market.status,
        },
        outcome: {
          id: leg.outcome.id,
          name: leg.outcome.label ?? leg.outcome.name,
          side: leg.outcome.side,
          code: leg.outcome.code,
        },
        price: Number(leg.price),
        line: leg.line,
        label: leg.label,
        displayOrder: leg.displayOrder,
      })),
    })),
  });
}
