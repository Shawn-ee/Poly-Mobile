import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";
import { closePositionOnServer } from "../services/positionCloseService";

const position: Position = {
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares: 500,
  currentPrice: 0.51,
  currentValue: 255,
  pnl: 45,
};

describe("position close service", () => {
  test("does not call the backend for mock-mode closes", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({ mode: "mock", api, position });

    expect(placeLimitOrder).not.toHaveBeenCalled();
  });

  test("submits server-mode closes as canonical SELL limit orders", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({ mode: "server", api, position });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "SELL",
      price: "0.51",
      size: "500.00",
    });
  });

  test("falls back to entry probability when current price is unavailable", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-2" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({
      mode: "server",
      api,
      position: {
        ...position,
        currentPrice: undefined,
      },
    });

    expect(placeLimitOrder).toHaveBeenCalledWith(expect.objectContaining({ price: "0.42" }));
  });

  test("rejects server closes without market, outcome, and share identity", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      closePositionOnServer({
        mode: "server",
        api,
        position: {
          ...position,
          outcomeId: undefined,
        },
      }),
    ).rejects.toThrow("Server position close requires market, outcome, and share identity.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });
});
