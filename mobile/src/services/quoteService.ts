import type { PolyApi } from "../api";
import type { Quote } from "../types";

export type TicketQuote = {
  outcomeId: string;
  outcomeName: string;
  probability: number;
  bestBid: number | null;
  bestAsk: number | null;
  midPrice: number | null;
  lastPrice: number | null;
};

type QuoteableOutcome = {
  id: string;
  label: string;
  probability: number;
};

const toDecimal = (value: string | number | null): number | null => {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  return parsed > 1 ? parsed / 100 : parsed;
};

const toProbability = (value: number | null) => (value === null ? null : Math.round(Math.max(0, Math.min(1, value)) * 100));

export const quoteToTicketQuote = (quote: Quote): TicketQuote => {
  const bestBid = toDecimal(quote.bestBid);
  const bestAsk = toDecimal(quote.bestAsk);
  const midPrice = toDecimal(quote.midPrice);
  const lastPrice = toDecimal(quote.lastPrice);
  const fallbackMid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;
  const probability = toProbability(midPrice ?? lastPrice ?? fallbackMid ?? bestAsk ?? bestBid) ?? 0;
  return {
    outcomeId: quote.outcomeId,
    outcomeName: quote.outcomeName,
    probability,
    bestBid: toProbability(bestBid),
    bestAsk: toProbability(bestAsk),
    midPrice: toProbability(midPrice),
    lastPrice: toProbability(lastPrice),
  };
};

export const loadTicketQuotes = async (api: PolyApi, marketId: string, outcomeId?: string): Promise<TicketQuote[]> => {
  const payload = await api.getMarketQuote(marketId, outcomeId);
  return payload.quotes.map(quoteToTicketQuote);
};

export const applyTicketQuoteToOutcome = <TOutcome extends QuoteableOutcome>(
  outcome: TOutcome,
  quotes: TicketQuote[],
): TOutcome => {
  const normalizedLabel = outcome.label.trim().toLowerCase();
  const quote = quotes.find(
    (item) =>
      item.outcomeId === outcome.id ||
      item.outcomeName.trim().toLowerCase() === normalizedLabel,
  );

  if (!quote) return outcome;
  return {
    ...outcome,
    probability: quote.probability,
  };
};

export const applyTicketQuotesToMarket = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { outcomes: TOutcome[] },
>(
  market: TMarket,
  quotes: TicketQuote[],
): TMarket => {
  let changed = false;
  const outcomes = market.outcomes.map((outcome) => {
    const quotedOutcome = applyTicketQuoteToOutcome(outcome, quotes);
    if (quotedOutcome !== outcome) changed = true;
    return quotedOutcome;
  });

  if (!changed) return market;
  return {
    ...market,
    outcomes,
  };
};

export const applyTicketQuotesToEvent = <
  TOutcome extends QuoteableOutcome,
  TMarket extends { id: string; outcomes: TOutcome[] },
  TEvent extends { markets: TMarket[] },
>(
  event: TEvent,
  quotesByMarketId: Map<string, TicketQuote[]>,
): TEvent => {
  let changed = false;
  const markets = event.markets.map((market) => {
    const quotes = quotesByMarketId.get(market.id);
    if (!quotes) return market;
    const quotedMarket = applyTicketQuotesToMarket(market, quotes);
    if (quotedMarket !== market) changed = true;
    return quotedMarket;
  });

  if (!changed) return event;
  return {
    ...event,
    markets,
  };
};
