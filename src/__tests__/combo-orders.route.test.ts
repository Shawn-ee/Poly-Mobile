import { NextRequest, NextResponse } from "next/server";
import { CanonicalApiError } from "@/lib/canonicalApi";

const submitComboOrder = jest.fn();
const listComboOrders = jest.fn();
const quoteComboOrder = jest.fn();
const requireInternalTradingUserById = jest.fn();

jest.mock("@/server/services/comboOrders", () => ({
  submitComboOrder: (...args: unknown[]) => submitComboOrder(...args),
  listComboOrders: (...args: unknown[]) => listComboOrders(...args),
  quoteComboOrder: (...args: unknown[]) => quoteComboOrder(...args),
}));

jest.mock("@/lib/internalTradingBeta", () => ({
  requireInternalTradingUserById: (...args: unknown[]) => requireInternalTradingUserById(...args),
}));

jest.mock("@/lib/canonicalRoute", () => ({
  runCanonicalRoute: async (params: {
    request: NextRequest;
    handler: (actor: {
      userId: string;
      apiCredentialId: string | null;
      apiKeyId: string | null;
    }) => Promise<{ body: unknown; status?: number }>;
  }) => {
    try {
      const result = await params.handler({
        userId: "user-1",
        apiCredentialId: null,
        apiKeyId: null,
      });
      return NextResponse.json(result.body, { status: result.status ?? 200 });
    } catch (error) {
      if (error instanceof CanonicalApiError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: error.status },
        );
      }
      return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed" } }, { status: 500 });
    }
  },
}));

import { GET, POST } from "@/app/api/combo-orders/route";
import { POST as POST_QUOTE } from "@/app/api/combo-orders/quote/route";

describe("combo order routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    submitComboOrder.mockResolvedValue({ comboOrder: { id: "combo-1", status: "OPEN" } });
    listComboOrders.mockResolvedValue({ items: [] });
    quoteComboOrder.mockResolvedValue({ quote: { comboPrice: "0.2", potentialPayout: "50" } });
  });

  test("POST blocks before combo creation when internal trading gate rejects", async () => {
    requireInternalTradingUserById.mockRejectedValue(
      new CanonicalApiError("TRADING_BETA_DISABLED", "Internal trading beta is not enabled.", 403),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/combo-orders", {
        method: "POST",
        headers: { "Idempotency-Key": "combo-idem-1" },
        body: JSON.stringify({ stakeUSDC: "10", legs: [] }),
      }),
    );

    expect(response.status).toBe(403);
    expect(requireInternalTradingUserById).toHaveBeenCalledWith("user-1");
    expect(submitComboOrder).not.toHaveBeenCalled();
  });

  test("POST submits only after server-side internal trading gate passes", async () => {
    requireInternalTradingUserById.mockResolvedValue({ id: "user-1", email: "allowed@test.local" });

    const response = await POST(
      new NextRequest("http://localhost/api/combo-orders", {
        method: "POST",
        headers: { "Idempotency-Key": "combo-idem-1" },
        body: JSON.stringify({
          stakeUSDC: "10",
          legs: [
            { marketId: "m1", outcomeId: "o1", price: "0.5" },
            { marketId: "m2", outcomeId: "o2", price: "0.4" },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(submitComboOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        idempotencyKeyHeader: "combo-idem-1",
        body: expect.objectContaining({ stakeUSDC: "10" }),
      }),
    );
  });

  test("GET lists only the current actor combo orders through canonical auth", async () => {
    const response = await GET(new NextRequest("http://localhost/api/combo-orders?limit=5"));

    expect(response.status).toBe(200);
    expect(listComboOrders).toHaveBeenCalledWith({ userId: "user-1", limit: 5 });
    expect(requireInternalTradingUserById).not.toHaveBeenCalled();
  });

  test("POST quote calculates combo without opening the trading write gate", async () => {
    const response = await POST_QUOTE(
      new NextRequest("http://localhost/api/combo-orders/quote", {
        method: "POST",
        body: JSON.stringify({
          stakeUSDC: "10",
          legs: [
            { marketId: "m1", outcomeId: "o1" },
            { marketId: "m2", outcomeId: "o2" },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(quoteComboOrder).toHaveBeenCalledWith({
      body: expect.objectContaining({ stakeUSDC: "10" }),
    });
    expect(requireInternalTradingUserById).not.toHaveBeenCalled();
    expect(submitComboOrder).not.toHaveBeenCalled();
  });
});
