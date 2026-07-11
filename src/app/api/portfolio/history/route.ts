import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { requireCanonicalActor } from "@/lib/canonicalAuth";
import { buildPortfolioSelectionSourceSummary } from "@/server/services/portfolioSelectionSourceSummary";
import { buildTicketSelectionMetadata } from "@/server/services/ticketSelectionMetadata";

export const dynamic = "force-dynamic";

function marketDisplayTitle(title: string, eventTitle?: string | null) {
  const prefix = eventTitle ? `${eventTitle}:` : "";
  if (prefix && title.toLowerCase().startsWith(prefix.toLowerCase())) {
    return title.slice(prefix.length).trim() || title;
  }
  return title;
}

type CostBasisTrade = {
  id: string;
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  shares: unknown;
  cost: unknown;
  fee: unknown;
};

type RecentTradeSelectionOrder = {
  id?: string;
  marketId: string;
  outcomeId: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  apiOrderRequest?: { requestBody: unknown } | null;
};

const roundTokens = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

function buildRecentTradeRealizedPnlMap(trades: CostBasisTrade[]) {
  const stateBySelection = new Map<string, { shares: number; avgCost: number }>();
  const realizedByTradeId = new Map<string, number | null>();

  for (const trade of trades) {
    const selectionKey = `${trade.marketId}:${trade.outcomeId}`;
    const current = stateBySelection.get(selectionKey) ?? { shares: 0, avgCost: 0 };
    const shares = Number(trade.shares);
    const cost = Number(trade.cost);
    const fee = Number(trade.fee);
    if (!Number.isFinite(shares) || shares <= 0 || !Number.isFinite(cost) || !Number.isFinite(fee)) {
      if (trade.side === "SELL") realizedByTradeId.set(trade.id, null);
      continue;
    }

    if (trade.side === "BUY") {
      const nextShares = current.shares + shares;
      const nextAvgCost = nextShares > 0 ? (current.avgCost * current.shares + cost) / nextShares : 0;
      stateBySelection.set(selectionKey, { shares: nextShares, avgCost: nextAvgCost });
      continue;
    }

    if (current.shares + 0.000001 < shares) {
      realizedByTradeId.set(trade.id, null);
      stateBySelection.set(selectionKey, { shares: Math.max(0, current.shares - shares), avgCost: current.avgCost });
      continue;
    }

    const sellPrice = cost / shares;
    const realizedPnl = (sellPrice - current.avgCost) * shares - fee;
    realizedByTradeId.set(trade.id, roundTokens(realizedPnl));
    const remainingShares = current.shares - shares;
    stateBySelection.set(selectionKey, {
      shares: remainingShares <= 0.000001 ? 0 : remainingShares,
      avgCost: remainingShares <= 0.000001 ? 0 : current.avgCost,
    });
  }

  return realizedByTradeId;
}

async function getPortfolioHistoryUserId(request: NextRequest) {
  if (request.headers.get("Authorization")) {
    const actor = await requireCanonicalActor(request, ["account:read"]);
    return actor.userId;
  }
  return getUserId();
}

const timestampValue = (value: Date | string | null | undefined) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

function buildSelectionOrderBuckets(orders: RecentTradeSelectionOrder[]) {
  const buckets = new Map<string, RecentTradeSelectionOrder[]>();
  for (const order of orders) {
    const key = `${order.marketId}:${order.outcomeId}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(order);
    buckets.set(key, bucket);
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => {
      const updatedDiff = timestampValue(b.updatedAt) - timestampValue(a.updatedAt);
      if (updatedDiff !== 0) return updatedDiff;
      const createdDiff = timestampValue(b.createdAt) - timestampValue(a.createdAt);
      if (createdDiff !== 0) return createdDiff;
      return String(b.id ?? "").localeCompare(String(a.id ?? ""));
    });
  }
  return buckets;
}

function selectionRequestBodyForTrade(
  trade: { marketId: string; outcomeId: string; createdAt: Date | string },
  buckets: Map<string, RecentTradeSelectionOrder[]>,
) {
  const candidates = buckets.get(`${trade.marketId}:${trade.outcomeId}`) ?? [];
  if (!candidates.length) return undefined;
  const tradeCreatedAt = timestampValue(trade.createdAt);
  const historicalCandidate = candidates.find((order) => timestampValue(order.createdAt) <= tradeCreatedAt);
  return (historicalCandidate ?? candidates[0]).apiOrderRequest?.requestBody;
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
      market: { include: { outcomes: true, event: { select: { slug: true, title: true } } } },
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
          id: true,
          marketId: true,
          outcomeId: true,
          createdAt: true,
          updatedAt: true,
          apiOrderRequest: { select: { requestBody: true } },
        },
      })
    : [];
  const recentTradeSelectionBuckets = buildSelectionOrderBuckets(recentTradeSelectionOrders);
  const recentTradeSelections = Array.from(
    new Set(recentTrades.map((trade: { marketId: string; outcomeId: string }) => `${trade.marketId}:${trade.outcomeId}`)),
  ).map((key) => {
    const [marketId, outcomeId] = key.split(":");
    return { marketId, outcomeId };
  });
  const costBasisTrades = recentTradeSelections.length
    ? await prisma.trade.findMany({
        where: {
          userId,
          OR: recentTradeSelections,
        },
        select: {
          id: true,
          marketId: true,
          outcomeId: true,
          side: true,
          shares: true,
          cost: true,
          fee: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
    : [];
  const recentTradeRealizedPnlById = buildRecentTradeRealizedPnlMap(costBasisTrades);

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
        eventTitle: string | null;
        eventSlug: string | null;
        displayTitle: string;
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
        eventTitle: trade.market.event?.title ?? null,
        eventSlug: trade.market.event?.slug ?? null,
        displayTitle: marketDisplayTitle(trade.market.title, trade.market.event?.title),
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
        displayTitle: row.market.displayTitle,
        eventTitle: row.market.eventTitle,
        eventSlug: row.market.eventSlug,
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
      displayTitle: marketDisplayTitle(order.market.title, order.market.event?.title),
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
  const recentTradeItems = recentTrades.map((trade) => {
    const isSell = trade.side === "SELL";
    const costTokens = Number(trade.cost);
    const feeTokens = Number(trade.fee);
    const tradeSelectionRequestBody = trade.selectionSnapshot
      ? { selection: trade.selectionSnapshot }
      : selectionRequestBodyForTrade(trade, recentTradeSelectionBuckets);
    return {
      id: trade.id,
      market: {
        ...trade.market,
        eventTitle: trade.market.event?.title ?? null,
        eventSlug: trade.market.event?.slug ?? null,
        displayTitle: marketDisplayTitle(trade.market.title, trade.market.event?.title),
      },
      outcome: trade.outcome,
      selection: buildTicketSelectionMetadata({
        requestBody: tradeSelectionRequestBody,
        market: trade.market,
        outcome: trade.outcome,
      }),
      side: trade.side,
      shares: Number(trade.shares),
      cost: costTokens,
      fee: feeTokens,
      proceedsTokens: isSell ? costTokens - feeTokens : null,
      realizedPnlTokens: isSell ? recentTradeRealizedPnlById.get(trade.id) ?? null : null,
      createdAt: trade.createdAt,
    };
  });

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
