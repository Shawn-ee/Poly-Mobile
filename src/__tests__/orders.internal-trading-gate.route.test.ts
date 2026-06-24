import { NextRequest, NextResponse } from "next/server";
import { CanonicalApiError } from "@/lib/canonicalApi";

const submitCanonicalOrder = jest.fn();
const requireInternalTradingUserById = jest.fn();

jest.mock("@/server/services/canonicalOrderSubmission", () => ({
  submitCanonicalOrder: (...args: unknown[]) => submitCanonicalOrder(...args),
}));

jest.mock("@/lib/internalTradingBeta", () => ({
  requireInternalTradingUserById: (...args: unknown[]) => requireInternalTradingUserById(...args),
}));

jest.mock("@/server/services/orderbookEvents", () => ({
  emitMarketUpdate: jest.fn(),
  emitUserUpdate: jest.fn(),
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

import { POST } from "@/app/api/orders/route";

describe("POST /api/orders internal trading gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    submitCanonicalOrder.mockResolvedValue({
      status: 200,
      body: { order: { id: "order-1", marketId: "m1", outcomeId: "o1" } },
    });
  });

  test("blocks before order submission when internal trading gate rejects", async () => {
    requireInternalTradingUserById.mockRejectedValue(
      new CanonicalApiError("TRADING_BETA_DISABLED", "Internal trading beta is not enabled.", 403),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ marketId: "m1" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(requireInternalTradingUserById).toHaveBeenCalledWith("user-1");
    expect(submitCanonicalOrder).not.toHaveBeenCalled();
  });

  test("allows route to submit only after internal trading gate passes", async () => {
    requireInternalTradingUserById.mockResolvedValue({ id: "user-1", email: "allowed@test.local" });

    const response = await POST(
      new NextRequest("http://localhost/api/orders", {
        method: "POST",
        headers: { "Idempotency-Key": "idem-1" },
        body: JSON.stringify({ marketId: "m1", outcomeId: "o1", side: "BUY", type: "LIMIT", price: "0.5", size: "1" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(submitCanonicalOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        body: expect.objectContaining({ marketId: "m1", outcomeId: "o1" }),
        idempotencyKeyHeader: "idem-1",
      }),
    );
  });
});
