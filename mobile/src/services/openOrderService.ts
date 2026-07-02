import type { PolyApi } from "../api";
import type { OpenOrder, PortfolioActivity } from "../components/Portfolio";
import type { OrderMode } from "./orderService";

export const openOrderCanceledActivity = (order: OpenOrder, timestamp: string): PortfolioActivity => ({
  id: `${order.id}-canceled`,
  action: "canceled",
  title: order.title,
  outcome: order.outcome,
  amount: order.orderValue ?? (order.remainingShares ?? order.remaining) * order.price,
  side: order.side,
  probability: Math.round(order.price * 100),
  timestamp,
});

export const appendUniqueActivity = (
  current: PortfolioActivity[],
  activity: PortfolioActivity,
): PortfolioActivity[] => (current.some((item) => item.id === activity.id) ? current : [activity, ...current]);

export const cancelOpenOrderOnServer = async ({
  mode,
  api,
  order,
}: {
  mode: OrderMode;
  api: PolyApi;
  order: OpenOrder;
}): Promise<void> => {
  if (mode !== "server") {
    return;
  }
  await api.cancelOrder(order.id);
};
