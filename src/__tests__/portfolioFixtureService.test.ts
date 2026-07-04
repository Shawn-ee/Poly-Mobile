import { describe, expect, test } from "vitest";
import { serverClosedPortfolioFixture, serverHydratedPortfolioFixture } from "../services/portfolioFixtureService";

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

  test("builds a deterministic server-closed Portfolio proof state", () => {
    const [position] = serverHydratedPortfolioFixture().positions;

    expect(serverClosedPortfolioFixture(position)).toMatchObject({
      balance: 10255,
      latestOrder: null,
      openOrders: [],
      positions: [],
      activities: [
        {
          id: "server-world-cup-winner-France-server-closed",
          action: "closed",
          title: "World Cup winner",
          outcome: "France",
          amount: 255,
          entryAmount: 210,
          probability: 42,
          timestamp: "Server close synced",
        },
      ],
    });
  });
});
