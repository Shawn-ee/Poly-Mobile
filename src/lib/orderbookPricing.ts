import { prisma } from "@/lib/db";

const midFromBest = (bestBid: number | null, bestAsk: number | null) => {
  if (bestBid !== null && bestAsk !== null) return (bestBid + bestAsk) / 2;
  if (bestBid !== null) return bestBid;
  if (bestAsk !== null) return bestAsk;
  return 0.5;
};

export type OutcomeQuote = {
  bestBid: number | null;
  bestAsk: number | null;
  mid: number;
  spread: number | null;
};

export const getOutcomeMidPrices = async (marketId: string, outcomeIds: string[]) => {
  const quotes = await getOutcomeQuotes(marketId, outcomeIds);
  return new Map(Array.from(quotes.entries()).map(([outcomeId, quote]) => [outcomeId, quote.mid]));
};

export const getOutcomeQuotes = async (marketId: string, outcomeIds: string[]) => {
  if (!outcomeIds.length) return new Map<string, OutcomeQuote>();

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
    buyRows.map((row) => [row.outcomeId, row._max.price ? Number(row._max.price) : null]),
  );
  const sellByOutcome = new Map(
    sellRows.map((row) => [row.outcomeId, row._min.price ? Number(row._min.price) : null]),
  );

  const result = new Map<string, OutcomeQuote>();
  for (const outcomeId of outcomeIds) {
    const bestBid = buyByOutcome.get(outcomeId) ?? null;
    const bestAsk = sellByOutcome.get(outcomeId) ?? null;
    result.set(outcomeId, {
      bestBid,
      bestAsk,
      mid: midFromBest(bestBid, bestAsk),
      spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null,
    });
  }

  return result;
};
