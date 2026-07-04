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

const mockMarket = (overrides: Record<string, unknown> = {}) => ({
  id: "market-1",
  title: "Curacao vs Cote d'Ivoire: Match Winner",
  mechanism: "ORDERBOOK",
  visibility: "PUBLIC",
  ownerId: null,
  status: "LIVE",
  sourceUpdatedAt: new Date(),
  updatedAt: new Date(),
  marketType: "match_winner_1x2",
  marketGroupKey: "main",
  marketGroupTitle: "Match Winner",
  displayOrder: 0,
  line: null,
  unit: null,
  period: "full-game",
  outcomes: [
    { id: "home", name: "Curacao", label: "Curacao", side: "home", displayOrder: 0, isTradable: true },
    { id: "away", name: "Cote d'Ivoire", label: "Cote d'Ivoire", side: "away", displayOrder: 1, isTradable: true },
  ],
  ...overrides,
});

describe("public orderbook book API no-leak checks", () => {
  beforeEach(() => {
    getUserId.mockReset();
    assertMarketVisibleToUser.mockReset();
    assertMarketMechanism.mockReset();
    buildPublicOrderbookSnapshot.mockReset();
    mockPrisma.market.findUnique.mockReset();

    getUserId.mockResolvedValue(null);
    assertMarketVisibleToUser.mockResolvedValue(undefined);
    mockPrisma.market.findUnique.mockResolvedValue(mockMarket());
    buildPublicOrderbookSnapshot.mockResolvedValue({
      bids: [{ outcomeId: "home", price: 0.57, size: 120 }],
      asks: [{ outcomeId: "home", price: 0.6, size: 90 }],
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "ready",
        snapshotCount: 2,
        latestFetchedAt: "2026-07-03T22:00:10.000Z",
        latestUpdatedAt: "2026-07-03T22:00:11.000Z",
        stalenessSeconds: 10,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:01:10.000Z",
        shouldRefresh: false,
        refreshKey: "polymarket:2026-07-03T22:00:10.000Z",
        isStale: false,
        acceptingOrders: true,
        outcomeIds: ["away", "home"],
        sources: ["polymarket"],
        reason: "Provider quote snapshot is fresh.",
      },
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
      marketIdentity: {
        source: "market-route-contract",
        marketId: "market-1",
        title: "Curacao vs Cote d'Ivoire: Match Winner",
        selectorKey: "main:full-game:default",
        marketFamily: "moneyline",
        marketType: "match_winner_1x2",
        marketGroupKey: "main",
        marketGroupId: "main",
        marketGroupTitle: "Match Winner",
        displayOrder: 0,
        period: "full-game",
        line: null,
        unit: null,
        displayUnits: {
          price: "probability",
          priceFormat: "cents",
          shares: "shares",
          total: "notional",
          line: null,
        },
        outcomeCount: 2,
        tradableOutcomeCount: 2,
        outcomes: [
          { id: "home", name: "Curacao", label: "Curacao", side: "home", displayOrder: 0, isTradable: true },
          { id: "away", name: "Cote d'Ivoire", label: "Cote d'Ivoire", side: "away", displayOrder: 1, isTradable: true },
        ],
      },
      availability: {
        source: "market-source-updated-at",
        status: "ready",
        marketStatus: "LIVE",
        staleAfterSeconds: 90,
        isStale: false,
        isSuspended: false,
        isDelayed: false,
        reason: "Selected market is live and fresh.",
      },
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "ready",
        snapshotCount: 2,
        latestFetchedAt: "2026-07-03T22:00:10.000Z",
        latestUpdatedAt: "2026-07-03T22:00:11.000Z",
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-03T22:01:10.000Z",
        shouldRefresh: false,
        refreshKey: "polymarket:2026-07-03T22:00:10.000Z",
        isStale: false,
        acceptingOrders: true,
        outcomeIds: ["away", "home"],
        sources: ["polymarket"],
        reason: "Provider quote snapshot is fresh.",
      },
      emptyState: null,
      bids: [{ outcomeId: "home", price: 0.57, size: 120 }],
      asks: [{ outcomeId: "home", price: 0.6, size: 90 }],
      levels: [
        { outcomeId: "home", side: "bid", price: 0.57, shares: 120, total: 68.4, value: 68.4 },
        { outcomeId: "home", side: "ask", price: 0.6, shares: 90, total: 54, value: 54 },
      ],
    });
    expect(body.generatedAt).toEqual(expect.any(String));
    expect(body.availability.lastUpdated).toEqual(expect.any(String));
    expect(body.availability.stalenessSeconds).toEqual(expect.any(Number));
    const keys = collectKeys(body);
    for (const forbidden of forbiddenFieldNames) {
      expect(keys).not.toContain(forbidden);
    }
  });

  test("GET /api/orderbook/[marketId]/book returns provider-backed ready depth with selector identity", async () => {
    buildPublicOrderbookSnapshot.mockResolvedValue({
      bids: [
        { outcomeId: "home", price: 0.57, size: 1200 },
        { outcomeId: "away", price: 0.41, size: 900 },
      ],
      asks: [
        { outcomeId: "home", price: 0.6, size: 1100 },
        { outcomeId: "away", price: 0.44, size: 850 },
      ],
      depthSource: "provider-orderbook-depth",
      depthReason: "Depth comes from provider orderbook ladder snapshots.",
      providerOrderbookDepth: {
        source: "reference-orderbook-depth-snapshot",
        status: "ready",
        levelCount: 4,
        snapshotCount: 4,
        latestFetchedAt: "2026-07-04T12:00:00.000Z",
        latestUpdatedAt: "2026-07-04T12:00:01.000Z",
        stalenessSeconds: 5,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-04T12:01:00.000Z",
        shouldRefresh: false,
        isStale: false,
        sources: ["polymarket-clob"],
        reason: "Provider orderbook depth snapshot is fresh.",
      },
      providerQuoteDepth: {
        source: "reference-quote-snapshot",
        levelCount: 0,
        sizeSource: null,
        isEstimatedSize: false,
        reason: "Provider orderbook ladder depth is preferred.",
      },
      providerQuoteSnapshot: {
        source: "reference-quote-snapshot",
        status: "ready",
        snapshotCount: 2,
        latestFetchedAt: "2026-07-04T12:00:00.000Z",
        latestUpdatedAt: "2026-07-04T12:00:01.000Z",
        stalenessSeconds: 5,
        staleAfterSeconds: 90,
        refreshTtlSeconds: 60,
        nextRefreshAt: "2026-07-04T12:01:00.000Z",
        shouldRefresh: false,
        refreshKey: "polymarket:2026-07-04T12:00:00.000Z",
        isStale: false,
        acceptingOrders: true,
        outcomeIds: ["away", "home"],
        sources: ["polymarket"],
        reason: "Provider quote snapshot is fresh.",
      },
    });

    const response = await getOrderbook(new NextRequest("http://localhost/api/orderbook/market-1/book?maxLevels=24"), {
      params: Promise.resolve({ marketId: "market-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      marketIdentity: {
        selectorKey: "main:full-game:default",
        marketFamily: "moneyline",
        marketType: "match_winner_1x2",
        outcomeCount: 2,
      },
      depthSource: "provider-orderbook-depth",
      providerOrderbookDepth: {
        status: "ready",
        levelCount: 4,
        sources: ["polymarket-clob"],
      },
      emptyState: null,
      levels: [
        { outcomeId: "home", side: "bid", price: 0.57, shares: 1200, total: 684, value: 684 },
        { outcomeId: "away", side: "bid", price: 0.41, shares: 900, total: 369, value: 369 },
        { outcomeId: "home", side: "ask", price: 0.6, shares: 1100, total: 660, value: 660 },
        { outcomeId: "away", side: "ask", price: 0.44, shares: 850, total: 374, value: 374 },
      ],
    });
    expect(body.levels).toHaveLength(4);
    for (const level of body.levels) {
      expect(level).toEqual(expect.objectContaining({
        price: expect.any(Number),
        shares: expect.any(Number),
        total: expect.any(Number),
        value: expect.any(Number),
      }));
    }
    const keys = collectKeys(body);
    for (const forbidden of forbiddenFieldNames) {
      expect(keys).not.toContain(forbidden);
    }
  });

  test.each([
    {
      name: "moneyline",
      market: mockMarket(),
      expected: {
        selectorKey: "main:full-game:default",
        marketFamily: "moneyline",
        marketType: "match_winner_1x2",
        marketGroupKey: "main",
        marketGroupTitle: "Match Winner",
        period: "full-game",
        line: null,
        unit: null,
      },
    },
    {
      name: "spread",
      market: mockMarket({
        title: "Curacao +1.5",
        marketType: "spread",
        marketGroupKey: "spreads",
        marketGroupTitle: "Spread",
        displayOrder: 10,
        line: { toString: () => "1.5" },
        unit: "goals",
      }),
      expected: {
        selectorKey: "spreads:full-game:1.5",
        marketFamily: "spread",
        marketType: "spread",
        marketGroupKey: "spreads",
        marketGroupTitle: "Spread",
        period: "full-game",
        line: "1.5",
        unit: "goals",
      },
    },
    {
      name: "totals",
      market: mockMarket({
        title: "Total goals 2.5",
        marketType: "total_goals",
        marketGroupKey: "totals",
        marketGroupTitle: "Totals",
        displayOrder: 20,
        line: { toString: () => "2.5" },
        unit: "goals",
        outcomes: [
          { id: "over", name: "Over", label: "Over 2.5", side: "over", displayOrder: 0, isTradable: true },
          { id: "under", name: "Under", label: "Under 2.5", side: "under", displayOrder: 1, isTradable: true },
        ],
      }),
      expected: {
        selectorKey: "totals:full-game:2.5",
        marketFamily: "total",
        marketType: "total_goals",
        marketGroupKey: "totals",
        marketGroupTitle: "Totals",
        period: "full-game",
        line: "2.5",
        unit: "goals",
      },
    },
  ])("GET /api/orderbook/[marketId]/book exposes selector-ready identity for $name", async ({ market, expected }) => {
    mockPrisma.market.findUnique.mockResolvedValue(market);

    const response = await getOrderbook(new NextRequest("http://localhost/api/orderbook/market-1/book?maxLevels=5"), {
      params: Promise.resolve({ marketId: "market-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.marketIdentity).toMatchObject({
      source: "market-route-contract",
      marketId: "market-1",
      ...expected,
      displayUnits: {
        price: "probability",
        priceFormat: "cents",
        shares: "shares",
        total: "notional",
        line: expected.unit,
      },
      outcomeCount: market.outcomes.length,
      tradableOutcomeCount: market.outcomes.length,
    });
    expect(body.marketIdentity.outcomes).toEqual(
      market.outcomes.map((outcome: { id: string; name: string; label: string | null; side: string | null; displayOrder: number; isTradable: boolean }) => ({
        id: outcome.id,
        name: outcome.name,
        label: outcome.label ?? outcome.name,
        side: outcome.side,
        displayOrder: outcome.displayOrder,
        isTradable: outcome.isTradable,
      })),
    );
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

  test("GET /api/orderbook/[marketId]/book exposes suspended market availability", async () => {
    mockPrisma.market.findUnique.mockResolvedValue(mockMarket({
      status: "PAUSED",
      sourceUpdatedAt: null,
      updatedAt: new Date("2026-07-03T22:00:00.000Z"),
    }));

    const response = await getOrderbook(new NextRequest("http://localhost/api/orderbook/market-1/book"), {
      params: Promise.resolve({ marketId: "market-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      marketId: "market-1",
      availability: {
        source: "market-updated-at",
        status: "suspended",
        marketStatus: "PAUSED",
        lastUpdated: "2026-07-03T22:00:00.000Z",
        isSuspended: true,
        reason: "Selected market is paused or suspended.",
      },
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
