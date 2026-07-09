import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { requireCanonicalActor } from "@/lib/canonicalAuth";
import { buildPortfolioSelectionSourceSummary } from "@/server/services/portfolioSelectionSourceSummary";
import { buildTicketSelectionMetadata } from "@/server/services/ticketSelectionMetadata";

export const dynamic = "force-dynamic";

async function getPortfolioHistoryUserId(request: NextRequest) {
  if (request.headers.get("Authorization")) {
    const actor = await requireCanonicalActor(request, ["account:read"]);
    return actor.userId;
  }
  return getUserId();
}

export async function GET(request: NextRequest) {
  const userId = await getPortfolioHistoryUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trades = await prisma.trade.findMany({
    where: {
      userId,
      market: { status: "RESOLVED" },
    },
    include: {
      market: { include: { outcomes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const canceledOrders = await prisma.order.findMany({
    where: {
      userId,
      status: "CANCELED",
    },
    include: {
      market: {
        select: {
          id: true,
          title: true,
          event: { select: { slug: true, title: true } },
          status: true,
          marketGroupKey: true,
          marketType: true,
          line: true,
          period: true,
          referenceSource: true,
          externalSlug: true,
          externalMarketId: true,
          conditionId: true,
        },
      },
      outcome: {
        select: {
          id: true,
          name: true,
          label: true,
          side: true,
          referenceTokenId: true,
          referenceOutcomeLabel: true,
        },
      },
      apiOrderRequest: {
        select: {
          requestBody: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const recentTrades = await prisma.trade.findMany({
    where: {
      userId,
    },
    include: {
      market: {
        select: {
          id: true,
          title: true,
          event: { select: { slug: true, title: true } },
          status: true,
          marketGroupKey: true,
          marketType: true,
          line: true,
          period: true,
          referenceSource: true,
          externalSlug: true,
          externalMarketId: true,
          conditionId: true,
        },
      },
      outcome: {
        select: {
          id: true,
          name: true,
          label: true,
          side: true,
          referenceTokenId: true,
          referenceOutcomeLabel: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const recentTradeSelectionOrders = recentTrades.length
    ? await prisma.order.findMany({
        where: {
          userId,
          marketId: {
            in: Array.from(new Set(recentTrades.map((trade: { marketId: string }) => trade.marketId))),
          },
          outcomeId: {
            in: Array.from(new Set(recentTrades.map((trade: { outcomeId: string }) => trade.outcomeId))),
          },
          status: { in: ["FILLED", "PARTIAL", "OPEN"] },
          apiOrderRequest: { isNot: null },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          marketId: true,
          outcomeId: true,
          apiOrderRequest: { select: { requestBody: true } },
        },
      })
    : [];
  const recentTradeSelectionByMarketOutcome = new Map<string, unknown>();
  for (const order of recentTradeSelectionOrders) {
    const key = `${order.marketId}:${order.outcomeId}`;
    if (!recentTradeSelectionByMarketOutcome.has(key)) {
      recentTradeSelectionByMarketOutcome.set(key, order.apiOrderRequest?.requestBody);
    }
  }

  const marketMap = new Map<
    string,
    {
      market: {
        id: string;
        title: string;
        status: string;
        resolveTime: Date | null;
        resolvedOutcomeId: string | null;
        createdAt: Date;
        outcomes: { id: string; name: string }[];
      };
      totalBuyCost: number;
      totalSellProceeds: number;
    }
  >();

  for (const trade of trades) {
    const existing = marketMap.get(trade.marketId);
    const current = existing ?? {
      market: {
        id: trade.market.id,
        title: trade.market.title,
        status: trade.market.status,
        resolveTime: trade.market.resolveTime,
        resolvedOutcomeId: trade.market.resolvedOutcomeId ?? null,
        createdAt: trade.market.createdAt,
        outcomes: trade.market.outcomes.map((o) => ({ id: o.id, name: o.name })),
      },
      totalBuyCost: 0,
      totalSellProceeds: 0,
    };

    if (trade.side === "BUY") {
      current.totalBuyCost += Number(trade.cost) + Number(trade.fee);
    } else {
      current.totalSellProceeds += Number(trade.cost) - Number(trade.fee);
    }

    marketMap.set(trade.marketId, current);
  }

  const marketIds = Array.from(marketMap.keys());
  const ledger = marketIds.length
    ? await prisma.ledgerEntry.findMany({
        where: {
          userId,
          referenceType: "MARKET",
          referenceId: { in: marketIds },
          reason: { in: ["WIN", "REFUND"] },
        },
      })
    : [];

  const payoutByMarket = new Map<string, { win: number; refund: number }>();
  for (const entry of ledger) {
    const current = payoutByMarket.get(entry.referenceId ?? "") ?? {
      win: 0,
      refund: 0,
    };
    if (entry.reason === "WIN") {
      current.win += Number(entry.amountDelta);
    } else if (entry.reason === "REFUND") {
      current.refund += Number(entry.amountDelta);
    }
    payoutByMarket.set(entry.referenceId ?? "", current);
  }

  const items = Array.from(marketMap.values()).map((row) => {
    const payouts = payoutByMarket.get(row.market.id) ?? { win: 0, refund: 0 };
    const netInvested = row.totalBuyCost - row.totalSellProceeds;
    const realizedPnL = payouts.win + payouts.refund - netInvested;
    const resolvedOutcomeName =
      row.market.outcomes.find((o) => o.id === row.market.resolvedOutcomeId)?.name ??
      null;

    return {
      market: {
        id: row.market.id,
        title: row.market.title,
        status: row.market.status,
        resolveTime: row.market.resolveTime,
        resolvedOutcomeId: row.market.resolvedOutcomeId,
        createdAt: row.market.createdAt,
      },
      resolvedOutcomeName,
      totalBuyCostTokens: row.totalBuyCost,
      totalSellProceedsTokens: row.totalSellProceeds,
      netInvestedTokens: netInvested,
      winningsTokens: payouts.win,
      refundsTokens: payouts.refund,
      realizedPnLTokens: realizedPnL,
    };
  });

  items.sort((a, b) => {
    const aTime = a.market.resolveTime ? new Date(a.market.resolveTime).getTime() : 0;
    const bTime = b.market.resolveTime ? new Date(b.market.resolveTime).getTime() : 0;
    return bTime - aTime;
  });

  const canceledOrderItems = canceledOrders.map((order) => ({
    id: order.id,
    market: {
      ...order.market,
      eventTitle: order.market.event?.title ?? null,
      eventSlug: order.market.event?.slug ?? null,
    },
    outcome: order.outcome,
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
    canceledAt: order.updatedAt,
  }));
  const recentTradeItems = recentTrades.map((trade) => ({
    id: trade.id,
    market: {
      ...trade.market,
      eventTitle: trade.market.event?.title ?? null,
      eventSlug: trade.market.event?.slug ?? null,
    },
    outcome: trade.outcome,
    selection: buildTicketSelectionMetadata({
      requestBody: recentTradeSelectionByMarketOutcome.get(`${trade.marketId}:${trade.outcomeId}`),
      market: trade.market,
      outcome: trade.outcome,
    }),
    side: trade.side,
    shares: Number(trade.shares),
    cost: Number(trade.cost),
    fee: Number(trade.fee),
    createdAt: trade.createdAt,
  }));

  return NextResponse.json({
    history: items.slice(0, 50),
    canceledOrders: canceledOrderItems,
    recentTrades: recentTradeItems,
    selectionSourceSummary: {
      canceledOrders: buildPortfolioSelectionSourceSummary(canceledOrderItems),
      recentTrades: buildPortfolioSelectionSourceSummary(recentTradeItems),
      combined: buildPortfolioSelectionSourceSummary([...canceledOrderItems, ...recentTradeItems]),
    },
  });
}
