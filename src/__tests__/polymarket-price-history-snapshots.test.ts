const mockFindMany = jest.fn();
const mockDeleteMany = jest.fn();
const mockCreateMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    market: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    marketOutcomeSnapshot: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      createMany: (...args: unknown[]) => mockCreateMany(...args),
    },
  },
}));

import { refreshPolymarketPriceHistorySnapshots } from "@/server/services/polymarketPriceHistorySnapshots";

describe("polymarket price history snapshots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([
      {
        id: "market-1",
        title: "Colombia vs Ghana",
        externalSlug: "fifwc-col-gha-2026-07-03-col",
        outcomes: [
          { id: "yes", referenceTokenId: "token-yes" },
          { id: "no", referenceTokenId: "token-no" },
        ],
      },
    ]);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockCreateMany.mockImplementation(async ({ data }) => ({ count: data.length }));
  });

  test("fetches CLOB prices-history by token id and writes chart snapshots", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          history: [
            { t: 1780000000, p: 0.57 },
            { t: 1780000300, p: "0.58" },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          history: [
            { t: 1780000000, p: 0.43 },
            { t: 1780000300, p: "0.42" },
          ],
        }),
      });

    const report = await refreshPolymarketPriceHistorySnapshots({
      marketIds: ["market-1"],
      interval: "1d",
      fidelityMinutes: 5,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://clob.polymarket.com/prices-history?market=token-yes&interval=1d&fidelity=5",
      { headers: { Accept: "application/json" } },
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://clob.polymarket.com/prices-history?market=token-no&interval=1d&fidelity=5",
      { headers: { Accept: "application/json" } },
    );
    expect(mockDeleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        marketId: "market-1",
        outcomeId: "yes",
      }),
    }));
    expect(mockCreateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({
          marketId: "market-1",
          outcomeId: "yes",
          ts: new Date("2026-05-28T20:26:40.000Z"),
        }),
      ]),
    }));
    expect(mockCreateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({
          marketId: "market-1",
          outcomeId: "no",
          ts: new Date("2026-05-28T20:31:40.000Z"),
        }),
      ]),
    }));
    expect(report).toMatchObject({
      source: "polymarket-clob-prices-history",
      requestedMarketCount: 1,
      refreshedCount: 1,
      snapshotsCreated: 4,
      skippedCount: 0,
    });
  });

  test("records empty history as skipped without failing the full market refresh", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ history: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
      });

    const report = await refreshPolymarketPriceHistorySnapshots({
      marketIds: ["market-1"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(report.snapshotsCreated).toBe(0);
    expect(report.skipped).toEqual([
      expect.objectContaining({ outcomeId: "yes", reason: "empty_prices_history" }),
      expect.objectContaining({ outcomeId: "no", reason: "CLOB prices-history request failed: 500 Server Error" }),
    ]);
  });
});
