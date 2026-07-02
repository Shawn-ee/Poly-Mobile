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
    if (outcome) return { market, outcome };
  }

  for (const event of events) {
    for (const market of event.markets) {
      if (!marketMatches(market, position)) continue;
      const outcome = findOutcome(market, position);
      if (outcome) return { event, market, outcome };
    }
  }

  return undefined;
};
