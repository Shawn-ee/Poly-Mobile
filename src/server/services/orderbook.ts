import { cancelOrderAndUnlock, placeOrderAndMatch } from "@/server/services/matching";

export const placeOrder = async (params: {
  marketId: string;
  userId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  price: string | number;
  amount: string | number;
}) => {
  const result = await placeOrderAndMatch({
    marketId: params.marketId,
    userId: params.userId,
    outcomeId: params.outcomeId,
    side: params.side,
    price: params.price,
    size: params.amount,
  });

  return {
    orderId: result.order.id,
    status: result.order.status,
    amount: Number(result.order.size),
    remaining: Number(result.order.remaining),
    price: Number(result.order.price),
  };
};

export const cancelOrder = async (params: { orderId: string; userId: string }) => {
  const result = await cancelOrderAndUnlock(params);
  return {
    orderId: result.order.id,
    status: result.order.status,
  };
};
