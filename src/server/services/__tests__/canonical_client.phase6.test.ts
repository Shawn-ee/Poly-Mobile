import { describe, expect, test, vi } from "vitest";
import { buildBotAuthHeaders, CanonicalBotClient } from "@/lib/botClient";

describe("Phase 6 bot client helper", () => {
  test("auth headers include bearer token and optional idempotency key", () => {
    const headers = buildBotAuthHeaders({
      apiToken: "pk_live_test.secret",
      idempotencyKey: "idem-1",
    });

    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(headers.get("Idempotency-Key")).toBe("idem-1");
    expect(headers.get("Accept")).toBe("application/json");
  });

  test("placeLimitOrder forwards canonical body and idempotency key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: { id: "ord_1" } }),
    });

    const client = new CanonicalBotClient({
      baseUrl: "https://example.test",
      apiToken: "pk_live_test.secret",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.placeLimitOrder({
      marketId: "m1",
      outcomeId: "o1",
      side: "BUY",
      price: "0.45",
      size: "10.000000",
      clientOrderId: "client-1",
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://example.test/api/orders");
    expect(init.method).toBe("POST");
    expect(init.headers.get("Idempotency-Key")).toBe("client-1");
    expect(init.headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      marketId: "m1",
      outcomeId: "o1",
      side: "BUY",
      type: "LIMIT",
      price: "0.45",
      size: "10.000000",
      clientOrderId: "client-1",
    });
  });
});
