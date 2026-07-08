const mockMarketFindMany = jest.fn();
const mockUpsertReferenceQuoteSnapshots = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    market: {
      findMany: (...args: unknown[]) => mockMarketFindMany(...args),
    },
  },
}));

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  referenceSnapshotConfig: {
    maxReferenceSpread: 0.08,
    pollMs: 5000,
  },
  upsertReferenceQuoteSnapshots: (...args: unknown[]) => mockUpsertReferenceQuoteSnapshots(...args),
}));

import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";

describe("polymarket reference snapshots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketFindMany.mockResolvedValue([
      {
        id: "market-egypt",
        title: "Will Egypt win?",
        externalSlug: "fifwc-arg-egy-2026-07-07-egy",
        externalMarketId: "2793741",
        conditionId: "condition-egypt",
        event: {
          slug: "argentina-vs-egypt",
          externalSlug: "fifwc-arg-egy-2026-07-07",
        },
        outcomes: [
          {
            id: "yes",
            name: "YES",
            referenceTokenId: "token-yes",
            referenceOutcomeLabel: "Yes",
          },
          {
            id: "no",
            name: "NO",
            referenceTokenId: "token-no",
            referenceOutcomeLabel: "No",
          },
        ],
      },
    ]);
    mockUpsertReferenceQuoteSnapshots.mockImplementation(async (rows) => rows);
  });

  test("falls back to Gamma event markets when direct market slug lookup is empty", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            slug: "fifwc-arg-egy-2026-07-07",
            markets: [
              {
                id: "2793741",
                slug: "fifwc-arg-egy-2026-07-07-egy",
                bestBid: "0.07",
                bestAsk: "0.08",
                spread: "0.01",
                lastTradePrice: "0.08",
                volume: "123",
                volume24hr: "45",
                liquidity: "67",
                liquidityClob: "89",
                acceptingOrders: true,
                outcomes: JSON.stringify(["Yes", "No"]),
                clobTokenIds: JSON.stringify(["token-yes", "token-no"]),
                outcomePrices: JSON.stringify(["0.08", "0.92"]),
              },
            ],
          },
        ]),
      });

    const report = await refreshPolymarketReferenceSnapshots({
      marketIds: ["market-egypt"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://gamma-api.polymarket.com/markets?slug=fifwc-arg-egy-2026-07-07-egy",
      { headers: { Accept: "application/json" } },
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://gamma-api.polymarket.com/events?slug=fifwc-arg-egy-2026-07-07",
      { headers: { Accept: "application/json" } },
    );
    expect(mockUpsertReferenceQuoteSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({
        marketId: "market-egypt",
        outcomeId: "yes",
        outcomePrice: 0.08,
        bestBid: 0.07,
        bestAsk: 0.08,
        qualityStatus: "high_quality",
      }),
      expect.objectContaining({
        marketId: "market-egypt",
        outcomeId: "no",
        outcomePrice: 0.92,
        bestBid: 0.07,
        bestAsk: 0.08,
        qualityStatus: "high_quality",
      }),
    ]);
    expect(report).toMatchObject({
      refreshedCount: 1,
      skippedCount: 0,
      snapshotsUpdated: 2,
    });
  });
});
