import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

const midFromBest = (bestBid: number | null, bestAsk: number | null) => {
  if (bestBid !== null && bestAsk !== null) return (bestBid + bestAsk) / 2;
  if (bestBid !== null) return bestBid;
  if (bestAsk !== null) return bestAsk;
  return 0.5;
};

export type OutcomeQuote = {
  bestBid: number | null;
  bestAsk: number | null;
  bestBidSize: number | null;
  bestAskSize: number | null;
  mid: number;
  spread: number | null;
  hasQuote: boolean;
};

export const getOutcomeMidPrices = async (marketId: string, outcomeIds: string[]) => {
  const quotes = await getOutcomeQuotes(marketId, outcomeIds);
  return new Map(Array.from(quotes.entries()).map(([outcomeId, quote]) => [outcomeId, quote.mid]));
};

export const getOutcomeQuotes = async (marketId: string, outcomeIds: string[]) => {
  if (!outcomeIds.length) return new Map<string, OutcomeQuote>();

  const snapshot = await buildPublicOrderbookSnapshot({ marketId });
  const buyByOutcome = new Map(snapshot.bids.map((level) => [level.outcomeId, level]));
  const sellByOutcome = new Map(snapshot.asks.map((level) => [level.outcomeId, level]));

  const result = new Map<string, OutcomeQuote>();
  for (const outcomeId of outcomeIds) {
    const bestBidLevel = buyByOutcome.get(outcomeId) ?? null;
    const bestAskLevel = sellByOutcome.get(outcomeId) ?? null;
    const bestBid = bestBidLevel?.price ?? null;
    const bestAsk = bestAskLevel?.price ?? null;
    result.set(outcomeId, {
      bestBid,
      bestAsk,
      bestBidSize: bestBidLevel?.size ?? null,
      bestAskSize: bestAskLevel?.size ?? null,
      mid: midFromBest(bestBid, bestAsk),
      spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null,
      hasQuote: bestBid !== null || bestAsk !== null,
    });
  }

  return result;
};
