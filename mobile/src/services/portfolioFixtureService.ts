import type { OrderConfirmation, PortfolioActivity, Position } from "../components/Portfolio";
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
      bestBid: 47,
      bestAsk: 50,
      bestBidSize: 1000,
      bestAskSize: 2500,
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

export const serverBackendOnlyPortfolioFixture = (): PortfolioFixtureState => ({
  balance: 10000,
  positions: [
    {
      id: "server-backend-proof-YES",
      mode: "server",
      marketId: "backend-proof-market",
      outcomeId: "backend-proof-yes",
      title: "World Cup backend proof",
      outcome: "YES",
      side: "buy",
      amount: 210,
      probability: 42,
      shares: 500,
      currentPrice: 0.485,
      bestBid: 47,
      bestAsk: 50,
      bestBidSize: 1000,
      bestAskSize: 2500,
      currentValue: 242.5,
      pnl: 32.5,
    },
  ],
  openOrders: [],
  activities: [
    {
      id: "server-backend-proof-YES-opened",
      action: "opened",
      title: "World Cup backend proof",
      outcome: "YES",
      amount: 210,
      side: "buy",
      probability: 42,
      timestamp: "Server synced",
    } satisfies PortfolioActivity,
  ],
  latestOrder: null,
});

export const serverClosedPortfolioFixture = (position: Position): PortfolioFixtureState => ({
  balance: 10255,
  positions: [],
  openOrders: [],
  activities: [
    {
      id: `${position.id}-server-closed`,
      action: "closed",
      title: position.title,
      outcome: position.outcome,
      amount: position.currentValue ?? position.amount,
      entryAmount: position.amount,
      side: position.side,
      probability: position.probability,
      timestamp: "Server close synced",
    } satisfies PortfolioActivity,
  ],
  latestOrder: null,
});
