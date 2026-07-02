export type PositionMetricInput = {
  side: "buy" | "sell";
  amount: number;
  probability: number;
  currentValue?: number;
  pnl?: number;
};

const currentProbability = (position: PositionMetricInput) => {
  const movement = position.side === "buy" ? 3 : -3;
  return Math.max(1, Math.min(99, position.probability + movement));
};

export const portfolioPositionValue = (position: PositionMetricInput) => {
  if (typeof position.currentValue === "number") return position.currentValue;
  const entry = Math.max(1, position.probability);
  return position.amount * (currentProbability(position) / entry);
};

export const estimatedPositionPnl = (position: PositionMetricInput) => {
  if (typeof position.pnl === "number") return position.pnl;
  const value = portfolioPositionValue(position);
  return position.side === "buy" ? value - position.amount : position.amount - value;
};
