import { describe, expect, test } from "vitest";
import {
  deterministicPortfolioValueHistory,
  loadPortfolioValueHistory,
} from "../services/portfolioValueHistoryService";
import type { PortfolioValueHistoryRange } from "../types";

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

  test("loads server portfolio value history when the route is available", async () => {
    const api = {
      getPortfolioValueHistory: async (range: "1W") => ({
        range,
        ranges: ["1D", "1W", "1M", "All"] satisfies PortfolioValueHistoryRange[],
        source: "portfolio-value-history-route" as const,
        status: "ready" as const,
        generatedAt: "2026-07-04T12:00:00.000Z",
        lastUpdated: "2026-07-04T12:00:00.000Z",
        emptyState: null,
        points: [
          {
            timestamp: "2026-07-04T12:00:00.000Z",
            value: 140.86,
            cash: 40.8,
            positionsValue: 100.06,
            pnl: 37.9,
          },
        ],
      }),
    };

    await expect(
      loadPortfolioValueHistory({
        api,
        range: "1W",
        cash: 100,
        positionsValue: 20,
        pnl: 5,
      }),
    ).resolves.toMatchObject({
      source: "portfolio-value-history-route",
      range: "1W",
      points: [{ value: 140.86 }],
    });
  });

  test("falls back deterministically when the server route is unavailable", async () => {
    const api = {
      getPortfolioValueHistory: async () => {
        throw new Error("offline");
      },
    };

    await expect(
      loadPortfolioValueHistory({
        api,
        range: "1D",
        cash: 100,
        positionsValue: 25,
        pnl: 3,
        now: "2026-07-04T12:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      source: "deterministic-mobile-fallback",
      range: "1D",
      status: "ready",
    });
  });
});
