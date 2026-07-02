const buildPublicOrderbookSnapshot = jest.fn();

jest.mock("@/server/services/orderbookSnapshot", () => ({
  buildPublicOrderbookSnapshot: (...args: unknown[]) => buildPublicOrderbookSnapshot(...args),
}));

describe("orderbook pricing quote depth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("maps public orderbook best levels into quote prices and sizes", async () => {
    buildPublicOrderbookSnapshot.mockResolvedValue({
      bids: [
        { outcomeId: "france", price: 0.47, size: 1000 },
        { outcomeId: "argentina", price: 0.21, size: 400 },
      ],
      asks: [
        { outcomeId: "france", price: 0.5, size: 2500 },
        { outcomeId: "argentina", price: 0.25, size: 600 },
      ],
    });

    const { getOutcomeQuotes } = await import("@/lib/orderbookPricing");
    const quotes = await getOutcomeQuotes("world-cup-winner", ["france", "spain"]);

    expect(buildPublicOrderbookSnapshot).toHaveBeenCalledWith({ marketId: "world-cup-winner" });
    expect(quotes.get("france")).toEqual({
      bestBid: 0.47,
      bestAsk: 0.5,
      bestBidSize: 1000,
      bestAskSize: 2500,
      mid: 0.485,
      spread: 0.030000000000000027,
    });
    expect(quotes.get("spain")).toEqual({
      bestBid: null,
      bestAsk: null,
      bestBidSize: null,
      bestAskSize: null,
      mid: 0.5,
      spread: null,
    });
  });
});
