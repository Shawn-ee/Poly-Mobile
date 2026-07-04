import type { PortfolioValueHistory, PortfolioValueHistoryRange } from "../types";

export type PortfolioValueHistoryInput = {
  range: PortfolioValueHistoryRange;
  cash: number;
  positionsValue: number;
  pnl: number;
  now?: string;
};

const rangeSteps: Record<PortfolioValueHistoryRange, number> = {
  "1D": 6,
  "1W": 7,
  "1M": 8,
  All: 9,
};

const rangeHours: Record<PortfolioValueHistoryRange, number> = {
  "1D": 24,
  "1W": 24 * 7,
  "1M": 24 * 30,
  All: 24 * 90,
};

export const deterministicPortfolioValueHistory = ({
  range,
  cash,
  positionsValue,
  pnl,
  now = "2026-07-04T12:00:00.000Z",
}: PortfolioValueHistoryInput): PortfolioValueHistory => {
  const totalValue = cash + positionsValue;
  const steps = rangeSteps[range];
  const intervalMs = (rangeHours[range] * 60 * 60 * 1000) / Math.max(steps - 1, 1);
  const end = new Date(now).getTime();
  const amplitude = Math.max(Math.abs(pnl), totalValue * 0.004, 1);
  const points = Array.from({ length: steps }, (_, index) => {
    const progress = index / Math.max(steps - 1, 1);
    const curve = Math.sin(progress * Math.PI * 2) * amplitude * 0.35 - (1 - progress) * amplitude;
    const value = Number(Math.max(totalValue + curve, 0).toFixed(2));
    const positionsShare = totalValue > 0 ? positionsValue / totalValue : 0;
    return {
      timestamp: new Date(end - (steps - 1 - index) * intervalMs).toISOString(),
      value,
      cash: Number(Math.max(value * (1 - positionsShare), 0).toFixed(2)),
      positionsValue: Number(Math.max(value * positionsShare, 0).toFixed(2)),
      pnl: Number((value - totalValue + pnl).toFixed(2)),
    };
  });

  return {
    range,
    ranges: ["1D", "1W", "1M", "All"],
    source: "deterministic-mobile-fallback",
    status: points.length ? "ready" : "empty",
    generatedAt: now,
    lastUpdated: points.at(-1)?.timestamp ?? null,
    emptyState: points.length ? null : "no-history",
    points,
  };
};
