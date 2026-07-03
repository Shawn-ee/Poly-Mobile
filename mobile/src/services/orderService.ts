import { PolyApi } from "../api";
import type { TicketSelection } from "../components/TradeTicket";
import type { Event, Market, Outcome } from "../mocks/worldCup";

export type OrderMode = "mock" | "server";

export type TicketOrderInput = {
  mode: OrderMode;
  api: PolyApi;
  event?: Event;
  market: Market;
  outcome: Outcome;
  selection?: TicketSelection;
  side: "buy" | "sell";
  amount: number;
};

export type TicketOrderResult = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  side: "buy" | "sell";
  amount: number;
  probability: number;
  status?: string;
  size?: number;
  filledSize?: number;
  remainingSize?: number;
};

type ServerOrderResponse = {
  order?: {
    id?: string;
    status?: string;
    size?: string | number | null;
    remaining?: string | number | null;
  };
  fills?: Array<{ size?: string | number | null }>;
  id?: string;
  status?: string;
  size?: string | number | null;
  remaining?: string | number | null;
};

const label = (value: { label?: string; title?: string; name?: string }) =>
  value.label ?? value.title ?? value.name ?? "Market";

const orderTitle = (input: TicketOrderInput) => {
  if (input.event && input.market.type === "game-line") return label(input.event);
  return label(input.market);
};

const mockOrder = (input: TicketOrderInput): TicketOrderResult => ({
  id: `mock-${input.market.id}-${input.outcome.id}-${Date.now()}`,
  mode: "mock",
  title: orderTitle(input),
  outcome: label(input.outcome),
  selection: input.selection,
  side: input.side,
  amount: input.amount,
  probability: input.outcome.probability,
});

const numericField = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const filledSizeFromResponse = (response: ServerOrderResponse) => {
  const totalFromFills = response.fills?.reduce((total, fill) => total + (numericField(fill.size) ?? 0), 0);
  if (totalFromFills && totalFromFills > 0) return totalFromFills;

  const size = numericField(response.order?.size ?? response.size);
  const remaining = numericField(response.order?.remaining ?? response.remaining);
  if (typeof size === "number" && typeof remaining === "number") {
    return Math.max(0, size - remaining);
  }
  return undefined;
};

const sharesFromAmount = (amount: number, probability: number) => {
  const price = Math.max(probability, 1) / 100;
  return amount / price;
};

export const submitTicketOrder = async (input: TicketOrderInput): Promise<TicketOrderResult> => {
  if (input.amount <= 0) {
    throw new Error("Order amount must be greater than zero.");
  }

  if (input.mode === "mock") {
    return mockOrder(input);
  }

  const orderInput = {
    marketId: input.market.id,
    outcomeId: input.outcome.id,
    side: input.side.toUpperCase() as "BUY" | "SELL",
    price: (input.outcome.probability / 100).toFixed(2),
    size: sharesFromAmount(input.amount, input.outcome.probability).toFixed(2),
    ...(input.selection ? { selection: input.selection } : {}),
  };
  const payload = await input.api.placeLimitOrder(orderInput);
  const response = payload && typeof payload === "object" ? (payload as ServerOrderResponse) : {};
  const size = numericField(response.order?.size ?? response.size);
  const remainingSize = numericField(response.order?.remaining ?? response.remaining);
  const status = response.order?.status ?? response.status;

  return {
    ...mockOrder(input),
    id: response.order?.id ?? response.id ?? `server-${Date.now()}`,
    mode: "server",
    status,
    size,
    filledSize: filledSizeFromResponse(response),
    remainingSize,
  };
};
