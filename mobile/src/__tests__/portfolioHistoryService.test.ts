import { describe, expect, test } from "vitest";
import { canceledOrdersToActivity, portfolioHistoryToActivity } from "../services/portfolioHistoryService";
import type { PortfolioHistoryItem } from "../types";

const historyItem = (overrides: Partial<PortfolioHistoryItem> = {}): PortfolioHistoryItem => ({
  market: {
    id: "world-cup-final",
    title: "World Cup final winner",
    status: "RESOLVED",
    resolveTime: "2026-07-19T22:30:00.000Z",
    resolvedOutcomeId: "france",
    createdAt: "2026-07-01T14:00:00.000Z",
  },
  resolvedOutcomeName: "France",
  totalBuyCostTokens: 100,
  totalSellProceedsTokens: 0,
  netInvestedTokens: 100,
  winningsTokens: 172.5,
  refundsTokens: 0,
  realizedPnLTokens: 72.5,
  ...overrides,
});

describe("portfolio history activity mapping", () => {
  test("maps resolved backend history into timestamped closed activity", () => {
    expect(portfolioHistoryToActivity([historyItem()])).toEqual([
      expect.objectContaining({
        id: "history-world-cup-final",
        action: "closed",
        title: "World Cup final winner",
        outcome: "France",
        amount: 172.5,
        entryAmount: 100,
        timestamp: "Jul 19, 5:30 PM",
      }),
    ]);
  });

  test("falls back to market creation time when resolve time is unavailable", () => {
    expect(
      portfolioHistoryToActivity([
        historyItem({
          market: {
            id: "world-cup-group",
            title: "World Cup group winner",
            status: "RESOLVED",
            resolveTime: null,
            resolvedOutcomeId: "brazil",
            createdAt: "2026-06-12T18:05:00.000Z",
          },
          resolvedOutcomeName: null,
          winningsTokens: 0,
          refundsTokens: 0,
          netInvestedTokens: 64,
        }),
      ]),
    ).toEqual([
      expect.objectContaining({
        id: "history-world-cup-group",
        outcome: "Resolved",
        amount: 64,
        entryAmount: 64,
        timestamp: "Jun 12, 1:05 PM",
      }),
    ]);
  });

  test("maps backend canceled orders into durable canceled activity rows", () => {
    expect(
      canceledOrdersToActivity([
        {
          id: "order-canceled-1",
          market: {
            id: "world-cup-winner",
            title: "Will France win the 2026 FIFA World Cup?",
            status: "LIVE",
          },
          outcome: {
            id: "yes",
            name: "YES",
          },
          side: "BUY",
          status: "CANCELED",
          price: 0.5,
          size: 200,
          remaining: 100,
          canceledAt: "2026-07-02T05:55:00.000Z",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: "canceled-order-order-canceled-1",
        action: "canceled",
        title: "Will France win the 2026 FIFA World Cup?",
        outcome: "YES",
        amount: 100,
        side: "buy",
        probability: 50,
        timestamp: "Jul 2, 12:55 AM",
      }),
    ]);
  });
});
