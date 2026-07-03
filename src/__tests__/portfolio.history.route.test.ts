import { NextRequest } from "next/server";

const mockGetUserId = jest.fn();
const mockRequireCanonicalActor = jest.fn();

const mockPrisma = {
  trade: {
    findMany: jest.fn(),
  },
  ledgerEntry: {
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  getUserId: () => mockGetUserId(),
}));

jest.mock("@/lib/canonicalAuth", () => ({
  requireCanonicalActor: (...args: unknown[]) => mockRequireCanonicalActor(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

describe("GET /api/portfolio/history canceled orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserId.mockResolvedValue("session-user-1");
    mockRequireCanonicalActor.mockResolvedValue({ userId: "api-user-1" });
    mockPrisma.trade.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "trade-1",
          side: "BUY",
          shares: 200,
          cost: 100,
          fee: 0,
          createdAt: new Date("2026-07-02T06:10:00.000Z"),
          market: {
            id: "market-world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
            marketGroupKey: "live-game-lines",
            marketType: "match_winner_1x2",
            line: null,
            period: "regulation",
          },
          outcome: {
            id: "yes",
            name: "YES",
            label: "France",
            side: "home",
          },
        },
      ]);
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "order-canceled-1",
        side: "BUY",
        status: "CANCELED",
        price: 0.5,
        amount: 200,
        remaining: 100,
        updatedAt: new Date("2026-07-02T05:55:00.000Z"),
        market: {
          id: "market-world-cup-winner",
          title: "Will France win the 2026 FIFA World Cup?",
          status: "LIVE",
          marketGroupKey: "live-game-lines",
          marketType: "spread",
          line: { toString: () => "+0.5" },
          period: "regulation",
        },
        outcome: {
          id: "yes",
          name: "YES",
          label: "France +0.5",
          side: "home",
        },
        apiOrderRequest: {
          requestBody: {
            selection: {
              marketType: "spread",
              line: "+0.5",
              period: "regulation",
              displayLabel: "France +0.5",
            },
            contractSide: "YES",
          },
        },
      },
    ]);
  });

  test("returns API-key actor canceled orders and recent trades beside resolved history", async () => {
    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(
      new NextRequest("http://localhost/api/portfolio/history", {
        headers: { Authorization: "Bearer pk_live_test.secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockRequireCanonicalActor).toHaveBeenCalledWith(expect.any(NextRequest), ["account:read"]);
    expect(mockGetUserId).not.toHaveBeenCalled();
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "api-user-1",
          status: "CANCELED",
        },
        take: 50,
      }),
    );
    expect(mockPrisma.trade.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          userId: "api-user-1",
        },
        take: 50,
      }),
    );
    expect(body).toEqual({
      history: [],
      canceledOrders: [
        {
          id: "order-canceled-1",
          market: expect.objectContaining({
            id: "market-world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          }),
          outcome: expect.objectContaining({
            id: "yes",
            name: "YES",
          }),
          selection: {
            marketId: "market-world-cup-winner",
            outcomeId: "yes",
            marketGroupId: "live-game-lines",
            marketType: "spread",
            line: "+0.5",
            period: "regulation",
            side: "home",
            displayLabel: "France +0.5",
            contractSide: "yes",
          },
          side: "BUY",
          status: "CANCELED",
          price: 0.5,
          size: 200,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ],
      recentTrades: [
        {
          id: "trade-1",
          market: expect.objectContaining({
            id: "market-world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          }),
          outcome: expect.objectContaining({
            id: "yes",
            name: "YES",
          }),
          selection: {
            marketId: "market-world-cup-winner",
            outcomeId: "yes",
            marketGroupId: "live-game-lines",
            marketType: "match_winner_1x2",
            period: "regulation",
            side: "home",
            displayLabel: "France regulation",
          },
          side: "BUY",
          shares: 200,
          cost: 100,
          fee: 0,
          createdAt: "2026-07-02T06:10:00.000Z",
        },
      ],
    });
  });

  test("blocks anonymous history reads before canceled-order lookup", async () => {
    mockGetUserId.mockResolvedValue(null);

    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/history"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockPrisma.trade.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
  });
});
