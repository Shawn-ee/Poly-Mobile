import { NextRequest } from "next/server";

const getUserId = jest.fn();
const assertMarketVisibleToUser = jest.fn();
const assertMarketMechanism = jest.fn();
const buildPublicOrderbookSnapshot = jest.fn();

const mockPrisma = {
  market: {
    findUnique: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  getUserId: () => getUserId(),
}));

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/marketAccess", () => ({
  assertMarketVisibleToUser: (...args: unknown[]) => assertMarketVisibleToUser(...args),
}));

jest.mock("@/lib/marketGuards", () => ({
  assertMarketMechanism: (...args: unknown[]) => assertMarketMechanism(...args),
  toGuardResponse: () => ({ status: 403, body: { error: "Not allowed." } }),
}));

jest.mock("@/server/services/orderbookSnapshot", () => ({
  buildPublicOrderbookSnapshot: (...args: unknown[]) => buildPublicOrderbookSnapshot(...args),
}));

import { GET as getOrderbook } from "@/app/api/orderbook/[marketId]/book/route";

const forbiddenFieldNames = [
  "privateKey",
  "secret",
  "token",
  "credential",
  "ownerId",
  "userId",
  "orderOwnerId",
  "positionId",
  "balanceId",
  "ledgerEntryId",
];

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
  }
  return [];
};

describe("public orderbook book API no-leak checks", () => {
  beforeEach(() => {
    getUserId.mockReset();
    assertMarketVisibleToUser.mockReset();
    assertMarketMechanism.mockReset();
    buildPublicOrderbookSnapshot.mockReset();
    mockPrisma.market.findUnique.mockReset();

    getUserId.mockResolvedValue(null);
    assertMarketVisibleToUser.mockResolvedValue(undefined);
    mockPrisma.market.findUnique.mockResolvedValue({
      id: "market-1",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      ownerId: null,
    });
    buildPublicOrderbookSnapshot.mockResolvedValue({
      bids: [{ outcomeId: "home", price: 0.57, size: 120 }],
      asks: [{ outcomeId: "home", price: 0.6, size: 90 }],
    });
  });

  test("GET /api/orderbook/[marketId]/book returns mobile depth levels without sensitive keys", async () => {
    const response = await getOrderbook(new NextRequest("http://localhost/api/orderbook/market-1/book?outcomeId=home&maxLevels=25"), {
      params: Promise.resolve({ marketId: "market-1" }),
    });

    expect(response.status).toBe(200);
    expect(assertMarketMechanism).toHaveBeenCalledWith("ORDERBOOK", "ORDERBOOK");
    expect(assertMarketVisibleToUser).toHaveBeenCalledWith(
      expect.objectContaining({
        market: expect.objectContaining({ id: "market-1" }),
        userId: null,
      }),
    );
    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledWith({
      marketId: "market-1",
      outcomeId: "home",
      maxLevels: 25,
    });

    const body = await response.json();
    expect(body).toMatchObject({
      marketId: "market-1",
      outcomeId: "home",
      emptyState: null,
      bids: [{ outcomeId: "home", price: 0.57, size: 120 }],
      asks: [{ outcomeId: "home", price: 0.6, size: 90 }],
      levels: [
        { outcomeId: "home", side: "bid", price: 0.57, shares: 120, total: 68.4 },
        { outcomeId: "home", side: "ask", price: 0.6, shares: 90, total: 54 },
      ],
    });
    expect(body.generatedAt).toEqual(expect.any(String));
    const keys = collectKeys(body);
    for (const forbidden of forbiddenFieldNames) {
      expect(keys).not.toContain(forbidden);
    }
  });

  test("GET /api/orderbook/[marketId]/book returns no-depth empty state", async () => {
    buildPublicOrderbookSnapshot.mockResolvedValue({ bids: [], asks: [] });

    const response = await getOrderbook(new NextRequest("http://localhost/api/orderbook/market-1/book?maxLevels=999"), {
      params: Promise.resolve({ marketId: "market-1" }),
    });

    expect(response.status).toBe(200);
    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledWith({
      marketId: "market-1",
      outcomeId: null,
      maxLevels: 200,
    });
    await expect(response.json()).resolves.toMatchObject({
      marketId: "market-1",
      outcomeId: null,
      emptyState: "no-depth",
      levels: [],
      bids: [],
      asks: [],
    });
  });

  test("GET /api/orderbook/[marketId]/book keeps guarded errors public", async () => {
    assertMarketVisibleToUser.mockRejectedValue(new Error("hidden"));

    const response = await getOrderbook(new NextRequest("http://localhost/api/orderbook/market-1/book"), {
      params: Promise.resolve({ marketId: "market-1" }),
    });

    expect(response.status).toBe(403);
    expect(buildPublicOrderbookSnapshot).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "Not allowed." });
  });
});

