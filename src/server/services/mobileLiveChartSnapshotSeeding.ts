import { Prisma } from "@prisma/client";

type OutcomeInput = {
  id: string;
  displayOrder?: number | null;
};

export type LiveChartSnapshotRow = {
  outcomeId: string;
  timestamp: Date;
  probability: number;
  price: Prisma.Decimal;
};

const clampProbability = (value: number) => Math.max(1, Math.min(99, Math.round(value)));

const normalizeWeights = (weights: number[]) => {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) {
    return weights.map(() => Math.round(100 / weights.length));
  }
  return weights.map((value) => clampProbability((value / total) * 100));
};

export const buildMobileLiveChartSnapshotRows = (
  outcomes: OutcomeInput[],
  baseTime: Date,
): LiveChartSnapshotRow[] => {
  const orderedOutcomes = [...outcomes].sort(
    (left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0),
  );
  if (orderedOutcomes.length === 0) return [];

  const pointCount = 8;
  const intervalMs = 15 * 60 * 1000;
  const startMs = baseTime.getTime() - (pointCount - 1) * intervalMs;

  return Array.from({ length: pointCount }).flatMap((_, index) => {
    const rawWeights = orderedOutcomes.map((_, outcomeIndex) => {
      const base = outcomeIndex === 0 ? 42 : outcomeIndex === 1 ? 29 : 100 / orderedOutcomes.length;
      const wave = Math.sin((index + 1) * (outcomeIndex + 1) * 0.72) * (5 - Math.min(outcomeIndex, 3));
      const drift = outcomeIndex === 0 ? index * 0.85 : outcomeIndex === 1 ? -index * 0.45 : index * 0.15;
      return Math.max(4, base + wave + drift);
    });
    const probabilities = normalizeWeights(rawWeights);
    const timestamp = new Date(startMs + index * intervalMs);
    return orderedOutcomes.map((outcome, outcomeIndex) => ({
      outcomeId: outcome.id,
      timestamp,
      probability: probabilities[outcomeIndex] ?? clampProbability(100 / orderedOutcomes.length),
      price: new Prisma.Decimal(((probabilities[outcomeIndex] ?? 50) / 100).toFixed(6)),
    }));
  });
};

