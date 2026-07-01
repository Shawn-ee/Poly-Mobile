import { PolyApi } from "../api";
import type { Event, Market, Outcome } from "../mocks/worldCup";

export type OrderMode = "mock" | "server";

export type TicketOrderInput = {
  mode: OrderMode;
  api: PolyApi;
  event?: Event;
  market: Market;
  outcome: Outcome;
  side: "buy" | "sell";
  amount: number;
};

export type TicketOrderResult = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  side: "buy" | "sell";
  amount: number;
  probability: number;
};

const label = (value: { label?: string; title?: string; name?: string }) =>
  value.label ?? value.title ?? value.name ?? "Market";

const mockOrder = (input: TicketOrderInput): TicketOrderResult => ({
  id: `mock-${input.market.id}-${input.outcome.id}-${Date.now()}`,
  mode: "mock",
  title: label(input.event ?? input.market),
  outcome: label(input.outcome),
  side: input.side,
  amount: input.amount,
  probability: input.outcome.probability,
});

export const submitTicketOrder = async (input: TicketOrderInput): Promise<TicketOrderResult> => {
  if (input.amount <= 0) {
    throw new Error("Order amount must be greater than zero.");
  }

  if (input.mode === "mock") {
    return mockOrder(input);
  }

  const payload = await input.api.placeLimitOrder({
    marketId: input.market.id,
    outcomeId: input.outcome.id,
    side: input.side.toUpperCase() as "BUY" | "SELL",
    price: (input.outcome.probability / 100).toFixed(2),
    size: input.amount.toFixed(2),
  });
  const response = payload && typeof payload === "object" ? (payload as { order?: { id?: string }; id?: string }) : {};

  return {
    ...mockOrder(input),
    id: response.order?.id ?? response.id ?? `server-${Date.now()}`,
    mode: "server",
  };
};
