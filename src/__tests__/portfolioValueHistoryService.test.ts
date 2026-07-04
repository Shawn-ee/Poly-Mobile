import { describe, expect, test } from "vitest";
import { deterministicPortfolioValueHistory } from "../services/portfolioValueHistoryService";

describe("portfolio value history service", () => {
  test("builds backend-shaped fallback points for a selected range", () => {
    const history = deterministicPortfolioValueHistory({
      range: "1W",
      cash: 9975,
      positionsValue: 24.23,
      pnl: 0.77,
      now: "2026-07-04T12:00:00.000Z",
    });

    expect(history).toMatchObject({
      range: "1W",
      ranges: ["1D", "1W", "1M", "All"],
      source: "deterministic-mobile-fallback",
      status: "ready",
      emptyState: null,
    });
    expect(history.points).toHaveLength(7);
    expect(history.points.at(-1)).toMatchObject({
      timestamp: "2026-07-04T12:00:00.000Z",
      value: 9999.23,
    });
  });
});
