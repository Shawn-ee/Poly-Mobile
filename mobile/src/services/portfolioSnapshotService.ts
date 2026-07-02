import type { PolyApi } from "../api";
import type { OpenOrder, Position } from "../components/Portfolio";

export type PortfolioSnapshotResult = {
  balance: number;
  positions: Position[];
  openOrders: OpenOrder[];
};

export const loadPortfolioSnapshot = async (api: PolyApi): Promise<PortfolioSnapshotResult> => {
  const snapshot = await api.getPortfolio();
  return {
    balance: snapshot.walletAvailableUSDC,
    positions: snapshot.positions.map((position) => ({
      id: `server-${position.market.id}-${position.outcome}`,
      mode: "server",
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      title: position.market.title,
      outcome: position.outcome,
      side: "buy",
      amount: position.costBasisTokens,
      probability: Math.round(position.avgCost * 100),
      shares: position.shares,
      currentPrice: position.currentPrice,
      currentValue: position.valueTokens,
      pnl: position.pnlTokens,
    })),
    openOrders: snapshot.openOrders.map((order) => ({
      id: order.id,
      title: order.market.title,
      outcome: order.outcome.name,
      side: order.side === "SELL" ? "sell" : "buy",
      status: order.status,
      price: order.price,
      remaining: order.remaining,
      remainingShares: order.remaining,
      orderValue: order.remaining * order.price,
    })),
  };
};
