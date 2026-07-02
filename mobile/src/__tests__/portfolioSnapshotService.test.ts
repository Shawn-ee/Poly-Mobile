import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { loadPortfolioSnapshot } from "../services/portfolioSnapshotService";
import type { PortfolioSnapshot } from "../types";

const snapshot = (overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot => ({
  walletAvailableUSDC: 10000,
  walletLockedUSDC: 150,
  walletTotalUSDC: 10150,
  walletBalance: 10150,
  totalValue: 355,
  totalCostBasis: 300,
  totalRealizedPnl: 22,
  totalPnl: 77,
  comboOrders: [],
  positions: [
    {
      market: {
        id: "world-cup-winner",
        title: "World Cup winner",
        status: "ACTIVE",
        resolveTime: null,
        createdAt: "2026-06-01T12:00:00.000Z",
      },
      outcomeId: "france",
      outcome: "France",
      shares: 500,
      avgCost: 0.42,
      currentPrice: 0.51,
      valueTokens: 255,
      costBasisTokens: 210,
      totalCostBasisTokens: 210,
      pnlTokens: 45,
    },
  ],
  openOrders: [
    {
      id: "buy-order-1",
      market: {
        id: "world-cup-final",
        title: "World Cup final exact matchup",
        status: "ACTIVE",
      },
      outcome: {
        id: "argentina-brazil",
        name: "Argentina vs Brazil",
      },
      side: "BUY",
      status: "OPEN",
      price: 0.28,
      size: 100,
      remaining: 60,
      reservedNotional: 16.8,
      createdAt: "2026-06-05T14:00:00.000Z",
      updatedAt: "2026-06-05T14:00:00.000Z",
    },
    {
      id: "sell-order-1",
      market: {
        id: "world-cup-group",
        title: "Group A winner",
        status: "ACTIVE",
      },
      outcome: {
        id: "mexico",
        name: "Mexico",
      },
      side: "SELL",
      status: "OPEN",
      price: 0.47,
      size: 75,
      remaining: 25,
      reservedNotional: 0,
      createdAt: "2026-06-06T14:00:00.000Z",
      updatedAt: "2026-06-06T14:00:00.000Z",
    },
  ],
  ...overrides,
});

describe("portfolio snapshot service", () => {
  test("maps backend portfolio balances, positions, and open orders into mobile screen models", async () => {
    const getPortfolio = vi.fn(async () => snapshot());
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).resolves.toEqual({
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
      openOrders: [
        {
          id: "buy-order-1",
          title: "World Cup final exact matchup",
          outcome: "Argentina vs Brazil",
          side: "buy",
          status: "OPEN",
          price: 0.28,
          remaining: 60,
          remainingShares: 60,
          orderValue: 16.8,
          placedAt: "Jun 5, 9:00 AM",
        },
        {
          id: "sell-order-1",
          title: "Group A winner",
          outcome: "Mexico",
          side: "sell",
          status: "OPEN",
          price: 0.47,
          remaining: 25,
          remainingShares: 25,
          orderValue: 11.75,
          placedAt: "Jun 6, 9:00 AM",
        },
      ],
    });
    expect(getPortfolio).toHaveBeenCalledTimes(1);
  });

  test("keeps empty server portfolios renderable for a new Holiwyn account", async () => {
    const getPortfolio = vi.fn(async () => snapshot({ walletAvailableUSDC: 10000, positions: [], openOrders: [] }));
    const api = { getPortfolio } as unknown as PolyApi;

    await expect(loadPortfolioSnapshot(api)).resolves.toEqual({
      balance: 10000,
      positions: [],
      openOrders: [],
    });
  });
});
