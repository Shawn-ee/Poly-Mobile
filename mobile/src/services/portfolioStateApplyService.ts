import type { PortfolioActivity } from "../components/Portfolio";
import type { ServerPortfolioState } from "./portfolioSyncService";
import type { PortfolioSnapshotResult } from "./portfolioSnapshotService";

export type LocalPortfolioState = {
  balance: number;
  positions: PortfolioSnapshotResult["positions"];
  openOrders: PortfolioSnapshotResult["openOrders"];
  activities: PortfolioActivity[];
};

export const applyServerPortfolioState = (
  current: LocalPortfolioState,
  serverState: ServerPortfolioState,
): LocalPortfolioState => ({
  balance: serverState.snapshot ? serverState.snapshot.balance : current.balance,
  positions: serverState.snapshot ? serverState.snapshot.positions : current.positions,
  openOrders: serverState.snapshot ? serverState.snapshot.openOrders : current.openOrders,
  activities: serverState.activities ? serverState.activities : current.activities,
});
