import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { submitTicketOrder } from "../services/orderService";

const market = {
  id: "world-cup-winner",
  title: "World Cup winner",
  zhTitle: "世界杯冠军",
  type: "future" as const,
  outcomes: [],
};

const outcome = {
  id: "france",
  label: "France",
  zhLabel: "法国",
  probability: 34,
  color: "#2563eb",
};

describe("ticket order service", () => {
  test("submits server-mode ticket orders with canonical price, size, side, and identifiers", async () => {
    const placeLimitOrder = vi.fn(async () => ({ order: { id: "server-order-1" } }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      side: "buy",
      amount: 100,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "BUY",
      price: "0.34",
      size: "100.00",
    });
    expect(result).toMatchObject({
      id: "server-order-1",
      mode: "server",
      title: "World Cup winner",
      outcome: "France",
      side: "buy",
      amount: 100,
      probability: 34,
    });
  });

  test("uses top-level server order id fallback when canonical response omits nested order id", async () => {
    const placeLimitOrder = vi.fn(async () => ({ id: "server-order-top-level" }));
    const api = { placeLimitOrder } as unknown as PolyApi;

    const result = await submitTicketOrder({
      mode: "server",
      api,
      market,
      outcome,
      side: "sell",
      amount: 25.5,
    });

    expect(placeLimitOrder).toHaveBeenCalledWith({
      marketId: "world-cup-winner",
      outcomeId: "france",
      side: "SELL",
      price: "0.34",
      size: "25.50",
    });
    expect(result.id).toBe("server-order-top-level");
    expect(result.mode).toBe("server");
  });

  test("rejects non-positive ticket amounts before calling the API", async () => {
    const placeLimitOrder = vi.fn();
    const api = { placeLimitOrder } as unknown as PolyApi;

    await expect(
      submitTicketOrder({
        mode: "server",
        api,
        market,
        outcome,
        side: "buy",
        amount: 0,
      }),
    ).rejects.toThrow("Order amount must be greater than zero.");
    expect(placeLimitOrder).not.toHaveBeenCalled();
  });
});
