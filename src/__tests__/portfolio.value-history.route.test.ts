import { NextRequest } from "next/server";

const mockGetUserId = jest.fn();
const mockRequireCanonicalActor = jest.fn();

const mockPrisma = {
  userBalance: {
    findUnique: jest.fn(),
  },
  position: {
    findMany: jest.fn(),
  },
  marketOutcomeSnapshot: {
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

describe("GET /api/portfolio/value-history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-07-04T12:00:00.000Z"));
    mockGetUserId.mockResolvedValue("session-user-1");
    mockRequireCanonicalActor.mockResolvedValue({ userId: "api-user-1" });
    mockPrisma.userBalance.findUnique.mockResolvedValue({
      availableUSDC: 8.35,
      lockedUSDC: 1.65,
    });
    mockPrisma.position.findMany.mockResolvedValue([
      {
        marketId: "market-france-advance",
        outcomeId: "outcome-france-yes",
        shares: 100,
        avgCost: 0.84,
      },
    ]);
    mockPrisma.marketOutcomeSnapshot.findMany.mockResolvedValue([
      {
        marketId: "market-france-advance",
        outcomeId: "outcome-france-yes",
        ts: new Date("2026-07-04T00:00:00.000Z"),
        price: 0.91,
      },
      {
        marketId: "market-france-advance",
        outcomeId: "outcome-france-yes",
        ts: new Date("2026-07-04T12:00:00.000Z"),
        price: 0.96,
      },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns route-shaped value history for a session user", async () => {
    const { GET } = await import("@/app/api/portfolio/value-history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/value-history?range=1D"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.userBalance.findUnique).toHaveBeenCalledWith({ where: { userId: "session-user-1" } });
    expect(mockPrisma.position.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "session-user-1", shares: { not: 0 } },
      }),
    );
    expect(mockPrisma.marketOutcomeSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ marketId: "market-france-advance", outcomeId: "outcome-france-yes" }],
        }),
      }),
    );
    expect(body).toEqual(
      expect.objectContaining({
        range: "1D",
        ranges: ["1D", "1W", "1M", "All"],
        source: "portfolio-value-history-route",
        status: "ready",
        generatedAt: "2026-07-04T12:00:00.000Z",
        lastUpdated: "2026-07-04T12:00:00.000Z",
        emptyState: null,
      }),
    );
    expect(body.points).toHaveLength(6);
    expect(body.points.at(-1)).toEqual({
      timestamp: "2026-07-04T12:00:00.000Z",
      value: 106,
      cash: 10,
      positionsValue: 96,
      pnl: 12,
    });
  });

  test("uses canonical API-key actor for mobile server-mode reads", async () => {
    const { GET } = await import("@/app/api/portfolio/value-history/route");
    const response = await GET(
      new NextRequest("http://localhost/api/portfolio/value-history?range=1W", {
        headers: { Authorization: "Bearer pk_live_test.secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockRequireCanonicalActor).toHaveBeenCalledWith(expect.any(NextRequest), ["account:read"]);
    expect(mockGetUserId).not.toHaveBeenCalled();
    expect(mockPrisma.userBalance.findUnique).toHaveBeenCalledWith({ where: { userId: "api-user-1" } });
  });

  test("rejects invalid ranges before querying account state", async () => {
    const { GET } = await import("@/app/api/portfolio/value-history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/value-history?range=bad"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid range");
    expect(mockPrisma.userBalance.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.position.findMany).not.toHaveBeenCalled();
  });

  test("blocks anonymous users", async () => {
    mockGetUserId.mockResolvedValue(null);

    const { GET } = await import("@/app/api/portfolio/value-history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/value-history"));

    expect(response.status).toBe(401);
    expect(mockPrisma.userBalance.findUnique).not.toHaveBeenCalled();
  });
});
