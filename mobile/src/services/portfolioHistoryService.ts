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
    marketType?: string;
    line?: string;
    period?: string;
    displayLabel?: string;
  } | null,
): TicketSelection | undefined => {
  if (!selection?.displayLabel) return undefined;
  const marketType = knownMarketTypes.includes(selection.marketType as TicketSelection["marketType"])
    ? (selection.marketType as TicketSelection["marketType"])
    : "prop";
  return {
    marketType,
    line: selection.line,
    period: selection.period,
    displayLabel: selection.displayLabel,
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

export const recentTradesToActivity = (trades: PortfolioRecentTradeItem[] = []): PortfolioActivity[] =>
  trades.map((trade) => {
    const executionPrice = trade.shares > 0 ? trade.cost / trade.shares : 0;
    return {
      id: `trade-${trade.id}`,
      action: trade.side === "SELL" ? "sold" : "opened",
      title: trade.market.title,
      outcome: trade.outcome.name,
      selection: selectionFromBackend(trade.selection),
      amount: trade.cost,
      shares: trade.shares,
      side: trade.side === "SELL" ? "sell" : "buy",
      probability: Math.round(executionPrice * 100),
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
