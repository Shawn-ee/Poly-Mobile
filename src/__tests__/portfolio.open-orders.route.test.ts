import { NextRequest } from "next/server";

const getUserId = jest.fn();
const getOutcomeQuotes = jest.fn();
const requireCanonicalActor = jest.fn();

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

jest.mock("@/lib/canonicalAuth", () => ({
  requireCanonicalActor: (...args: unknown[]) => requireCanonicalActor(...args),
}));

jest.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

jest.mock("@/lib/orderbookPricing", () => ({
  getOutcomeQuotes: (...args: unknown[]) => getOutcomeQuotes(...args),
}));

describe("GET /api/portfolio open order display data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireCanonicalActor.mockResolvedValue({ userId: "api-user-1" });
    getOutcomeQuotes.mockResolvedValue(new Map());
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
        market: {
          id: "market-1",
          title: "Lakers vs Warriors",
          status: "LIVE",
          marketGroupKey: "live-game-lines",
          marketType: "spread",
          line: { toString: () => "-1.5" },
          period: "regulation",
          referenceSource: "polymarket",
          externalSlug: "lakers-warriors-spread",
          externalMarketId: "gamma-market-spread",
          conditionId: "condition-spread",
        },
        outcome: {
          id: "outcome-1",
          name: "Lakers",
          label: "Lakers -1.5",
          side: "home",
          referenceTokenId: "token-lakers-spread",
          referenceOutcomeLabel: "Lakers -1.5",
        },
        apiOrderRequest: {
          requestBody: {
            selection: {
              marketType: "spread",
              line: "-1.5",
              period: "regulation",
              displayLabel: "Lakers -1.5",
            },
            contractSide: "YES",
          },
        },
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
        market: expect.objectContaining({ id: "market-1", title: "Lakers vs Warriors", status: "LIVE" }),
        outcome: expect.objectContaining({ id: "outcome-1", name: "Lakers" }),
        selection: {
          marketId: "market-1",
          outcomeId: "outcome-1",
          marketGroupId: "live-game-lines",
          marketType: "spread",
          line: "-1.5",
          period: "regulation",
          side: "home",
          displayLabel: "Lakers -1.5",
          contractSide: "yes",
          referenceSource: "polymarket",
          providerSource: "polymarket",
          externalSlug: "lakers-warriors-spread",
          externalMarketId: "gamma-market-spread",
          conditionId: "condition-spread",
          referenceTokenId: "token-lakers-spread",
          tokenId: "token-lakers-spread",
          referenceOutcomeLabel: "Lakers -1.5",
        },
        side: "BUY",
        status: "OPEN",
        price: 0.55,
        size: 10,
        remaining: 4,
        reservedNotional: 2.2,
      }),
    ]);
    expect(body.selectionSourceSummary.openOrders).toMatchObject({
      totalSelectionCount: 1,
      polymarketSelectionCount: 1,
      lineMarkets: {
        totalCount: 1,
        polymarketCount: 1,
        status: "provider-backed",
        families: ["spread"],
      },
    });
    expect(JSON.stringify(body.openOrders)).not.toContain("cred-private");
    expect(JSON.stringify(body.openOrders)).not.toContain("createdApiCredential");
  });

  test("uses canonical API-key actor for mobile portfolio reads", async () => {
    getUserId.mockResolvedValue("session-user-should-not-be-used");
    requireCanonicalActor.mockResolvedValue({ userId: "api-user-1" });

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(
      new NextRequest("http://localhost/api/portfolio", {
        headers: { Authorization: "Bearer pk_live_test.secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(requireCanonicalActor).toHaveBeenCalledWith(expect.any(NextRequest), ["account:read"]);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "api-user-1",
          status: { in: ["OPEN", "PARTIAL"] },
        },
      }),
    );
    expect(getUserId).not.toHaveBeenCalled();
  });

  test("returns position market and outcome identifiers needed for server-side close orders", async () => {
    getUserId.mockResolvedValue("user-1");
    prismaMock.order.findMany
      .mockResolvedValueOnce([
        {
          marketId: "market-world-cup-winner",
          outcomeId: "outcome-france",
          apiOrderRequest: {
            requestBody: {
              selection: {
                marketId: "market-world-cup-winner",
                outcomeId: "outcome-france",
                marketGroupId: "spreads",
                marketType: "spread",
                line: "+1.5",
                period: "regulation",
                side: "yes",
                displayLabel: "France +1.5 regulation",
                contractSide: "yes",
                providerSource: "polymarket",
                externalMarketId: "gamma-market-france-spread",
                conditionId: "condition-france-spread",
                tokenId: "token-france-spread",
                referenceOutcomeLabel: "France +1.5",
              },
            },
          },
        },
      ])
      .mockResolvedValueOnce([]);
    getOutcomeQuotes.mockResolvedValue(
      new Map([
        [
          "outcome-france",
          { bestBid: 0.59, bestAsk: 0.63, bestBidSize: 750, bestAskSize: 1250, mid: 0.61, spread: 0.04 },
        ],
      ]),
    );
    prismaMock.position.findMany.mockResolvedValue([
      {
        marketId: "market-world-cup-winner",
        outcomeId: "outcome-france",
        shares: 25,
        avgCost: 0.42,
        market: {
          id: "market-world-cup-winner",
          title: "World Cup winner",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          marketGroupKey: "live-game-lines",
          marketType: "match_winner_1x2",
          referenceSource: "polymarket",
          externalSlug: "world-cup-2026-france-winner",
          externalMarketId: "gamma-market-france",
          conditionId: "condition-france",
          line: null,
          period: "regulation",
          resolveTime: null,
          createdAt: new Date("2026-06-20T12:00:00Z"),
        },
        outcome: {
          id: "outcome-france",
          name: "France",
          label: "France",
          side: "home",
          referenceTokenId: "token-france",
          referenceOutcomeLabel: "France",
        },
        apiCredentialId: "private-position-credential",
      },
    ]);

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getOutcomeQuotes).toHaveBeenCalledWith("market-world-cup-winner", ["outcome-france"]);
    expect(body.positions).toEqual([
      expect.objectContaining({
        market: expect.objectContaining({
          id: "market-world-cup-winner",
          title: "World Cup winner",
        }),
        outcomeId: "outcome-france",
        outcome: "France",
        selection: {
          marketId: "market-world-cup-winner",
          outcomeId: "outcome-france",
          marketGroupId: "spreads",
          marketType: "spread",
          line: "+1.5",
          period: "regulation",
          side: "yes",
          displayLabel: "France +1.5 regulation",
          contractSide: "yes",
          referenceSource: "polymarket",
          providerSource: "polymarket",
          externalSlug: "world-cup-2026-france-winner",
          externalMarketId: "gamma-market-france-spread",
          conditionId: "condition-france-spread",
          referenceTokenId: "token-france-spread",
          tokenId: "token-france-spread",
          referenceOutcomeLabel: "France +1.5",
        },
        shares: 25,
        avgCost: 0.42,
        currentPrice: 0.61,
        bestBid: 0.59,
        bestAsk: 0.63,
        bestBidSize: 750,
        bestAskSize: 1250,
        valueTokens: 15.25,
        costBasisTokens: 10.5,
        pnlTokens: 4.75,
      }),
    ]);
    expect(JSON.stringify(body.positions)).not.toContain("match_winner_1x2");
    expect(JSON.stringify(body.positions)).not.toContain("private-position-credential");
    expect(body.selectionSourceSummary.positions).toMatchObject({
      totalSelectionCount: 1,
      polymarketSelectionCount: 1,
      lineMarkets: {
        totalCount: 1,
        polymarketCount: 1,
        status: "provider-backed",
        families: ["spread"],
      },
    });
  });

  test("keeps selected position and open-order snapshots after current market metadata changes", async () => {
    getUserId.mockResolvedValue("user-1");
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
      providerSource: "polymarket",
      externalSlug: "ef-spain-japan-spread-original",
      externalMarketId: "gamma-ef-spread-original",
      conditionId: "condition-ef-spread-original",
      tokenId: "token-ef-spread-yes-original",
      referenceOutcomeLabel: "Spain -0.5",
      limitPrice: 0.44,
      limitSide: "ask",
      limitShares: 125.5,
    };
    const driftedMarket = {
      id: "market-ef-spread",
      title: "Spain vs Japan moneyline after provider refresh",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      marketGroupKey: "moneyline",
      marketType: "match_winner_1x2",
      line: null,
      period: "regulation",
      referenceSource: "refreshed-provider",
      externalSlug: "ef-moneyline-refreshed",
      externalMarketId: "gamma-ef-moneyline-refreshed",
      conditionId: "condition-ef-moneyline-refreshed",
      resolveTime: null,
      createdAt: new Date("2026-07-04T12:00:00Z"),
    };
    const driftedOutcome = {
      id: "outcome-ef-spread-yes",
      name: "YES",
      label: "Spain moneyline refreshed",
      side: "home",
      referenceTokenId: "token-ef-moneyline-yes-refreshed",
      referenceOutcomeLabel: "Spain moneyline",
    };

    prismaMock.order.findMany
      .mockResolvedValueOnce([
        {
          marketId: "market-ef-spread",
          outcomeId: "outcome-ef-spread-yes",
          apiOrderRequest: { requestBody: { selection: snapshot } },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "order-ef-open",
          market: driftedMarket,
          outcome: driftedOutcome,
          apiOrderRequest: { requestBody: { selection: snapshot } },
          side: "BUY",
          status: "OPEN",
          price: 0.44,
          amount: 12,
          remaining: 12,
          reservedNotional: 5.28,
          createdAt: new Date("2026-07-04T12:05:00Z"),
          updatedAt: new Date("2026-07-04T12:05:00Z"),
        },
      ]);
    prismaMock.position.findMany.mockResolvedValue([
      {
        marketId: "market-ef-spread",
        outcomeId: "outcome-ef-spread-yes",
        shares: 12,
        avgCost: 0.44,
        market: driftedMarket,
        outcome: driftedOutcome,
      },
    ]);

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.positions[0].selection).toEqual(expect.objectContaining(snapshot));
    expect(body.openOrders[0].selection).toEqual(expect.objectContaining(snapshot));
    expect(JSON.stringify(body.positions[0].selection)).not.toContain("moneyline");
    expect(JSON.stringify(body.openOrders[0].selection)).not.toContain("refreshed");
    expect(body.positions[0].selection.tokenId).toBe("token-ef-spread-yes-original");
    expect(body.openOrders[0].selection.marketType).toBe("spread");
    expect(body.positions[0].selection.limitPrice).toBe(0.44);
    expect(body.openOrders[0].selection.limitSide).toBe("ask");
    expect(body.openOrders[0].selection.limitShares).toBe(125.5);
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

  test("keeps bid-side Sell totals limit identity in open orders", async () => {
    getUserId.mockResolvedValue("user-1");
    const sellBidTotalsSelection = {
      marketId: "market-eo-totals",
      outcomeId: "outcome-eo-over",
      marketGroupId: "totals",
      marketType: "totals",
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

    prismaMock.order.findMany
      .mockResolvedValueOnce([
        {
          id: "order-eo-open-sell",
          market: {
            id: "market-eo-totals",
            title: "Route Home vs Route Away total goals",
            status: "LIVE",
            marketGroupKey: "totals",
            marketType: "totals",
            line: { toString: () => "3.5" },
            period: "2H",
            referenceSource: "polymarket",
            externalSlug: "eo-route-breadth-total-35",
            externalMarketId: "gamma-eo-route-breadth-total-35",
            conditionId: "condition-eo-route-breadth-total-35",
          },
          outcome: {
            id: "outcome-eo-over",
            name: "Over",
            label: "Over 3.5 2H",
            side: "over",
            referenceTokenId: "token-eo-over-35",
            referenceOutcomeLabel: "Over 3.5",
          },
          apiOrderRequest: { requestBody: { selection: sellBidTotalsSelection } },
          side: "SELL",
          status: "OPEN",
          price: 0.59,
          amount: 10,
          remaining: 10,
          reservedNotional: 0,
          createdAt: new Date("2026-07-04T13:00:00Z"),
          updatedAt: new Date("2026-07-04T13:00:00Z"),
        },
      ]);

    const { GET } = await import("@/app/api/portfolio/route");
    const response = await GET(new NextRequest("http://localhost/api/portfolio"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.openOrders[0]).toEqual(expect.objectContaining({
      id: "order-eo-open-sell",
      side: "SELL",
      selection: sellBidTotalsSelection,
    }));
    expect(body.openOrders[0].selection.marketGroupId).toBe("totals");
    expect(body.openOrders[0].selection.limitSide).toBe("bid");
    expect(body.openOrders[0].selection.tokenId).toBe("token-eo-over-35");
  });

  test("returns sanitized current-user combo orders including settled history", async () => {
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
          status: { in: ["OPEN", "SETTLED", "VOIDED"] },
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
