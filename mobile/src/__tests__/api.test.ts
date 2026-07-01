import { afterEach, describe, expect, test, vi } from "vitest";
import { PolyApi } from "../api";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });

describe("Holiwyn mobile API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("sends Bearer auth from the configured API key", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ walletBalance: 10000, positions: [], openOrders: [], comboOrders: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test/", "pk_live_test.secret").getPortfolio();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/portfolio");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(headers.get("Accept")).toBe("application/json");
  });

  test("places canonical limit orders with idempotency and auth headers", async () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);
    const fetchImpl = vi.fn(async () => jsonResponse({ order: { id: "order-1" } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "pk_live_test.secret").placeLimitOrder({
      marketId: "market-1",
      outcomeId: "yes",
      side: "BUY",
      price: "0.45",
      size: "10.00",
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/orders");
    expect(init.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(headers.get("Idempotency-Key")).toBe("mobile-12345");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      marketId: "market-1",
      outcomeId: "yes",
      side: "BUY",
      price: "0.45",
      size: "10.00",
      type: "LIMIT",
      clientOrderId: "mobile-12345",
    });
  });

  test("cancels orders through the canonical order endpoint", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ order: { id: "order/1", status: "CANCELED" } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "pk_live_test.secret").cancelOrder("order/1");

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/orders/order%2F1");
    expect(init.method).toBe("DELETE");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
  });
});
