import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";

export type PortfolioSnapshotResult = {
  balance: number;
  positions: Position[];
};

export const loadPortfolioSnapshot = async (api: PolyApi): Promise<PortfolioSnapshotResult> => {
  const snapshot = await api.getPortfolio();
  return {
    balance: snapshot.walletAvailableUSDC,
    positions: snapshot.positions.map((position) => ({
      id: `server-${position.market.id}-${position.outcome}`,
      mode: "server",
      title: position.market.title,
      outcome: position.outcome,
      side: "buy",
      amount: position.costBasisTokens,
      probability: Math.round(position.avgCost * 100),
    })),
  };
};
