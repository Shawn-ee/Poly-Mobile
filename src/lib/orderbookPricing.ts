import { prisma } from "@/lib/db";

const midFromBest = (bestBid: number | null, bestAsk: number | null) => {
  if (bestBid !== null && bestAsk !== null) return (bestBid + bestAsk) / 2;
  if (bestBid !== null) return bestBid;
  if (bestAsk !== null) return bestAsk;
  return 0.5;
};

export const getOutcomeMidPrices = async (marketId: string, outcomeIds: string[]) => {
  if (!outcomeIds.length) return new Map<string, number>();

  const [buyRows, sellRows] = await Promise.all([
    prisma.order.groupBy({
      by: ["outcomeId"],
      where: {
        marketId,
        outcomeId: { in: outcomeIds },
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
      },
      _max: { price: true },
    }),
    prisma.order.groupBy({
      by: ["outcomeId"],
      where: {
        marketId,
        outcomeId: { in: outcomeIds },
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
      },
      _min: { price: true },
    }),
  ]);

  const buyByOutcome = new Map(
    buyRows.map((row) => [row.outcomeId, row._max.price ? Number(row._max.price) : null])
  );
  const sellByOutcome = new Map(
    sellRows.map((row) => [row.outcomeId, row._min.price ? Number(row._min.price) : null])
  );

  const result = new Map<string, number>();
  for (const outcomeId of outcomeIds) {
    result.set(
      outcomeId,
      midFromBest(
        buyByOutcome.get(outcomeId) ?? null,
        sellByOutcome.get(outcomeId) ?? null
      )
    );
  }

  return result;
};
