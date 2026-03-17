import { NextRequest } from "next/server";
import { POST as placePost } from "@/app/api/orderbook/place/route";
import { POST as cancelPost } from "@/app/api/orderbook/cancel/route";

const getUserId = jest.fn();
const placeOrderAndMatch = jest.fn();
const cancelOrderAndUnlock = jest.fn();
const emitMarketUpdate = jest.fn();
const emitUserUpdate = jest.fn();
const enforceOrderRateLimit = jest.fn();

const prisma = (globalThis as unknown as {
  __PRISMA_MOCK__: {
    market: { findUnique: jest.Mock };
    fill: { findMany: jest.Mock };
    order: { findUnique: jest.Mock };
  };
}).__PRISMA_MOCK__;

jest.mock("@/lib/auth", () => ({ getUserId: () => getUserId() }));
jest.mock("@/lib/db", () => ({
  get prisma() {
    return (globalThis as unknown as { __PRISMA_MOCK__: unknown }).__PRISMA_MOCK__;
  },
}));
jest.mock("@/server/services/matching", () => ({
  placeOrderAndMatch: (...args: unknown[]) => placeOrderAndMatch(...args),
  cancelOrderAndUnlock: (...args: unknown[]) => cancelOrderAndUnlock(...args),
}));
jest.mock("@/server/services/orderbookEvents", () => ({
  emitMarketUpdate: (...args: unknown[]) => emitMarketUpdate(...args),
  emitUserUpdate: (...args: unknown[]) => emitUserUpdate(...args),
}));
jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceOrderRateLimit: (...args: unknown[]) => enforceOrderRateLimit(...args),
}));

describe("order routes event emission after commit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserId.mockResolvedValue("u1");
  });

  test("4.1 place emits only after successful commit", async () => {
    prisma.market.findUnique.mockResolvedValue({
      id: "m1",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      isCanceled: false,
    });
    placeOrderAndMatch.mockResolvedValue({
      order: { id: "o1", outcomeId: "out1" },
      fills: [],
    });
    prisma.fill.findMany.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/orderbook/place", {
      method: "POST",
      body: JSON.stringify({
        marketId: "m1",
        outcomeId: "out1",
        side: "BUY",
        price: "0.5",
        size: "10",
      }),
    });
    const res = await placePost(req);
    expect(res.status).toBe(200);
    expect(placeOrderAndMatch).toHaveBeenCalled();
    expect(emitMarketUpdate).toHaveBeenCalled();
    expect(emitUserUpdate).toHaveBeenCalled();
  });

  test("5.2 place does not emit when transaction fails", async () => {
    prisma.market.findUnique.mockResolvedValue({
      id: "m1",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      isCanceled: false,
    });
    placeOrderAndMatch.mockRejectedValue(new Error("db failure"));

    const req = new NextRequest("http://localhost/api/orderbook/place", {
      method: "POST",
      body: JSON.stringify({
        marketId: "m1",
        outcomeId: "out1",
        side: "BUY",
        price: "0.5",
        size: "10",
      }),
    });
    const res = await placePost(req);
    expect(res.status).toBe(500);
    expect(emitMarketUpdate).not.toHaveBeenCalled();
    expect(emitUserUpdate).not.toHaveBeenCalled();
  });

  test("4.2 payload source includes market depth/recent fill fields via market event builder", async () => {
    prisma.market.findUnique.mockResolvedValue({
      id: "m1",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      isCanceled: false,
    });
    placeOrderAndMatch.mockResolvedValue({
      order: { id: "o1", outcomeId: "out1" },
      fills: [],
    });
    prisma.fill.findMany.mockResolvedValue([]);
    emitMarketUpdate.mockResolvedValue({
      type: "market_update",
      sequence: 1,
      topLevels: { bids: [], asks: [] },
      recentTrades: [],
    });

    const req = new NextRequest("http://localhost/api/orderbook/place", {
      method: "POST",
      body: JSON.stringify({
        marketId: "m1",
        outcomeId: "out1",
        side: "BUY",
        price: "0.5",
        size: "10",
      }),
    });
    await placePost(req);
    expect(emitMarketUpdate).toHaveBeenCalledWith({ marketId: "m1", outcomeId: "out1" });
  });

  test("cancel emits only after successful commit", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "o1",
      marketId: "m1",
      outcomeId: "out1",
      market: { mechanism: "ORDERBOOK", visibility: "PUBLIC", status: "LIVE", isCanceled: false },
    });
    cancelOrderAndUnlock.mockResolvedValue({ order: { id: "o1" } });

    const req = new NextRequest("http://localhost/api/orderbook/cancel", {
      method: "POST",
      body: JSON.stringify({ orderId: "o1" }),
    });
    const res = await cancelPost(req);
    expect(res.status).toBe(200);
    expect(emitMarketUpdate).toHaveBeenCalledWith({ marketId: "m1", outcomeId: "out1" });
    expect(emitUserUpdate).toHaveBeenCalledWith({ userId: "u1", marketId: "m1" });
  });
});
