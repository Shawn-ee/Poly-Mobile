import { NextRequest } from "next/server";

const getUserId = jest.fn();
const getOutcomeMidPrices = jest.fn();

const prismaMock = {
  position: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  userBalance: {
    findUnique: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  getUserId: () => getUserId(),
}));

jest.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

jest.mock("@/lib/orderbookPricing", () => ({
  getOutcomeMidPrices: (...args: unknown[]) => getOutcomeMidPrices(...args),
}));

describe("GET /api/portfolio open order display data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOutcomeMidPrices.mockResolvedValue(new Map());
    prismaMock.position.findMany.mockResolvedValue([]);
    prismaMock.position.aggregate.mockResolvedValue({ _sum: { realizedPnl: 0 } });
    prismaMock.userBalance.findUnique.mockResolvedValue({
      availableUSDC: 75,
      lockedUSDC: 25,
    });
    prismaMock.order.findMany.mockResolvedValue([]);
  });

  test("blocks anonymous users", async () => {
    getUserId.mockResolvedValue(null);

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio"));

    expect(response.status).toBe(401);
    expect(prismaMock.order.findMany).not.toHaveBeenCalled();
  });

  test("returns sanitized current-user open orders and locked balance", async () => {
    getUserId.mockResolvedValue("user-1");
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        market: { id: "market-1", title: "Lakers vs Warriors", status: "LIVE" },
        outcome: { id: "outcome-1", name: "Lakers" },
        side: "BUY",
        status: "OPEN",
        price: 0.55,
        amount: 10,
        remaining: 4,
        reservedNotional: 2.2,
        createdAt: new Date("2026-06-24T12:00:00Z"),
        updatedAt: new Date("2026-06-24T12:01:00Z"),
        createdApiCredentialId: "cred-private",
      },
    ]);

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          status: { in: ["OPEN", "PARTIAL"] },
        },
      }),
    );
    expect(body.walletAvailableUSDC).toBe(75);
    expect(body.walletLockedUSDC).toBe(25);
    expect(body.openOrders).toEqual([
      expect.objectContaining({
        id: "order-1",
        market: { id: "market-1", title: "Lakers vs Warriors", status: "LIVE" },
        outcome: { id: "outcome-1", name: "Lakers" },
        side: "BUY",
        status: "OPEN",
        price: 0.55,
        size: 10,
        remaining: 4,
        reservedNotional: 2.2,
      }),
    ]);
    expect(JSON.stringify(body.openOrders)).not.toContain("cred-private");
    expect(JSON.stringify(body.openOrders)).not.toContain("createdApiCredential");
  });
});
