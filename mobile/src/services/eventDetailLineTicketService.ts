import type { Market, Outcome } from "../mocks/worldCup";
import type { TicketSelection } from "../components/TradeTicket";

type SyntheticLineMarkets = {
  spread?: Market;
  totals?: Market;
  teamTotal?: Market;
};

type ResolveLineTicketTargetInput = {
  selection?: TicketSelection;
  backendMarket?: Market;
  backendOutcome?: Outcome;
  syntheticOutcome?: Outcome;
  syntheticMarkets: SyntheticLineMarkets;
  fallbackMarket?: Market;
};

const syntheticMarketForSelection = (selection: TicketSelection | undefined, markets: SyntheticLineMarkets) => {
  if (selection?.marketType === "spread") return markets.spread;
  if (selection?.marketType === "totals") return markets.totals;
  if (selection?.marketType === "team-total") return markets.teamTotal;
  return undefined;
};

const numberFromLine = (line: string | null | undefined) => {
  const parsed = Number(line);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizedPeriod = (period: string | null | undefined) => {
  if (!period) return null;
  const normalized = period.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (normalized === "reg-time" || normalized === "regulation-time" || normalized === "regulation") return "regulation";
  if (normalized === "1st-half" || normalized === "first-half") return "first-half";
  if (normalized === "2nd-half" || normalized === "second-half") return "second-half";
  if (normalized === "full-game") return "full-game";
  return normalized;
};

const backendLineMatchesSelection = (selection: TicketSelection | undefined, market: Market | undefined) => {
  if (!selection || !["spread", "totals", "team-total"].includes(selection.marketType)) return true;
  const selectedLine = numberFromLine(selection.line);
  const marketLine = numberFromLine(market?.line);
  if (selectedLine == null || marketLine == null) return false;
  const selectedPeriod = normalizedPeriod(selection.period);
  const marketPeriod = normalizedPeriod(market?.period);
  if (selectedPeriod && marketPeriod && selectedPeriod !== marketPeriod) return false;
  return Math.abs(Math.abs(marketLine) - Math.abs(selectedLine)) < 0.001;
};

export const resolveLineTicketTarget = ({
  selection,
  backendMarket,
  backendOutcome,
  syntheticOutcome,
  syntheticMarkets,
  fallbackMarket,
}: ResolveLineTicketTargetInput) => {
  const syntheticMarket = syntheticMarketForSelection(selection, syntheticMarkets);
  const isLineSelection = Boolean(syntheticMarket);
  const canUseBackendLineMarket = backendLineMatchesSelection(selection, backendMarket);

  if (isLineSelection && backendMarket && backendOutcome && canUseBackendLineMarket) {
    return { market: backendMarket, outcome: backendOutcome, source: "backend-line-market" as const };
  }

  if (isLineSelection && syntheticMarket && syntheticOutcome) {
    return { market: syntheticMarket, outcome: syntheticOutcome, source: "deterministic-line-fixture" as const };
  }

  if (backendMarket && backendOutcome) {
    return { market: backendMarket, outcome: backendOutcome, source: "backend-market" as const };
  }

  if (fallbackMarket && syntheticOutcome) {
    return { market: fallbackMarket, outcome: syntheticOutcome, source: "fallback-market" as const };
  }

  return null;
};
