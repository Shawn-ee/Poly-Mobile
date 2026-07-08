export type PortfolioValueHistoryRange = "1D" | "1W" | "1M" | "All";

export type PortfolioValueHistoryPosition = {
  marketId: string;
  outcomeId: string;
  shares: unknown;
  avgCost: unknown;
};

export type PortfolioValueHistorySnapshot = {
  marketId: string;
  outcomeId: string;
  ts: Date;
  price: unknown;
};

export type PortfolioValueHistoryInput = {
  range: PortfolioValueHistoryRange;
  now?: Date;
  walletAvailableUSDC: unknown;
  walletLockedUSDC: unknown;
  positions: PortfolioValueHistoryPosition[];
  snapshots: PortfolioValueHistorySnapshot[];
};

const ranges: PortfolioValueHistoryRange[] = ["1D", "1W", "1M", "All"];

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

const toNumber = (value: unknown) => Number(value ?? 0);

export function getPortfolioValueHistoryStart(range: PortfolioValueHistoryRange, now = new Date()) {
  return new Date(now.getTime() - rangeHours[range] * 60 * 60 * 1000);
}

export function parsePortfolioValueHistoryRange(value: string | null): PortfolioValueHistoryRange | null {
  if (!value) return "1D";
  return ranges.includes(value as PortfolioValueHistoryRange) ? (value as PortfolioValueHistoryRange) : null;
}

export function buildPortfolioValueHistory({
  range,
  now = new Date(),
  walletAvailableUSDC,
  walletLockedUSDC,
  positions,
  snapshots,
}: PortfolioValueHistoryInput) {
  const cash = toNumber(walletAvailableUSDC) + toNumber(walletLockedUSDC);
  const steps = rangeSteps[range];
  const start = getPortfolioValueHistoryStart(range, now);
  const intervalMs = (now.getTime() - start.getTime()) / Math.max(steps - 1, 1);
  const snapshotsByKey = new Map<string, PortfolioValueHistorySnapshot[]>();

  for (const snapshot of snapshots) {
    const key = `${snapshot.marketId}:${snapshot.outcomeId}`;
    const existing = snapshotsByKey.get(key) ?? [];
    existing.push(snapshot);
    snapshotsByKey.set(key, existing);
  }

  for (const rows of snapshotsByKey.values()) {
    rows.sort((a, b) => a.ts.getTime() - b.ts.getTime());
  }

  const costBasis = positions.reduce(
    (sum, position) => sum + toNumber(position.shares) * toNumber(position.avgCost),
    0,
  );
  const hasSnapshotPrices = snapshots.length > 0;

  const points = Array.from({ length: steps }, (_, index) => {
    const timestamp = new Date(start.getTime() + intervalMs * index);
    const positionsValue = positions.reduce((sum, position) => {
      const key = `${position.marketId}:${position.outcomeId}`;
      const rows = snapshotsByKey.get(key) ?? [];
      let price = toNumber(position.avgCost);
      for (const row of rows) {
        if (row.ts.getTime() <= timestamp.getTime()) {
          price = toNumber(row.price);
        } else {
          break;
        }
      }
      return sum + toNumber(position.shares) * price;
    }, 0);
    const value = cash + positionsValue;

    return {
      timestamp: timestamp.toISOString(),
      value: Number(value.toFixed(2)),
      cash: Number(cash.toFixed(2)),
      positionsValue: Number(positionsValue.toFixed(2)),
      pnl: Number((positionsValue - costBasis).toFixed(2)),
    };
  });

  const hasValue = cash > 0 || positions.length > 0;

  return {
    range,
    ranges,
    source: "portfolio-value-history-route" as const,
    status: hasValue ? "ready" as const : "empty" as const,
    generatedAt: now.toISOString(),
    lastUpdated: hasSnapshotPrices ? snapshots[snapshots.length - 1]?.ts.toISOString() ?? null : points.at(-1)?.timestamp ?? null,
    emptyState: hasValue ? null : "no-history" as const,
    points: hasValue ? points : [],
  };
}
