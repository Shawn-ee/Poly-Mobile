import { Prisma } from "@prisma/client";

const mockPrisma = {
  position: {
    findUnique: jest.fn(),
  },
};

const getOutcomeQuotes = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/orderbookPricing", () => ({
  getOutcomeQuotes: (...args: unknown[]) => getOutcomeQuotes(...args),
}));

const { estimateCashOut, estimateSingleLegCashOutValue } = require("@/server/services/cashOut") as typeof import("@/server/services/cashOut");

const dec = (value: string | number) => new Prisma.Decimal(value);

const position = (overrides: Record<string, unknown> = {}) => ({
  userId: "user-1",
  marketId: "market-1",
  outcomeId: "outcome-1",
  shares: dec("10"),
  avgCost: dec("0.40"),
  market: {
    id: "market-1",
    title: "Ecuador win",
    status: "LIVE",
    sourceUpdatedAt: new Date("2026-06-26T18:00:00Z"),
  },
  outcome: {
    id: "outcome-1",
    name: "ECU",
    label: "Ecuador",
  },
  ...overrides,
});

describe("cash-out estimate v1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.position.findUnique.mockResolvedValue(position());
    getOutcomeQuotes.mockResolvedValue(new Map([
      ["outcome-1", { bestBid: 0.55, bestAsk: 0.58, mid: 0.565, spread: 0.03, hasQuote: true }],
    ]));
  });

  test("calculates single-leg exit value and P/L", () => {
    const result = estimateSingleLegCashOutValue({
      quantity: dec("10"),
      entryCost: dec("4"),
      exitPrice: dec("0.55"),
    });

    expect(result.estimatedExitValue.toString()).toBe("5.5");
    expect(result.estimatedPnl.toString()).toBe("1.5");
  });

  test("estimates cash-out from current bid quote", async () => {
    const result = await estimateCashOut({
      userId: "user-1",
      marketId: "market-1",
      outcomeId: "outcome-1",
      now: new Date("2026-06-26T18:01:00Z"),
    });

    expect(result).toEqual(expect.objectContaining({
      supported: true,
      positionType: "single_leg",
      marketId: "market-1",
      outcomeId: "outcome-1",
      quantity: "10",
      entryCost: "4",
      exitPrice: "0.55",
      estimatedExitValue: "5.5",
      estimatedPnl: "1.5",
    }));
  });

  test("blocks stale quote, missing quote, closed market, combo, and missing position states", async () => {
    await expect(estimateCashOut({
      userId: "user-1",
      marketId: "market-1",
      outcomeId: "outcome-1",
      now: new Date("2026-06-26T18:10:01Z"),
    })).rejects.toMatchObject({ code: "CASH_OUT_QUOTE_STALE" });

    mockPrisma.position.findUnique.mockResolvedValueOnce(position({ market: { ...position().market, sourceUpdatedAt: null } }));
    getOutcomeQuotes.mockResolvedValueOnce(new Map([
      ["outcome-1", { bestBid: null, bestAsk: 0.58, mid: 0.58, spread: null, hasQuote: true }],
    ]));
    await expect(estimateCashOut({ userId: "user-1", marketId: "market-1", outcomeId: "outcome-1" }))
      .rejects.toMatchObject({ code: "CASH_OUT_QUOTE_MISSING" });

    mockPrisma.position.findUnique.mockResolvedValueOnce(position({ market: { ...position().market, status: "CLOSED" } }));
    await expect(estimateCashOut({ userId: "user-1", marketId: "market-1", outcomeId: "outcome-1" }))
      .rejects.toMatchObject({ code: "CASH_OUT_MARKET_CLOSED" });

    await expect(estimateCashOut({ userId: "user-1", comboOrderId: "combo-1" }))
      .rejects.toMatchObject({ code: "CASH_OUT_COMBO_UNSUPPORTED" });

    mockPrisma.position.findUnique.mockResolvedValueOnce(null);
    await expect(estimateCashOut({ userId: "user-1", marketId: "market-1", outcomeId: "outcome-1" }))
      .rejects.toMatchObject({ code: "CASH_OUT_UNSUPPORTED_POSITION" });
  });
});
