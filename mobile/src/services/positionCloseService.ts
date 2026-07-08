import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";
import type { OrderMode } from "./orderService";

export type ClosePositionInput = {
  mode: OrderMode;
  api: PolyApi;
  position: Position;
};

const closePrice = (position: Position) =>
  (typeof position.currentPrice === "number" ? position.currentPrice : position.probability / 100).toFixed(2);

const closeSize = (position: Position) => {
  const shares = typeof position.shares === "number" ? position.shares : undefined;
  return shares !== undefined && Number.isFinite(shares) && shares > 0 ? shares.toFixed(6) : undefined;
};

export const availablePositionShares = (position: Position) =>
  typeof position.shares === "number" && Number.isFinite(position.shares) ? Math.max(0, position.shares) : 0;

export const canCashOutPosition = (position: Position) => {
  if (typeof position.shares === "number") {
    return Number.isFinite(position.shares) && position.shares > 0;
  }
  if (position.mode === "server") return false;
  const fallbackValue = position.currentValue ?? position.amount;
  return Number.isFinite(fallbackValue) && fallbackValue > 0;
};

export const assertCanSellPositionShares = (position: Position, requestedShares: number) => {
  const availableShares = availablePositionShares(position);
  if (availableShares <= 0) {
    throw new Error("No shares are available to cash out.");
  }
  if (!Number.isFinite(requestedShares) || requestedShares <= 0) {
    throw new Error("Sell size must be greater than zero.");
  }
  if (requestedShares > availableShares) {
    throw new Error("Sell amount exceeds available shares.");
  }
};

export const closePositionOnServer = async ({ mode, api, position }: ClosePositionInput): Promise<void> => {
  if (mode !== "server") {
    return;
  }

  const size = closeSize(position);
  assertCanSellPositionShares(position, Number(size));
  if (!position.marketId || !position.outcomeId || !size) {
    throw new Error("Server position close requires market, outcome, and share identity.");
  }

  await api.placeLimitOrder({
    marketId: position.marketId,
    outcomeId: position.outcomeId,
    side: "SELL",
    price: closePrice(position),
    size,
  });
};
