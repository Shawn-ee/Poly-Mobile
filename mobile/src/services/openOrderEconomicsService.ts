type OpenOrderEconomicsInput = {
  side: "buy" | "sell";
  price: number;
  remaining: number;
  remainingShares?: number;
  orderValue?: number;
};

export const openOrderRemainingShares = (order: OpenOrderEconomicsInput) => order.remainingShares ?? order.remaining;

export const openOrderValue = (order: OpenOrderEconomicsInput) =>
  order.orderValue ?? openOrderRemainingShares(order) * order.price;

export const openOrderPotentialValue = (order: OpenOrderEconomicsInput) =>
  order.side === "sell" ? openOrderValue(order) : openOrderRemainingShares(order);

export const openOrderPotentialCopyKey = (order: OpenOrderEconomicsInput) =>
  order.side === "sell" ? "potentialProceeds" : "potentialPayout";
