import type { OrderConfirmation, PortfolioActivity } from "../components/Portfolio";
import type { LocalPortfolioState } from "./portfolioStateApplyService";

export type PortfolioFixtureState = LocalPortfolioState & {
  latestOrder: OrderConfirmation | null;
};

export const serverHydratedPortfolioFixture = (): PortfolioFixtureState => ({
  balance: 10000,
  positions: [
    {
      id: "server-world-cup-winner-France",
      mode: "server",
      marketId: "world-cup-winner",
      outcomeId: "france",
      title: "World Cup winner",
      outcome: "France",
      side: "buy",
      amount: 210,
      probability: 42,
      shares: 500,
      currentPrice: 0.51,
      currentValue: 255,
      pnl: 45,
    },
  ],
  openOrders: [],
  activities: [
    {
      id: "server-world-cup-winner-France-opened",
      action: "opened",
      title: "World Cup winner",
      outcome: "France",
      amount: 210,
      side: "buy",
      probability: 42,
      timestamp: "Server synced",
    } satisfies PortfolioActivity,
  ],
  latestOrder: null,
});
