import { NextRequest } from "next/server";
import { quoteOutcomeDisplayLabel } from "@/server/services/quoteDisplayLabel";

const getUserId = jest.fn();
const getCanonicalMarketQuote = jest.fn();

jest.mock("@/lib/auth", () => ({
  getUserId: () => getUserId(),
}));

jest.mock("@/server/services/canonicalApi", () => ({
  getCanonicalMarketQuote: (...args: unknown[]) => getCanonicalMarketQuote(...args),
}));

describe("GET /api/markets/[id]/quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserId.mockResolvedValue("user-1");
    getCanonicalMarketQuote.mockResolvedValue({
      marketId: "market-1",
      quotes: [
        {
          outcomeId: "outcome-1",
          outcomeName: "Home",
          referenceOutcomeLabel: null,
          bestBid: "0.41",
          bestAsk: "0.45",
          bestBidSize: 120,
          bestAskSize: 80,
          midPrice: "0.43",
          lastPrice: "0.42",
        },
      ],
    });
  });

  test("returns canonical market quote payload for mobile ticket pricing", async () => {
    const { GET } = await import("@/app/api/markets/[id]/quote/route");
    const response = await GET(new NextRequest("http://localhost/api/markets/market-1/quote?outcomeId=outcome-1"), {
      params: Promise.resolve({ id: "market-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getCanonicalMarketQuote).toHaveBeenCalledWith({
      marketId: "market-1",
      outcomeId: "outcome-1",
      userId: "user-1",
    });
    expect(body).toEqual({
      marketId: "market-1",
      quotes: [
        {
          outcomeId: "outcome-1",
          outcomeName: "Home",
          referenceOutcomeLabel: null,
          bestBid: "0.41",
          bestAsk: "0.45",
          bestBidSize: 120,
          bestAskSize: 80,
          midPrice: "0.43",
          lastPrice: "0.42",
        },
      ],
    });
  });

  test("rejects missing market id before quote lookup", async () => {
    const { GET } = await import("@/app/api/markets/[id]/quote/route");
    const response = await GET(new NextRequest("http://localhost/api/markets//quote"), {
      params: Promise.resolve({ id: "" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_REQUEST");
    expect(getCanonicalMarketQuote).not.toHaveBeenCalled();
  });

  test("normalizes sportsbook totals labels for mobile quote display", () => {
    expect(
      quoteOutcomeDisplayLabel({
        marketType: "total_goals",
        line: "2.5000",
        outcomeName: "Over +2.5",
        outcomeLabel: "Over +2.5",
        outcomeSide: "over",
      })
    ).toBe("Over 2.5");

    expect(
      quoteOutcomeDisplayLabel({
        marketType: "team_total_goals",
        line: "1.5",
        outcomeName: "Under +1.5",
        outcomeLabel: null,
        outcomeSide: "under",
      })
    ).toBe("Under 1.5");
  });
});
