import { describe, expect, test, vi } from "vitest";
import type { PortfolioActivity } from "../components/Portfolio";
import { loadServerPortfolioState, resolvePortfolioSyncResults } from "../services/portfolioSyncService";
import type { PortfolioSnapshotResult } from "../services/portfolioSnapshotService";

const snapshot: PortfolioSnapshotResult = {
  balance: 10000,
  positions: [
    {
      id: "server-world-cup-winner-France",
      mode: "server",
      title: "World Cup winner",
      outcome: "France",
      side: "buy",
      amount: 210,
      probability: 42,
    },
  ],
  openOrders: [],
};

const activities: PortfolioActivity[] = [
  {
    id: "history-world-cup-winner",
    action: "closed",
    title: "World Cup winner",
    outcome: "France",
    amount: 172.5,
    entryAmount: 100,
    timestamp: "Jul 19, 5:30 PM",
  },
];

const fulfilled = <T,>(value: T): PromiseFulfilledResult<T> => ({ status: "fulfilled", value });
const rejected = <T,>(): PromiseRejectedResult => ({ status: "rejected", reason: new Error("offline") });

describe("portfolio sync service", () => {
  test("returns synced state with snapshot and history when both server reads succeed", () => {
    expect(resolvePortfolioSyncResults(fulfilled(snapshot), fulfilled(activities))).toEqual({
      syncStatus: "synced",
      snapshot,
      activities,
    });
  });

  test("keeps Portfolio synced when snapshot succeeds and history fails", () => {
    expect(resolvePortfolioSyncResults(fulfilled(snapshot), rejected())).toEqual({
      syncStatus: "synced",
      snapshot,
    });
  });

  test("keeps Portfolio synced when history succeeds and snapshot fails", () => {
    expect(resolvePortfolioSyncResults(rejected(), fulfilled(activities))).toEqual({
      syncStatus: "synced",
      activities,
    });
  });

  test("returns error only when both Portfolio server reads fail", () => {
    expect(resolvePortfolioSyncResults(rejected<PortfolioSnapshotResult>(), rejected<PortfolioActivity[]>())).toEqual({
      syncStatus: "error",
    });
  });

  test("loads Portfolio snapshot and history through backend routes", async () => {
    const selection = {
      marketId: "market-1",
      outcomeId: "outcome-1",
      marketGroupId: "spread:regulation:1.5",
      marketType: "spread",
      line: "1.5",
      period: "Regulation",
      side: "home",
      displayLabel: "Home -1.5",
      contractSide: "yes" as const,
      referenceSource: "polymarket",
      externalMarketId: "gamma-market-1",
      conditionId: "condition-1",
      referenceTokenId: "token-1",
    };
    const getPortfolio = vi.fn(async () => ({
      walletAvailableUSDC: 125,
      walletLockedUSDC: 12.5,
      walletTotalUSDC: 137.5,
      walletBalance: 137.5,
      totalValue: 20,
      totalCostBasis: 18,
      totalRealizedPnl: 0,
      totalPnl: 2,
      positions: [
        {
          market: { id: "market-1", title: "Mexico vs England", status: "LIVE", resolveTime: null, createdAt: "2026-07-04T12:00:00.000Z" },
          outcomeId: "outcome-1",
          outcome: "Home -1.5",
          selection,
          shares: 40,
          avgCost: 0.45,
          currentPrice: 0.5,
          bestBid: 0.49,
          bestAsk: 0.51,
          bestBidSize: 100,
          bestAskSize: 110,
          valueTokens: 20,
          costBasisTokens: 18,
          totalCostBasisTokens: 18,
          pnlTokens: 2,
        },
      ],
      openOrders: [
        {
          id: "order-1",
          market: { id: "market-1", title: "Mexico vs England", status: "LIVE" },
          outcome: { id: "outcome-1", name: "Home -1.5" },
          selection,
          side: "BUY" as const,
          status: "OPEN",
          price: 0.44,
          size: 10,
          remaining: 10,
          reservedNotional: 4.4,
          createdAt: "2026-07-04T12:00:00.000Z",
          updatedAt: "2026-07-04T12:01:00.000Z",
        },
      ],
      comboOrders: [],
    }));
    const getPortfolioHistory = vi.fn(async () => ({
      history: [],
      canceledOrders: [],
      recentTrades: [
        {
          id: "trade-1",
          market: { id: "market-1", title: "Mexico vs England", status: "LIVE" },
          outcome: { id: "outcome-1", name: "Home -1.5" },
          selection,
          side: "BUY" as const,
          shares: 40,
          cost: 18,
          fee: 0,
          createdAt: "2026-07-04T12:02:00.000Z",
        },
      ],
    }));

    await expect(loadServerPortfolioState({ getPortfolio, getPortfolioHistory } as any)).resolves.toMatchObject({
      syncStatus: "synced",
      snapshot: {
        balance: 125,
        positions: [
          {
            mode: "server",
            marketId: "market-1",
            outcomeId: "outcome-1",
            selection: { marketType: "spread", displayLabel: "Home -1.5" },
            currentValue: 20,
            pnl: 2,
          },
        ],
        openOrders: [
          {
            id: "order-1",
            side: "buy",
            selection: { marketType: "spread", displayLabel: "Home -1.5" },
          },
        ],
      },
      activities: [
        {
          id: "trade-trade-1",
          action: "opened",
          selection: { marketType: "spread", displayLabel: "Home -1.5" },
          fillCount: 1,
        },
      ],
    });
    expect(getPortfolio).toHaveBeenCalledTimes(1);
    expect(getPortfolioHistory).toHaveBeenCalledTimes(1);
  });
});
