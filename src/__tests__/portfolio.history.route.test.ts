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
          marketId: "market-world-cup-winner",
          outcomeId: "yes",
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
            referenceSource: "polymarket",
            externalSlug: "world-cup-2026-france-winner",
            externalMarketId: "gamma-market-france",
            conditionId: "condition-france",
          },
          outcome: {
            id: "yes",
            name: "YES",
            label: "France",
            side: "home",
            referenceTokenId: "token-france",
            referenceOutcomeLabel: "France",
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "trade-1",
          marketId: "market-world-cup-winner",
          outcomeId: "yes",
          side: "BUY",
          shares: 200,
          cost: 100,
          fee: 0,
          createdAt: new Date("2026-07-02T06:10:00.000Z"),
        },
      ]);
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany
      .mockResolvedValueOnce([
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
            referenceSource: "polymarket",
            externalSlug: "france-world-cup-spread",
            externalMarketId: "gamma-market-france-spread",
            conditionId: "condition-france-spread",
          },
          outcome: {
            id: "yes",
            name: "YES",
            label: "France +0.5",
            side: "home",
            referenceTokenId: "token-france-spread",
            referenceOutcomeLabel: "France +0.5",
          },
          apiOrderRequest: {
            requestBody: {
              selection: {
                marketType: "spread",
                line: "+0.5",
                period: "regulation",
                displayLabel: "France +0.5",
                providerSource: "polymarket",
                externalMarketId: "gamma-market-france-spread",
                conditionId: "condition-france-spread",
                tokenId: "token-france-spread",
              },
              contractSide: "YES",
            },
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          marketId: "market-world-cup-winner",
          outcomeId: "yes",
          apiOrderRequest: {
            requestBody: {
              selection: {
                marketId: "market-world-cup-winner",
                outcomeId: "yes",
                marketGroupId: "spreads",
                marketType: "spread",
                line: "+0.5",
                period: "regulation",
                side: "yes",
                displayLabel: "France +0.5 regulation",
                contractSide: "yes",
                providerSource: "polymarket",
                externalMarketId: "gamma-market-france-spread",
                conditionId: "condition-france-spread",
                tokenId: "token-france-spread",
                referenceOutcomeLabel: "France +0.5",
              },
            },
          },
        },
      ]);
  });

  test("returns API-key actor canceled orders and recent trades beside resolved history", async () => {
    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(
      new NextRequest("http://localhost/api/portfolio/history", {
        headers: { Authorization: "Bearer test-api-key-fixture" },
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
    expect(mockPrisma.trade.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          userId: "api-user-1",
        },
        take: 50,
      }),
    );
    expect(mockPrisma.trade.findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          userId: "api-user-1",
          OR: [{ marketId: "market-world-cup-winner", outcomeId: "yes" }],
        },
        select: expect.objectContaining({
          id: true,
          marketId: true,
          outcomeId: true,
          side: true,
          shares: true,
          cost: true,
          fee: true,
        }),
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
            referenceSource: "polymarket",
            providerSource: "polymarket",
            externalSlug: "france-world-cup-spread",
            externalMarketId: "gamma-market-france-spread",
            conditionId: "condition-france-spread",
            referenceTokenId: "token-france-spread",
            tokenId: "token-france-spread",
            referenceOutcomeLabel: "France +0.5",
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
            marketGroupId: "spreads",
            marketType: "spread",
            line: "+0.5",
            period: "regulation",
            side: "yes",
            displayLabel: "France +0.5 regulation",
            contractSide: "yes",
            referenceSource: "polymarket",
            providerSource: "polymarket",
            externalSlug: "world-cup-2026-france-winner",
            externalMarketId: "gamma-market-france-spread",
            conditionId: "condition-france-spread",
            referenceTokenId: "token-france-spread",
            tokenId: "token-france-spread",
            referenceOutcomeLabel: "France +0.5",
          },
          side: "BUY",
          shares: 200,
          cost: 100,
          fee: 0,
          proceedsTokens: null,
          realizedPnlTokens: null,
          createdAt: "2026-07-02T06:10:00.000Z",
        },
      ],
      selectionSourceSummary: {
        canceledOrders: expect.objectContaining({
          totalSelectionCount: 1,
          polymarketSelectionCount: 1,
          lineMarkets: expect.objectContaining({
            totalCount: 1,
            polymarketCount: 1,
            status: "provider-backed",
            families: ["spread"],
          }),
        }),
        recentTrades: expect.objectContaining({
          totalSelectionCount: 1,
          polymarketSelectionCount: 1,
          lineMarkets: expect.objectContaining({
            totalCount: 1,
            polymarketCount: 1,
            status: "provider-backed",
            families: ["spread"],
          }),
        }),
        combined: expect.objectContaining({
          totalSelectionCount: 2,
          polymarketSelectionCount: 2,
          lineMarkets: expect.objectContaining({
            totalCount: 2,
            polymarketCount: 2,
            status: "provider-backed",
            families: ["spread"],
          }),
        }),
      },
    });
  });

  test("keeps canceled and recent-trade snapshots after current market metadata changes", async () => {
    mockPrisma.trade.findMany.mockReset();
    mockPrisma.order.findMany.mockReset();
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);

    const snapshot = {
      marketId: "market-ef-spread",
      outcomeId: "outcome-ef-spread-yes",
      marketGroupId: "spreads",
      marketType: "spread",
      line: "-0.5",
      period: "2H",
      side: "yes",
      displayLabel: "Spain -0.5 2H",
      contractSide: "yes",
      referenceSource: "polymarket",
      providerSource: "polymarket",
      externalSlug: "ef-spain-japan-spread-original",
      externalMarketId: "gamma-ef-spread-original",
      conditionId: "condition-ef-spread-original",
      referenceTokenId: "token-ef-spread-yes-original",
      tokenId: "token-ef-spread-yes-original",
      referenceOutcomeLabel: "Spain -0.5",
      limitPrice: 0.44,
      limitSide: "ask",
      limitShares: 125.5,
    };
    const driftedMarket = {
      id: "market-ef-spread",
      title: "Spain vs Japan: Spread",
      event: { title: "Spain vs Japan", slug: "spain-vs-japan" },
      status: "LIVE",
      marketGroupKey: "moneyline",
      marketType: "match_winner_1x2",
      line: null,
      period: "regulation",
      referenceSource: "refreshed-provider",
      externalSlug: "ef-moneyline-refreshed",
      externalMarketId: "gamma-ef-moneyline-refreshed",
      conditionId: "condition-ef-moneyline-refreshed",
    };
    const driftedOutcome = {
      id: "outcome-ef-spread-yes",
      name: "YES",
      label: "Spain moneyline refreshed",
      side: "home",
      referenceTokenId: "token-ef-moneyline-yes-refreshed",
      referenceOutcomeLabel: "Spain moneyline",
    };

    mockPrisma.trade.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "trade-ef-filled",
          marketId: "market-ef-spread",
          outcomeId: "outcome-ef-spread-yes",
          side: "BUY",
          shares: 12,
          cost: 5.28,
          fee: 0,
          createdAt: new Date("2026-07-04T12:10:00.000Z"),
          market: driftedMarket,
          outcome: driftedOutcome,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "trade-ef-filled",
          marketId: "market-ef-spread",
          outcomeId: "outcome-ef-spread-yes",
          side: "BUY",
          shares: 12,
          cost: 5.28,
          fee: 0,
          createdAt: new Date("2026-07-04T12:10:00.000Z"),
        },
      ]);
    mockPrisma.order.findMany
      .mockResolvedValueOnce([
        {
          id: "order-ef-canceled",
          side: "BUY",
          status: "CANCELED",
          price: 0.32,
          amount: 10,
          remaining: 10,
          updatedAt: new Date("2026-07-04T12:06:00.000Z"),
          market: driftedMarket,
          outcome: driftedOutcome,
          apiOrderRequest: { requestBody: { selection: snapshot } },
        },
      ])
      .mockResolvedValueOnce([
        {
          marketId: "market-ef-spread",
          outcomeId: "outcome-ef-spread-yes",
          apiOrderRequest: { requestBody: { selection: snapshot } },
        },
      ]);

    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/history"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.canceledOrders[0].selection).toEqual(snapshot);
    expect(body.recentTrades[0].selection).toEqual(snapshot);
    expect(JSON.stringify(body.canceledOrders[0].selection)).not.toContain("moneyline");
    expect(JSON.stringify(body.recentTrades[0].selection)).not.toContain("refreshed");
    expect(body.canceledOrders[0].selection.tokenId).toBe("token-ef-spread-yes-original");
    expect(body.recentTrades[0].selection.marketGroupId).toBe("spreads");
    expect(body.canceledOrders[0].market).toMatchObject({
      eventTitle: "Spain vs Japan",
      eventSlug: "spain-vs-japan",
      displayTitle: "Spread",
    });
    expect(body.recentTrades[0].market).toMatchObject({
      eventTitle: "Spain vs Japan",
      eventSlug: "spain-vs-japan",
      displayTitle: "Spread",
    });
    expect(body.canceledOrders[0].selection.limitPrice).toBe(0.44);
    expect(body.recentTrades[0].selection.limitSide).toBe("ask");
    expect(body.recentTrades[0].selection.limitShares).toBe(125.5);
    expect(body.selectionSourceSummary.combined).toMatchObject({
      totalSelectionCount: 2,
      polymarketSelectionCount: 2,
      lineMarkets: {
        totalCount: 2,
        polymarketCount: 2,
        status: "provider-backed",
        families: ["spread"],
      },
    });
  });

  test("keeps bid-side Sell totals limit identity in canceled and recent trade history", async () => {
    mockPrisma.trade.findMany.mockReset();
    mockPrisma.order.findMany.mockReset();
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);

    const sellBidTotalsSelection = {
      marketId: "market-eo-totals",
      outcomeId: "outcome-eo-over",
      marketGroupId: "totals",
      marketType: "total_goals",
      line: "3.5",
      period: "2H",
      side: "over",
      displayLabel: "Over 3.5 2H",
      contractSide: "yes",
      referenceSource: "polymarket",
      providerSource: "polymarket",
      externalSlug: "eo-route-breadth-total-35",
      externalMarketId: "gamma-eo-route-breadth-total-35",
      conditionId: "condition-eo-route-breadth-total-35",
      referenceTokenId: "token-eo-over-35",
      tokenId: "token-eo-over-35",
      referenceOutcomeLabel: "Over 3.5",
      limitPrice: 0.59,
      limitSide: "bid",
      limitShares: 480,
    };
    const normalizedSellBidTotalsSelection = {
      ...sellBidTotalsSelection,
      marketType: "totals",
    };
    const totalsMarket = {
      id: "market-eo-totals",
      title: "Route Home vs Route Away total goals",
      status: "LIVE",
      marketGroupKey: "totals",
      marketType: "total_goals",
      line: { toString: () => "3.5" },
      period: "2H",
      referenceSource: "polymarket",
      externalSlug: "eo-route-breadth-total-35",
      externalMarketId: "gamma-eo-route-breadth-total-35",
      conditionId: "condition-eo-route-breadth-total-35",
    };
    const totalsOutcome = {
      id: "outcome-eo-over",
      name: "Over",
      label: "Over 3.5 2H",
      side: "over",
      referenceTokenId: "token-eo-over-35",
      referenceOutcomeLabel: "Over 3.5",
    };

    mockPrisma.trade.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "trade-eo-sell-filled",
          marketId: "market-eo-totals",
          outcomeId: "outcome-eo-over",
          side: "SELL",
          shares: 12,
          cost: 7.08,
          fee: 0,
          createdAt: new Date("2026-07-04T13:10:00.000Z"),
          market: totalsMarket,
          outcome: totalsOutcome,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "trade-eo-buy-filled",
          marketId: "market-eo-totals",
          outcomeId: "outcome-eo-over",
          side: "BUY",
          shares: 20,
          cost: 8.8,
          fee: 0,
          createdAt: new Date("2026-07-04T13:00:00.000Z"),
        },
        {
          id: "trade-eo-sell-filled",
          marketId: "market-eo-totals",
          outcomeId: "outcome-eo-over",
          side: "SELL",
          shares: 12,
          cost: 7.08,
          fee: 0,
          createdAt: new Date("2026-07-04T13:10:00.000Z"),
        },
      ]);
    mockPrisma.order.findMany
      .mockResolvedValueOnce([
        {
          id: "order-eo-canceled-sell",
          side: "SELL",
          status: "CANCELED",
          price: 0.59,
          amount: 10,
          remaining: 10,
          updatedAt: new Date("2026-07-04T13:06:00.000Z"),
          market: totalsMarket,
          outcome: totalsOutcome,
          apiOrderRequest: { requestBody: { selection: sellBidTotalsSelection } },
        },
      ])
      .mockResolvedValueOnce([
        {
          marketId: "market-eo-totals",
          outcomeId: "outcome-eo-over",
          apiOrderRequest: { requestBody: { selection: sellBidTotalsSelection } },
        },
      ]);

    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/history"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.canceledOrders[0]).toEqual(expect.objectContaining({
      id: "order-eo-canceled-sell",
      side: "SELL",
      selection: normalizedSellBidTotalsSelection,
    }));
    expect(body.recentTrades[0]).toEqual(expect.objectContaining({
      id: "trade-eo-sell-filled",
      side: "SELL",
      selection: normalizedSellBidTotalsSelection,
      proceedsTokens: 7.08,
      realizedPnlTokens: 1.8,
    }));
    expect(body.canceledOrders[0].selection.marketGroupId).toBe("totals");
    expect(body.recentTrades[0].selection.limitSide).toBe("bid");
    expect(body.recentTrades[0].selection.tokenId).toBe("token-eo-over-35");
  });

  test("keeps recent trade selection tied to the order snapshot that existed when the trade filled", async () => {
    mockPrisma.trade.findMany.mockReset();
    mockPrisma.order.findMany.mockReset();
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);

    const originalSelection = {
      marketId: "market-rg-spread",
      outcomeId: "outcome-rg-home",
      marketGroupId: "spreads",
      marketType: "spread",
      line: "-0.5",
      period: "regulation",
      side: "home",
      displayLabel: "Germany -0.5",
      contractSide: "yes",
      providerSource: "polymarket",
      externalMarketId: "gamma-rg-spread-original",
      conditionId: "condition-rg-spread-original",
      tokenId: "token-rg-home-original",
      referenceOutcomeLabel: "Germany -0.5",
    };
    const laterSelection = {
      ...originalSelection,
      line: "-1.5",
      displayLabel: "Germany -1.5",
      externalMarketId: "gamma-rg-spread-later",
      conditionId: "condition-rg-spread-later",
      tokenId: "token-rg-home-later",
      referenceOutcomeLabel: "Germany -1.5",
    };
    const market = {
      id: "market-rg-spread",
      title: "Germany vs Mexico: Spread",
      event: { title: "Germany vs Mexico", slug: "germany-vs-mexico" },
      status: "LIVE",
      marketGroupKey: "spreads",
      marketType: "spread",
      line: { toString: () => "-1.5" },
      period: "regulation",
      referenceSource: "polymarket",
      externalSlug: "rg-spread-refreshed",
      externalMarketId: "gamma-rg-spread-later",
      conditionId: "condition-rg-spread-later",
    };
    const outcome = {
      id: "outcome-rg-home",
      name: "YES",
      label: "Germany -1.5",
      side: "home",
      referenceTokenId: "token-rg-home-later",
      referenceOutcomeLabel: "Germany -1.5",
    };

    mockPrisma.trade.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "trade-rg-original",
          marketId: "market-rg-spread",
          outcomeId: "outcome-rg-home",
          side: "BUY",
          shares: 20,
          cost: 10,
          fee: 0,
          createdAt: new Date("2026-07-05T12:00:00.000Z"),
          market,
          outcome,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "trade-rg-original",
          marketId: "market-rg-spread",
          outcomeId: "outcome-rg-home",
          side: "BUY",
          shares: 20,
          cost: 10,
          fee: 0,
          createdAt: new Date("2026-07-05T12:00:00.000Z"),
        },
      ]);
    mockPrisma.order.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "order-rg-later",
          marketId: "market-rg-spread",
          outcomeId: "outcome-rg-home",
          createdAt: new Date("2026-07-05T12:08:00.000Z"),
          updatedAt: new Date("2026-07-05T12:08:05.000Z"),
          apiOrderRequest: { requestBody: { selection: laterSelection } },
        },
        {
          id: "order-rg-original",
          marketId: "market-rg-spread",
          outcomeId: "outcome-rg-home",
          createdAt: new Date("2026-07-05T11:59:00.000Z"),
          updatedAt: new Date("2026-07-05T12:00:05.000Z"),
          apiOrderRequest: { requestBody: { selection: originalSelection } },
        },
      ]);

    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/history"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.recentTrades[0].selection).toMatchObject({
      line: "-0.5",
      displayLabel: "Germany -0.5",
      externalMarketId: "gamma-rg-spread-original",
      conditionId: "condition-rg-spread-original",
      tokenId: "token-rg-home-original",
    });
    expect(body.recentTrades[0].selection).not.toMatchObject({
      line: "-1.5",
      tokenId: "token-rg-home-later",
    });
  });

  test("prefers immutable trade selection snapshot over reconstructed order lookup", async () => {
    mockPrisma.trade.findMany.mockReset();
    mockPrisma.order.findMany.mockReset();
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);

    const immutableSelection = {
      marketId: "market-snapshot-spread",
      outcomeId: "outcome-snapshot-home",
      marketGroupId: "spreads",
      marketType: "spread",
      line: "+0.5",
      period: "regulation",
      side: "home",
      displayLabel: "France +0.5",
      contractSide: "yes",
      providerSource: "polymarket",
      externalMarketId: "gamma-snapshot-original",
      conditionId: "condition-snapshot-original",
      tokenId: "token-snapshot-original",
      referenceOutcomeLabel: "France +0.5",
    };
    const laterOrderSelection = {
      ...immutableSelection,
      line: "+1.5",
      displayLabel: "France +1.5",
      externalMarketId: "gamma-snapshot-later",
      conditionId: "condition-snapshot-later",
      tokenId: "token-snapshot-later",
      referenceOutcomeLabel: "France +1.5",
    };
    const market = {
      id: "market-snapshot-spread",
      title: "France vs Paraguay: Spread",
      event: { title: "France vs Paraguay", slug: "france-vs-paraguay" },
      status: "LIVE",
      marketGroupKey: "spreads",
      marketType: "spread",
      line: { toString: () => "+1.5" },
      period: "regulation",
      referenceSource: "polymarket",
      externalSlug: "snapshot-later",
      externalMarketId: "gamma-snapshot-later",
      conditionId: "condition-snapshot-later",
    };
    const outcome = {
      id: "outcome-snapshot-home",
      name: "YES",
      label: "France +1.5",
      side: "home",
      referenceTokenId: "token-snapshot-later",
      referenceOutcomeLabel: "France +1.5",
    };

    mockPrisma.trade.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "trade-snapshot-original",
          marketId: "market-snapshot-spread",
          outcomeId: "outcome-snapshot-home",
          side: "BUY",
          shares: 15,
          cost: 7.5,
          fee: 0,
          selectionSnapshot: immutableSelection,
          createdAt: new Date("2026-07-05T13:00:00.000Z"),
          market,
          outcome,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "trade-snapshot-original",
          marketId: "market-snapshot-spread",
          outcomeId: "outcome-snapshot-home",
          side: "BUY",
          shares: 15,
          cost: 7.5,
          fee: 0,
          createdAt: new Date("2026-07-05T13:00:00.000Z"),
        },
      ]);
    mockPrisma.order.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "order-snapshot-later",
          marketId: "market-snapshot-spread",
          outcomeId: "outcome-snapshot-home",
          createdAt: new Date("2026-07-05T13:10:00.000Z"),
          updatedAt: new Date("2026-07-05T13:10:05.000Z"),
          apiOrderRequest: { requestBody: { selection: laterOrderSelection } },
        },
      ]);

    const { GET } = await import("@/app/api/portfolio/history/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio/history"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.recentTrades[0].selection).toMatchObject({
      line: "+0.5",
      displayLabel: "France +0.5",
      externalMarketId: "gamma-snapshot-original",
      conditionId: "condition-snapshot-original",
      tokenId: "token-snapshot-original",
    });
    expect(body.recentTrades[0].selection).not.toMatchObject({
      line: "+1.5",
      tokenId: "token-snapshot-later",
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
