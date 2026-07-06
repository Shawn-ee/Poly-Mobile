import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";
import { assertCanSellPositionShares, canCashOutPosition, closePositionOnServer } from "../services/positionCloseService";

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
      size: "500.000000",
    });
  });

  test("submits full fractional share precision for cashout-all closes", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-fractional" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({
      mode: "server",
      api,
      position: { ...position, shares: 1.234567 },
    });

    expect(placeLimitOrder).toHaveBeenCalledWith(expect.objectContaining({ size: "1.234567" }));
  });

  test("does not round fractional cashout-all size up", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "close-order-no-round-up" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    await closePositionOnServer({
      mode: "server",
      api,
      position: { ...position, shares: 1.999 },
    });

    expect(placeLimitOrder).toHaveBeenCalledWith(expect.objectContaining({ size: "1.999000" }));
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

  test("rejects cash out when no shares are available", () => {
    expect(() => assertCanSellPositionShares({ ...position, shares: 0 }, 1)).toThrow("No shares are available to cash out.");
  });

  test("rejects cash out when sell size exceeds available shares", () => {
    expect(() => assertCanSellPositionShares({ ...position, shares: 2 }, 3)).toThrow("Sell amount exceeds available shares.");
  });

  test("allows cash out when sell size is within available shares", () => {
    expect(() => assertCanSellPositionShares({ ...position, shares: 2 }, 2)).not.toThrow();
  });

  test("shows cash out for local positions without share identity", () => {
    expect(canCashOutPosition({ ...position, mode: "mock", shares: undefined, amount: 25 })).toBe(true);
  });

  test("keeps cash out unavailable for server positions without positive shares", () => {
    expect(canCashOutPosition({ ...position, shares: 0 })).toBe(false);
    expect(canCashOutPosition({ ...position, shares: undefined })).toBe(false);
  });

  test("keeps cash out unavailable for non-finite server shares", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    expect(canCashOutPosition({ ...position, shares: Number.NaN })).toBe(false);
    expect(canCashOutPosition({ ...position, shares: Number.POSITIVE_INFINITY })).toBe(false);
    await expect(
      closePositionOnServer({ mode: "server", api, position: { ...position, shares: Number.POSITIVE_INFINITY } }),
    ).rejects.toThrow("No shares are available to cash out.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });
});
