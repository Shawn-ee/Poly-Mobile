import type { Event, Market, Outcome } from "../mocks/worldCup";

export type HomeCardSelection = {
  market: Market;
  outcome: Outcome;
  role: "home" | "draw" | "away";
};

const normalizedText = (value: string | null | undefined) =>
  `${value ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const marketSearchKey = (market: Market) =>
  normalizedText(`${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title} ${market.externalSlug ?? ""} ${market.externalMarketId ?? ""}`);

const yesOutcome = (market: Market) =>
  market.outcomes.find((outcome) => outcome.side === "yes" || /^yes$/i.test(outcome.label)) ?? market.outcomes[0];

const isProviderBinaryRegulationMarket = (market: Market) =>
  market.type === "game-line" &&
  ["moneyline", "match_winner_1x2", "winner"].includes(market.marketType ?? "") &&
  market.outcomes.length === 2 &&
  Boolean(yesOutcome(market));

const isProviderDrawMarket = (market: Market) => {
  const key = marketSearchKey(market);
  return key.includes(" draw ") || key.endsWith(" draw") || key.includes(" end in a draw");
};

const selectionFromMarket = (
  market: Market | undefined,
  labelText: string,
  role: HomeCardSelection["role"],
  color: string,
): HomeCardSelection | null => {
  const sourceOutcome = market ? yesOutcome(market) : undefined;
  if (!market || !sourceOutcome) return null;
  return {
    market,
    role,
    outcome: {
      ...sourceOutcome,
      label: labelText,
      zhLabel: labelText,
      side: role,
      color,
    },
  };
};

export const homeCardSelectionsForEvent = (event: Event): HomeCardSelection[] => {
  const hasRegulationProfile = event.marketProfile === "regulation_90" || event.supportedMarketTypes?.includes("regulation_90");
  const canDisplayRegulationRows = hasRegulationProfile && (
    ["can_draw", "can_draw_90"].includes(event.resultMode ?? "") ||
    event.primaryMarketProfile === "advance" ||
    event.resultMode === "must_advance"
  );
  if (!canDisplayRegulationRows) {
    return [];
  }

  const [homeTeam, awayTeam] = event.teams;
  const homeName = homeTeam?.name ?? "";
  const awayName = awayTeam?.name ?? "";
  if (!homeName || !awayName) return [];

  const candidates = event.markets.filter(isProviderBinaryRegulationMarket);
  const drawMarket = candidates.find(isProviderDrawMarket);
  const nonDrawMarkets = candidates.filter((market) => !isProviderDrawMarket(market));
  const homeNeedle = normalizedText(homeName);
  const awayNeedle = normalizedText(awayName);
  const homeMarket = nonDrawMarkets.find((market) => marketSearchKey(market).includes(homeNeedle)) ?? nonDrawMarkets[0];
  const awayMarket =
    nonDrawMarkets.find((market) => marketSearchKey(market).includes(awayNeedle) && market.id !== homeMarket?.id) ??
    nonDrawMarkets.find((market) => market.id !== homeMarket?.id);

  const selections = [
    selectionFromMarket(homeMarket, homeName, "home", "#2563eb"),
    selectionFromMarket(drawMarket, "Draw", "draw", "#60a5fa"),
    selectionFromMarket(awayMarket, awayName, "away", "#ef4444"),
  ].filter((selection): selection is HomeCardSelection => Boolean(selection));

  const uniqueMarketIds = new Set(selections.map((selection) => selection.market.id));
  return selections.length === 3 && uniqueMarketIds.size === 3 ? selections : [];
};
