import { Prisma } from "@prisma/client";
import { buildProviderOrderbookDepth, buildProviderQuoteDepth } from "@/server/services/orderbookSnapshot";

const decimal = (value: number) => new Prisma.Decimal(value);

describe("provider quote depth bridge", () => {
  test("builds provider ladder depth from latest orderbook depth snapshot rows", () => {
    const depth = buildProviderOrderbookDepth([
      {
        outcomeId: "yes",
        source: "polymarket-clob",
        side: "ask",
        price: decimal(0.55),
        size: decimal(70),
        levelIndex: 1,
        fetchedAt: new Date("2026-07-04T06:10:00.000Z"),
        updatedAt: new Date("2026-07-04T06:10:01.000Z"),
      },
      {
        outcomeId: "yes",
        source: "polymarket-clob",
        side: "bid",
        price: decimal(0.51),
        size: decimal(120),
        levelIndex: 1,
        fetchedAt: new Date("2026-07-04T06:10:00.000Z"),
        updatedAt: new Date("2026-07-04T06:10:01.000Z"),
      },
      {
        outcomeId: "yes",
        source: "polymarket-clob",
        side: "bid",
        price: decimal(0.49),
        size: decimal(140),
        levelIndex: 2,
        fetchedAt: new Date("2026-07-04T06:10:00.000Z"),
        updatedAt: new Date("2026-07-04T06:10:01.000Z"),
      },
      {
        outcomeId: "yes",
        source: "polymarket-clob",
        side: "bid",
        price: decimal(0.47),
        size: decimal(200),
        levelIndex: 1,
        fetchedAt: new Date("2026-07-04T06:00:00.000Z"),
        updatedAt: new Date("2026-07-04T06:00:01.000Z"),
      },
    ]);

    expect(depth.bids).toEqual([
      { outcomeId: "yes", price: 0.51, size: 120 },
      { outcomeId: "yes", price: 0.49, size: 140 },
    ]);
    expect(depth.asks).toEqual([
      { outcomeId: "yes", price: 0.55, size: 70 },
    ]);
    expect(depth.summary).toMatchObject({
      source: "reference-orderbook-depth-snapshot",
      status: "ready",
      levelCount: 3,
      snapshotCount: 3,
      latestFetchedAt: "2026-07-04T06:10:00.000Z",
      sources: ["polymarket-clob"],
    });
  });

  test("builds provider top-of-book levels from best bid/ask and liquidity", () => {
    const depth = buildProviderQuoteDepth([
      {
        outcomeId: "yes",
        source: "polymarket",
        fetchedAt: new Date("2026-07-04T04:36:03.000Z"),
        updatedAt: new Date("2026-07-04T04:36:03.000Z"),
        acceptingOrders: true,
        bestBid: decimal(0.48),
        bestAsk: decimal(0.52),
        liquidity: decimal(960),
        liquidityClob: null,
        volume: null,
        volume24hr: null,
      },
      {
        outcomeId: "no",
        source: "polymarket",
        fetchedAt: new Date("2026-07-04T04:36:03.000Z"),
        updatedAt: new Date("2026-07-04T04:36:03.000Z"),
        acceptingOrders: true,
        bestBid: decimal(0.48),
        bestAsk: decimal(0.52),
        liquidity: decimal(960),
        liquidityClob: null,
        volume: null,
        volume24hr: null,
      },
    ], "ready");

    expect(depth.levelCount).toBe(4);
    expect(depth.sizeSource).toBe("liquidity");
    expect(depth.bids[0]).toEqual({ outcomeId: "yes", price: 0.48, size: 500 });
    expect(depth.asks[0]).toEqual({ outcomeId: "yes", price: 0.52, size: 461.538462 });
    expect(depth.reason).toContain("top-of-book prices");
  });

  test("does not fabricate provider levels without liquidity or volume", () => {
    const depth = buildProviderQuoteDepth([
      {
        outcomeId: "yes",
        source: "polymarket",
        fetchedAt: new Date("2026-07-04T04:36:03.000Z"),
        updatedAt: new Date("2026-07-04T04:36:03.000Z"),
        acceptingOrders: true,
        bestBid: decimal(0.48),
        bestAsk: decimal(0.52),
        liquidity: null,
        liquidityClob: null,
        volume: null,
        volume24hr: null,
      },
    ], "ready");

    expect(depth).toMatchObject({
      bids: [],
      asks: [],
      levelCount: 0,
      sizeSource: null,
    });
  });
});
