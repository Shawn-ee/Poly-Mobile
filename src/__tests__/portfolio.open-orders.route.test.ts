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
  comboOrder: {
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
    prismaMock.comboOrder.findMany.mockResolvedValue([]);
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

  test("returns sanitized current-user open combo orders", async () => {
    getUserId.mockResolvedValue("user-1");
    prismaMock.comboOrder.findMany.mockResolvedValue([
      {
        id: "combo-1",
        status: "OPEN",
        stakeUSDC: 10,
        comboPrice: 0.2,
        potentialPayout: 50,
        idempotencyKey: "private-idem",
        requestFingerprint: "private-fingerprint",
        createdAt: new Date("2026-06-25T12:00:00Z"),
        updatedAt: new Date("2026-06-25T12:01:00Z"),
        legs: [
          {
            id: "leg-1",
            market: { id: "market-1", title: "Ecuador vs Germany winner", status: "LIVE" },
            outcome: { id: "outcome-1", name: "Ecuador", label: "ECU", side: "team_a", code: "ECU" },
            price: 0.5,
            line: null,
            label: "ECU",
            displayOrder: 0,
          },
        ],
      },
    ]);

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.comboOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          status: "OPEN",
        },
      }),
    );
    expect(body.comboOrders).toEqual([
      expect.objectContaining({
        id: "combo-1",
        status: "OPEN",
        stakeUSDC: 10,
        comboPrice: 0.2,
        potentialPayout: 50,
        legs: [
          expect.objectContaining({
            market: { id: "market-1", title: "Ecuador vs Germany winner", status: "LIVE" },
            outcome: { id: "outcome-1", name: "ECU", side: "team_a", code: "ECU" },
          }),
        ],
      }),
    ]);
    expect(JSON.stringify(body.comboOrders)).not.toContain("private-idem");
    expect(JSON.stringify(body.comboOrders)).not.toContain("private-fingerprint");
  });
});
