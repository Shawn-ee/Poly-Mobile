import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { loadTicketQuotes, quoteToTicketQuote } from "../services/quoteService";
import type { Quote } from "../types";

describe("quote service", () => {
  test("maps decimal and string quote values into ticket percentages", () => {
    const quote: Quote = {
      outcomeId: "france",
      outcomeName: "France",
      bestBid: "0.41",
      bestAsk: 0.43,
      midPrice: "0.42",
      lastPrice: null,
    };

    expect(quoteToTicketQuote(quote)).toEqual({
      outcomeId: "france",
      outcomeName: "France",
      probability: 42,
      bestBid: 41,
      bestAsk: 43,
      midPrice: 42,
      lastPrice: null,
    });
  });

  test("falls back to last price when mid price is unavailable", () => {
    const quote: Quote = {
      outcomeId: "brazil",
      outcomeName: "Brazil",
      bestBid: null,
      bestAsk: null,
      midPrice: null,
      lastPrice: "52",
    };

    expect(quoteToTicketQuote(quote).probability).toBe(52);
  });

  test("falls back to bid and ask midpoint before one-sided quotes", () => {
    expect(
      quoteToTicketQuote({
        outcomeId: "argentina",
        outcomeName: "Argentina",
        bestBid: 0.31,
        bestAsk: 0.35,
        midPrice: null,
        lastPrice: null,
      }).probability,
    ).toBe(33);

    expect(
      quoteToTicketQuote({
        outcomeId: "england",
        outcomeName: "England",
        bestBid: null,
        bestAsk: 0.28,
        midPrice: null,
        lastPrice: null,
      }).probability,
    ).toBe(28);
  });

  test("ignores invalid and negative quote values", () => {
    expect(
      quoteToTicketQuote({
        outcomeId: "spain",
        outcomeName: "Spain",
        bestBid: -1,
        bestAsk: "bad",
        midPrice: null,
        lastPrice: null,
      }),
    ).toEqual({
      outcomeId: "spain",
      outcomeName: "Spain",
      probability: 0,
      bestBid: null,
      bestAsk: null,
      midPrice: null,
      lastPrice: null,
    });
  });

  test("loads and normalizes market quotes from the API", async () => {
    const getMarketQuote = vi.fn(async () => ({
      marketId: "winner",
      quotes: [
        {
          outcomeId: "usa",
          outcomeName: "USA",
          bestBid: 0.18,
          bestAsk: 0.2,
          midPrice: 0.19,
          lastPrice: null,
        },
      ],
    }));
    const api = { getMarketQuote } as unknown as PolyApi;

    await expect(loadTicketQuotes(api, "winner", "usa")).resolves.toEqual([
      {
        outcomeId: "usa",
        outcomeName: "USA",
        probability: 19,
        bestBid: 18,
        bestAsk: 20,
        midPrice: 19,
        lastPrice: null,
      },
    ]);
    expect(getMarketQuote).toHaveBeenCalledWith("winner", "usa");
  });
});
