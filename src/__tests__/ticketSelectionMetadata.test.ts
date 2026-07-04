import { buildTicketSelectionMetadata } from "@/server/services/ticketSelectionMetadata";

describe("ticket selection metadata", () => {
  test("derives selected line identity and YES/NO contract side from market and outcome rows", () => {
    expect(
      buildTicketSelectionMetadata({
        market: {
          id: "world-cup-spread-1h",
          title: "Japan vs Morocco spread",
          marketGroupKey: "spreads",
          marketType: "spread",
          line: { toString: () => "-1.5" },
          period: "1H",
          referenceSource: "polymarket",
          externalMarketId: "gamma-world-cup-spread-1h",
          conditionId: "condition-world-cup-spread-1h",
        },
        outcome: {
          id: "spread-yes",
          name: "YES",
          label: "Japan",
          side: "yes",
          referenceTokenId: "token-spread-yes",
          referenceOutcomeLabel: "Japan",
        },
      }),
    ).toEqual({
      marketId: "world-cup-spread-1h",
      outcomeId: "spread-yes",
      marketGroupId: "spreads",
      marketType: "spread",
      line: "-1.5",
      period: "1H",
      side: "yes",
      displayLabel: "Japan -1.5 1H",
      contractSide: "yes",
      referenceSource: "polymarket",
      providerSource: "polymarket",
      externalMarketId: "gamma-world-cup-spread-1h",
      conditionId: "condition-world-cup-spread-1h",
      referenceTokenId: "token-spread-yes",
      tokenId: "token-spread-yes",
      referenceOutcomeLabel: "Japan",
    });
  });

  test("prefers a matching Book snapshot over current market fallback fields", () => {
    const selection = buildTicketSelectionMetadata({
      requestBody: {
        selection: {
          marketId: "selected-spread-market",
          outcomeId: "selected-spread-yes",
          marketGroupId: "spreads",
          marketType: "spread",
          line: "1.5",
          period: "regulation",
          side: "yes",
          displayLabel: "Mexico +1.5 regulation",
          contractSide: "yes",
          providerSource: "polymarket",
          externalMarketId: "gamma-selected-spread",
          conditionId: "condition-selected-spread",
          tokenId: "token-selected-spread-yes",
          referenceOutcomeLabel: "Mexico +1.5",
        },
      },
      market: {
        id: "selected-spread-market",
        title: "Mexico vs Ecuador moneyline fallback label",
        marketGroupKey: "moneyline",
        marketType: "match_winner_1x2",
        line: null,
        period: "regulation",
        referenceSource: "polymarket",
        externalMarketId: "gamma-moneyline-fallback",
        conditionId: "condition-moneyline-fallback",
      },
      outcome: {
        id: "selected-spread-yes",
        name: "YES",
        label: "Mexico moneyline",
        side: "home",
        referenceTokenId: "token-moneyline-yes",
        referenceOutcomeLabel: "Mexico moneyline",
      },
    });

    expect(selection).toEqual(
      expect.objectContaining({
        marketId: "selected-spread-market",
        outcomeId: "selected-spread-yes",
        marketGroupId: "spreads",
        marketType: "spread",
        line: "1.5",
        period: "regulation",
        side: "yes",
        displayLabel: "Mexico +1.5 regulation",
        providerSource: "polymarket",
        externalMarketId: "gamma-selected-spread",
        conditionId: "condition-selected-spread",
        tokenId: "token-selected-spread-yes",
      }),
    );
    expect(selection.marketType).not.toBe("match_winner_1x2");
    expect(selection.displayLabel).not.toContain("moneyline");
  });
});
