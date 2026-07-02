import { NextRequest, NextResponse } from "next/server";

const mockCancelOrderAndUnlock = jest.fn();
const mockAssertApiKeyCanCancelOrder = jest.fn();
const mockEmitMarketUpdate = jest.fn();
const mockEmitUserUpdate = jest.fn();

const mockPrisma = {
  order: {
    findFirst: jest.fn(),
  },
};

const mockRouteCalls: Array<{ scopes: string[]; routeId: string }> = [];

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/canonicalApi", () => ({
  CanonicalApiError: class CanonicalApiError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status = 500) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

jest.mock("@/server/services/canonicalGovernance", () => ({
  assertApiKeyCanCancelOrder: (...args: unknown[]) => mockAssertApiKeyCanCancelOrder(...args),
}));

jest.mock("@/server/services/matching", () => ({
  cancelOrderAndUnlock: (...args: unknown[]) => mockCancelOrderAndUnlock(...args),
}));

jest.mock("@/server/services/orderbookEvents", () => ({
  emitMarketUpdate: (...args: unknown[]) => mockEmitMarketUpdate(...args),
  emitUserUpdate: (...args: unknown[]) => mockEmitUserUpdate(...args),
}));

jest.mock("@/server/services/canonicalApi", () => ({
  getCanonicalOrder: jest.fn(),
}));

jest.mock("@/lib/canonicalRoute", () => ({
  runCanonicalRoute: async (params: {
    request: NextRequest;
    scopes: string[];
    routeId: string;
    handler: (actor: {
      userId: string;
      apiCredentialId: string | null;
      apiKeyId: string | null;
    }) => Promise<{ body: unknown; status?: number }>;
  }) => {
    mockRouteCalls.push({ scopes: params.scopes, routeId: params.routeId });
    try {
      const result = await params.handler({
        userId: "mobile-user-1",
        apiCredentialId: "api-credential-1",
        apiKeyId: "mobile-key-1",
      });
      return NextResponse.json(result.body, { status: result.status ?? 200 });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        "status" in error &&
        "message" in error
      ) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: Number(error.status) },
        );
      }
      return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed" } }, { status: 500 });
    }
  },
}));

import { DELETE } from "@/app/api/orders/[id]/route";

describe("DELETE /api/orders/:id canonical cancel route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteCalls.length = 0;
    mockPrisma.order.findFirst.mockResolvedValue({
      id: "order-1",
      userId: "mobile-user-1",
      marketId: "market-1",
      outcomeId: "outcome-1",
      market: {
        id: "market-1",
        mechanism: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        isCanceled: false,
      },
      apiOrderRequest: {
        clientOrderId: "mobile-client-1",
      },
      createdApiCredential: {
        keyId: "created-key-1",
      },
    });
    mockAssertApiKeyCanCancelOrder.mockResolvedValue(undefined);
    mockCancelOrderAndUnlock.mockResolvedValue({
      order: {
        id: "order-1",
        marketId: "market-1",
        outcomeId: "outcome-1",
        status: "CANCELED",
      },
      balance: { availableUSDC: 9900, lockedUSDC: 0 },
      position: null,
    });
    mockEmitMarketUpdate.mockResolvedValue(undefined);
    mockEmitUserUpdate.mockResolvedValue(undefined);
  });

  test("cancels only the current canonical actor order and returns mobile-safe metadata", async () => {
    const response = await DELETE(
      new NextRequest("http://localhost/api/orders/order-1", {
        method: "DELETE",
        headers: { Authorization: "Bearer pk_live_test.secret" },
      }),
      { params: Promise.resolve({ id: "order-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockRouteCalls).toEqual([{ scopes: ["orders:write"], routeId: "orders:cancel" }]);
    expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "order-1",
          userId: "mobile-user-1",
        },
      }),
    );
    expect(mockAssertApiKeyCanCancelOrder).toHaveBeenCalledWith({
      actor: {
        userId: "mobile-user-1",
        apiCredentialId: "api-credential-1",
        apiKeyId: "mobile-key-1",
      },
      marketId: "market-1",
    });
    expect(mockCancelOrderAndUnlock).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "mobile-user-1",
      apiCredentialId: "api-credential-1",
    });
    expect(mockEmitMarketUpdate).toHaveBeenCalledWith({ marketId: "market-1", outcomeId: "outcome-1" });
    expect(mockEmitUserUpdate).toHaveBeenCalledWith({ userId: "mobile-user-1", marketId: "market-1" });
    expect(body.order).toEqual(
      expect.objectContaining({
        id: "order-1",
        status: "CANCELED",
        type: "LIMIT",
        clientOrderId: "mobile-client-1",
        apiKeyId: "created-key-1",
        canceledByApiKeyId: "mobile-key-1",
      }),
    );
  });

  test("returns 404 without canceling when the actor does not own the order", async () => {
    mockPrisma.order.findFirst.mockResolvedValue(null);

    const response = await DELETE(
      new NextRequest("http://localhost/api/orders/order-2", {
        method: "DELETE",
        headers: { Authorization: "Bearer pk_live_test.secret" },
      }),
      { params: Promise.resolve({ id: "order-2" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("ORDER_NOT_FOUND");
    expect(mockAssertApiKeyCanCancelOrder).not.toHaveBeenCalled();
    expect(mockCancelOrderAndUnlock).not.toHaveBeenCalled();
  });
});
