import type { PolyApi } from "../api";
import type { PortfolioActivity } from "../components/Portfolio";
import type { PortfolioCanceledOrderItem } from "../types";

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
    amount: order.remaining,
    side: order.side === "SELL" ? "sell" : "buy",
    probability: Math.round(order.price * 100),
    timestamp: formatHistoryTimestamp(order.canceledAt),
  }));

export const loadPortfolioHistoryActivities = async (api: PolyApi): Promise<PortfolioActivity[]> => {
  const payload = await api.getPortfolioHistory();
  return [...canceledOrdersToActivity(payload.canceledOrders), ...portfolioHistoryToActivity(payload.history)];
};
