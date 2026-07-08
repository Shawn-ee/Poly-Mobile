type SelectionLike = {
  marketType?: string | null;
  marketGroupId?: string | null;
  referenceSource?: string | null;
  providerSource?: string | null;
};

type SelectionSummaryInput = {
  selection?: SelectionLike | null;
};

const LINE_MARKET_TYPES = new Set(["spread", "total_goals", "totals", "team_total_goals", "team-total", "team_total"]);

const isLineSelection = (selection: SelectionLike) => {
  const key = `${selection.marketType ?? ""} ${selection.marketGroupId ?? ""}`.toLowerCase();
  return LINE_MARKET_TYPES.has(`${selection.marketType ?? ""}`) || key.includes("spread") || key.includes("total");
};

const isRegulationWinnerSelection = (selection: SelectionLike) => {
  const key = `${selection.marketType ?? ""} ${selection.marketGroupId ?? ""}`.toLowerCase();
  return selection.marketType === "match_winner_1x2" || key.includes("regulation") || key.includes("winner") || key.includes("moneyline");
};

export const buildPortfolioSelectionSourceSummary = (items: SelectionSummaryInput[]) => {
  const selections = items
    .map((item) => item.selection)
    .filter((selection): selection is SelectionLike => Boolean(selection));
  const sourceBreakdown = selections.reduce<Record<string, number>>((result, selection) => {
    const source = selection.providerSource?.trim() || selection.referenceSource?.trim() || "unknown";
    result[source] = (result[source] ?? 0) + 1;
    return result;
  }, {});
  const lineSelections = selections.filter(isLineSelection);
  const regulationWinnerSelections = selections.filter(isRegulationWinnerSelection);
  const providerLineSelections = lineSelections.filter((selection) =>
    (selection.providerSource ?? selection.referenceSource) === "polymarket"
  );
  const fixtureLineSelections = lineSelections.filter((selection) =>
    (selection.providerSource ?? selection.referenceSource) === "contract-fixture"
  );
  const lineStatus =
    lineSelections.length === 0
      ? "missing"
      : providerLineSelections.length > 0
        ? "provider-backed"
        : fixtureLineSelections.length > 0
          ? "contract-fixture"
          : "unknown";

  return {
    totalSelectionCount: selections.length,
    sourceBreakdown,
    polymarketSelectionCount: sourceBreakdown.polymarket ?? 0,
    contractFixtureSelectionCount: sourceBreakdown["contract-fixture"] ?? 0,
    unknownSourceSelectionCount: sourceBreakdown.unknown ?? 0,
    regulationWinner: {
      totalCount: regulationWinnerSelections.length,
      polymarketCount: regulationWinnerSelections.filter((selection) =>
        (selection.providerSource ?? selection.referenceSource) === "polymarket"
      ).length,
      contractFixtureCount: regulationWinnerSelections.filter((selection) =>
        (selection.providerSource ?? selection.referenceSource) === "contract-fixture"
      ).length,
      status: regulationWinnerSelections.some((selection) =>
        (selection.providerSource ?? selection.referenceSource) === "polymarket"
      )
        ? "provider-backed"
        : regulationWinnerSelections.length > 0
          ? "non-provider"
          : "missing",
    },
    lineMarkets: {
      totalCount: lineSelections.length,
      polymarketCount: providerLineSelections.length,
      contractFixtureCount: fixtureLineSelections.length,
      status: lineStatus,
      families: Array.from(new Set(lineSelections.map((selection) => selection.marketType).filter((value): value is string => Boolean(value)))),
      reason:
        lineStatus === "provider-backed"
          ? "At least one portfolio line selection is provider-backed."
          : lineStatus === "contract-fixture"
            ? "Portfolio line selections are Local MVP contract fixtures until provider-backed line markets are available."
            : lineStatus === "missing"
              ? "No portfolio line selections are present."
              : "Portfolio line selection source is not classified.",
    },
  };
};
