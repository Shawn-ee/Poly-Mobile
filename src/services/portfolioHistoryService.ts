import type { PolyApi } from "../api";
import type { PortfolioActivity } from "../components/Portfolio";
import type { TicketSelection } from "../components/TradeTicket";
import type { PortfolioCanceledOrderItem, PortfolioRecentTradeItem } from "../types";

const formatHistoryTimestamp = (value: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsed);
};

const knownMarketTypes: TicketSelection["marketType"][] = ["spread", "totals", "team-total", "winner", "prop", "future", "live"];

const selectionFromBackend = (
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
    contractSide?: "yes" | "no";
    referenceSource?: string;
    externalSlug?: string;
    externalMarketId?: string;
    conditionId?: string;
    referenceTokenId?: string;
    referenceOutcomeLabel?: string;
    limitPrice?: number;
    limitSide?: "bid" | "ask";
    limitShares?: number;
  } | null,
): TicketSelection | undefined => {
  if (!selection?.displayLabel) return undefined;
  const marketType = knownMarketTypes.includes(selection.marketType as TicketSelection["marketType"])
    ? (selection.marketType as TicketSelection["marketType"])
    : "prop";
  return {
    marketType,
    marketId: selection.marketId,
    outcomeId: selection.outcomeId,
    marketGroupId: selection.marketGroupId,
    line: selection.line,
    period: selection.period,
    side: selection.side,
    displayLabel: selection.displayLabel,
    contractSide: selection.contractSide,
    referenceSource: selection.referenceSource,
    externalSlug: selection.externalSlug,
    externalMarketId: selection.externalMarketId,
    conditionId: selection.conditionId,
    referenceTokenId: selection.referenceTokenId,
    referenceOutcomeLabel: selection.referenceOutcomeLabel,
    limitPrice: selection.limitPrice,
    limitSide: selection.limitSide,
    limitShares: selection.limitShares,
  };
};

export const portfolioHistoryToActivity = (history: Awaited<ReturnType<PolyApi["getPortfolioHistory"]>>["history"]): PortfolioActivity[] =>
  history.map((item) => {
    const payout = item.winningsTokens + item.refundsTokens;
    return {
      id: `history-${item.market.id}`,
      action: "closed",
      title: item.market.title,
      outcome: item.resolvedOutcomeName ?? "Resolved",
      amount: payout > 0 ? payout : item.netInvestedTokens,
      entryAmount: item.netInvestedTokens,
      timestamp: formatHistoryTimestamp(item.market.resolveTime ?? item.market.createdAt),
    };
  });

export const canceledOrdersToActivity = (orders: PortfolioCanceledOrderItem[] = []): PortfolioActivity[] =>
  orders.map((order) => ({
    id: `canceled-order-${order.id}`,
    action: "canceled",
    title: order.market.title,
    outcome: order.outcome.name,
    selection: selectionFromBackend(order.selection),
    amount: order.remaining * order.price,
    shares: order.remaining,
    side: order.side === "SELL" ? "sell" : "buy",
    probability: Math.round(order.price * 100),
    timestamp: formatHistoryTimestamp(order.canceledAt),
  }));

const executionWindowKey = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return Math.floor(parsed.getTime() / 30000).toString();
};

const selectionGroupKey = (trade: PortfolioRecentTradeItem) => {
  const selection = trade.selection;
  return [
    trade.side,
    trade.market.id,
    trade.outcome.id,
    selection?.marketId ?? "",
    selection?.outcomeId ?? "",
    selection?.marketGroupId ?? "",
    selection?.marketType ?? "",
    selection?.line ?? "",
    selection?.period ?? "",
    selection?.side ?? "",
    selection?.displayLabel ?? "",
    selection?.referenceTokenId ?? "",
    selection?.limitSide ?? "",
    selection?.limitPrice ?? "",
    selection?.contractSide ?? "",
  ].join("|");
};

const recentTradeGroupKey = (trade: PortfolioRecentTradeItem) =>
  trade.orderId ? `order:${trade.orderId}` : `window:${selectionGroupKey(trade)}:${executionWindowKey(trade.createdAt)}`;

export const recentTradesToActivity = (trades: PortfolioRecentTradeItem[] = []): PortfolioActivity[] =>
  Array.from(
    trades.reduce((groups, trade) => {
      const key = recentTradeGroupKey(trade);
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, { first: trade, cost: trade.cost, shares: trade.shares, count: 1 });
        return groups;
      }

      existing.cost += trade.cost;
      existing.shares += trade.shares;
      existing.count += 1;
      return groups;
    }, new Map<string, { first: PortfolioRecentTradeItem; cost: number; shares: number; count: number }>()),
  ).map(([key, group]) => {
    const trade = group.first;
    const executionPrice = group.shares > 0 ? group.cost / group.shares : 0;
    const groupedId = key.startsWith("order:") ? `trade-${key.replace("order:", "order-")}` : `trade-group-${trade.id}`;
    return {
      id: group.count > 1 ? groupedId : `trade-${trade.id}`,
      action: trade.side === "SELL" ? "sold" : "opened",
      title: trade.market.title,
      outcome: trade.outcome.name,
      selection: selectionFromBackend(trade.selection),
      amount: group.cost,
      shares: group.shares,
      side: trade.side === "SELL" ? "sell" : "buy",
      probability: Math.round(executionPrice * 100),
      fillCount: group.count,
      timestamp: formatHistoryTimestamp(trade.createdAt),
    };
  });

export const loadPortfolioHistoryActivities = async (api: PolyApi): Promise<PortfolioActivity[]> => {
  const payload = await api.getPortfolioHistory();
  return [
    ...recentTradesToActivity(payload.recentTrades),
    ...canceledOrdersToActivity(payload.canceledOrders),
    ...portfolioHistoryToActivity(payload.history),
  ];
};
