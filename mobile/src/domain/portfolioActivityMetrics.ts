export type ActivityMetricInput = {
  amount: number;
  entryAmount?: number;
  probability?: number;
  shares?: number;
};

export const decimalOdds = (price: number) => `${(1 / Math.max(price, 0.01)).toFixed(1)}x`;

export const activityShares = (activity: ActivityMetricInput) => {
  if (typeof activity.shares === "number" && Number.isFinite(activity.shares)) {
    return activity.shares;
  }
  const price = Math.max(activity.probability ?? 0, 1) / 100;
  return activity.amount / price;
};

export const activityPnl = (activity: ActivityMetricInput) => {
  const entryAmount = activity.entryAmount ?? activity.amount;
  return activity.amount - entryAmount;
};
