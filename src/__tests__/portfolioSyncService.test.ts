import { describe, expect, test } from "vitest";
import type { PortfolioActivity } from "../components/Portfolio";
import { resolvePortfolioSyncResults } from "../services/portfolioSyncService";
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
});
