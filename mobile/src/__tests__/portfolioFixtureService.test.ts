import { describe, expect, test } from "vitest";
import { serverHydratedPortfolioFixture } from "../services/portfolioFixtureService";

describe("portfolio fixture service", () => {
  test("builds a deterministic server-hydrated Portfolio proof state", () => {
    expect(serverHydratedPortfolioFixture()).toMatchObject({
      balance: 10000,
      latestOrder: null,
      openOrders: [],
      positions: [
        {
          id: "server-world-cup-winner-France",
          mode: "server",
          marketId: "world-cup-winner",
          outcomeId: "france",
          title: "World Cup winner",
          outcome: "France",
          shares: 500,
          currentPrice: 0.51,
          currentValue: 255,
          pnl: 45,
        },
      ],
      activities: [
        {
          id: "server-world-cup-winner-France-opened",
          action: "opened",
          timestamp: "Server synced",
        },
      ],
    });
  });
});
