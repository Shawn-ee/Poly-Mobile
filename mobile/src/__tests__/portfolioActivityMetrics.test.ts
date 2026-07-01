import { describe, expect, it } from "vitest";
import { activityPnl, activityShares, decimalOdds } from "../domain/portfolioActivityMetrics";

describe("portfolio activity metrics", () => {
  it("calculates filled shares from amount and execution probability", () => {
    expect(activityShares({ amount: 100, probability: 34 }).toFixed(2)).toBe("294.12");
  });

  it("calculates closed trade pnl from close value and entry amount", () => {
    expect(activityPnl({ amount: 108.82, entryAmount: 100 })).toBeCloseTo(8.82, 2);
  });

  it("formats decimal odds from probability price", () => {
    expect(decimalOdds(0.34)).toBe("2.9x");
  });
});
