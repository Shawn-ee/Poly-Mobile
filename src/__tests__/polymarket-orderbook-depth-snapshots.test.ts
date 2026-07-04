const mockFindMany = jest.fn();
const mockUpsertReferenceOrderbookDepthSnapshots = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    market: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

jest.mock("@/server/services/referenceOrderbookDepthSnapshots", () => ({
  upsertReferenceOrderbookDepthSnapshots: (...args: unknown[]) => mockUpsertReferenceOrderbookDepthSnapshots(...args),
}));

import { refreshPolymarketOrderbookDepthSnapshots } from "@/server/services/polymarketOrderbookDepthSnapshots";

describe("polymarket orderbook depth snapshots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([
      {
        id: "market-1",
        title: "Curacao vs Cote d'Ivoire",
        externalSlug: "curacao-cote-divoire-match-winner",
        externalMarketId: "gamma-market-1",
        conditionId: "condition-1",
        outcomes: [
          { id: "home", referenceTokenId: "token-home" },
          { id: "away", referenceTokenId: "token-away" },
        ],
      },
    ]);
    mockUpsertReferenceOrderbookDepthSnapshots.mockImplementation(async (rows) => rows);
  });

  test("fetches CLOB books by token_id and writes provider ladder rows", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          asset_id: "token-home",
          timestamp: "1780000000",
          bids: [
            { price: "0.50", size: "120" },
            { price: "0.49", size: "140" },
          ],
          asks: [
            { price: "0.54", size: "90" },
            { price: "0.55", size: "110" },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          asset_id: "token-away",
          timestamp: "1780000001",
          bids: [{ price: "0.45", size: "130" }],
          asks: [{ price: "0.58", size: "95" }],
        }),
      });

    const report = await refreshPolymarketOrderbookDepthSnapshots({
      marketIds: ["market-1"],
      maxLevels: 2,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://clob.polymarket.com/book?token_id=token-home",
      { headers: { Accept: "application/json" } },
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://clob.polymarket.com/book?token_id=token-away",
      { headers: { Accept: "application/json" } },
    );
    expect(mockUpsertReferenceOrderbookDepthSnapshots).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        marketId: "market-1",
        outcomeId: "home",
        source: "polymarket-clob",
        tokenId: "token-home",
        side: "bid",
        price: 0.5,
        size: 120,
        levelIndex: 0,
      }),
      expect.objectContaining({
        outcomeId: "home",
        side: "ask",
        price: 0.54,
        size: 90,
      }),
      expect.objectContaining({
        outcomeId: "away",
        side: "ask",
        price: 0.58,
        size: 95,
      }),
    ]));
    expect(report).toMatchObject({
      source: "polymarket-clob",
      requestedMarketCount: 1,
      refreshedCount: 1,
      depthRowsUpdated: 6,
      skippedCount: 0,
    });
    expect(report.refreshed[0]).toMatchObject({
      outcomes: [
        expect.objectContaining({ providerTimestamp: "2026-05-28T20:26:40.000Z" }),
        expect.objectContaining({ providerTimestamp: "2026-05-28T20:26:41.000Z" }),
      ],
    });
  });

  test("records skipped CLOB token fetches without failing the full market refresh", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timestamp: "1780000001",
          bids: [{ price: "0.45", size: "130" }],
          asks: [],
        }),
      });

    const report = await refreshPolymarketOrderbookDepthSnapshots({
      marketIds: ["market-1"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(report.depthRowsUpdated).toBe(1);
    expect(report.skipped).toEqual([
      expect.objectContaining({
        outcomeId: "home",
        tokenId: "token-home",
        reason: "CLOB book request failed: 404 Not Found",
      }),
    ]);
  });
});
