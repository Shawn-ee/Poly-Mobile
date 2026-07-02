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
  return shares && shares > 0 ? shares.toFixed(2) : undefined;
};

export const closePositionOnServer = async ({ mode, api, position }: ClosePositionInput): Promise<void> => {
  if (mode !== "server") {
    return;
  }

  const size = closeSize(position);
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
