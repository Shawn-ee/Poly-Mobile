import type { Position } from "../components/Portfolio";
import type { Event, Market, Outcome } from "../mocks/worldCup";

export type PositionTradeTarget = {
  event?: Event;
  market: Market;
  outcome: Outcome;
};

const findOutcome = (market: Market, position: Position) =>
  market.outcomes.find((outcome) => outcome.id === position.outcomeId) ??
  market.outcomes.find((outcome) => outcome.label === position.outcome);

const withPositionQuote = (outcome: Outcome, position: Position): Outcome => {
  if (
    position.currentPrice === undefined &&
    position.bestBid === undefined &&
    position.bestAsk === undefined &&
    position.bestBidSize === undefined &&
    position.bestAskSize === undefined
  ) {
    return outcome;
  }
  return {
    ...outcome,
    probability: position.currentPrice === undefined ? outcome.probability : Math.round(position.currentPrice * 100),
    bestBid: position.bestBid ?? outcome.bestBid ?? null,
    bestAsk: position.bestAsk ?? outcome.bestAsk ?? null,
    bestBidSize: position.bestBidSize ?? outcome.bestBidSize ?? null,
    bestAskSize: position.bestAskSize ?? outcome.bestAskSize ?? null,
  };
};

const marketMatches = (market: Market, position: Position) =>
  market.id === position.marketId || market.title === position.title;

export const resolvePositionTradeTarget = ({
  position,
  futures,
  events,
}: {
  position: Position;
  futures: Market[];
  events: Event[];
}): PositionTradeTarget | undefined => {
  for (const market of futures) {
    if (!marketMatches(market, position)) continue;
    const outcome = findOutcome(market, position);
    if (outcome) return { market, outcome: withPositionQuote(outcome, position) };
  }

  for (const event of events) {
    for (const market of event.markets) {
      if (!marketMatches(market, position)) continue;
      const outcome = findOutcome(market, position);
      if (outcome) return { event, market, outcome: withPositionQuote(outcome, position) };
    }
  }

  return undefined;
};
