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

  test("keeps order-time provider token identity after current labels and provider metadata drift", () => {
    const selection = buildTicketSelectionMetadata({
      requestBody: {
        selection: {
          marketId: "ef-selected-spread-market",
          outcomeId: "ef-selected-spread-yes",
          marketGroupId: "spreads",
          marketType: "spread",
          line: "-0.5",
          period: "2H",
          side: "yes",
          displayLabel: "Spain -0.5 2H",
          contractSide: "yes",
          referenceSource: "polymarket",
          providerSource: "polymarket",
          externalSlug: "ef-spain-japan-spread-original",
          externalMarketId: "gamma-ef-spread-original",
          conditionId: "condition-ef-spread-original",
          referenceTokenId: "token-ef-spread-yes-original",
          tokenId: "token-ef-spread-yes-original",
          referenceOutcomeLabel: "Spain -0.5",
        },
      },
      market: {
        id: "ef-selected-spread-market",
        title: "Spain vs Japan moneyline after refresh",
        marketGroupKey: "moneyline",
        marketType: "match_winner_1x2",
        line: null,
        period: "regulation",
        referenceSource: "refreshed-provider",
        externalSlug: "ef-moneyline-refreshed",
        externalMarketId: "gamma-ef-moneyline-refreshed",
        conditionId: "condition-ef-moneyline-refreshed",
      },
      outcome: {
        id: "ef-selected-spread-yes",
        name: "YES",
        label: "Spain moneyline refreshed",
        side: "home",
        referenceTokenId: "token-ef-moneyline-yes-refreshed",
        referenceOutcomeLabel: "Spain moneyline",
      },
    });

    expect(selection).toEqual(
      expect.objectContaining({
        marketGroupId: "spreads",
        marketType: "spread",
        line: "-0.5",
        period: "2H",
        side: "yes",
        displayLabel: "Spain -0.5 2H",
        providerSource: "polymarket",
        externalSlug: "ef-spain-japan-spread-original",
        externalMarketId: "gamma-ef-spread-original",
        conditionId: "condition-ef-spread-original",
        tokenId: "token-ef-spread-yes-original",
        referenceOutcomeLabel: "Spain -0.5",
      }),
    );
    expect(JSON.stringify(selection)).not.toContain("moneyline");
    expect(JSON.stringify(selection)).not.toContain("refreshed");
  });

  test("preserves Book-staged limit fields from the order request snapshot", () => {
    const selection = buildTicketSelectionMetadata({
      requestBody: {
        selection: {
          marketId: "book-selected-total-market",
          outcomeId: "book-selected-over",
          marketGroupId: "totals",
          marketType: "totals",
          line: "3.5",
          period: "2H",
          side: "over",
          displayLabel: "Over 3.5 2H",
          contractSide: "yes",
          referenceSource: "polymarket",
          externalMarketId: "gamma-book-total",
          conditionId: "condition-book-total",
          referenceTokenId: "token-book-total-over",
          referenceOutcomeLabel: "Over 3.5",
          limitPrice: 0.44,
          limitSide: "ask",
          limitShares: 125.5,
        },
      },
      market: {
        id: "book-selected-total-market",
        title: "Mexico vs Ecuador moneyline fallback label",
        marketGroupKey: "moneyline",
        marketType: "match_winner_1x2",
        line: null,
        period: "regulation",
      },
      outcome: {
        id: "book-selected-over",
        name: "YES",
        label: "Mexico moneyline",
        side: "home",
      },
    });

    expect(selection).toEqual(
      expect.objectContaining({
        marketId: "book-selected-total-market",
        outcomeId: "book-selected-over",
        marketType: "totals",
        displayLabel: "Over 3.5 2H",
        limitPrice: 0.44,
        limitSide: "ask",
        limitShares: 125.5,
      }),
    );
    expect(JSON.stringify(selection)).not.toContain("moneyline");
  });

  test("normalizes provider match winner fallback metadata for portfolio history", () => {
    const selection = buildTicketSelectionMetadata({
      market: {
        id: "egypt-winner-market",
        title: "Will Egypt win on 2026-07-07?",
        marketGroupKey: "main",
        marketType: "match_winner_1x2",
        line: null,
        period: "regulation",
        referenceSource: "polymarket",
        externalMarketId: "2793741",
        conditionId: "condition-egypt",
      },
      outcome: {
        id: "egypt-yes",
        name: "YES",
        label: "Egypt",
        side: "yes",
        referenceTokenId: "token-egypt-yes",
        referenceOutcomeLabel: "Yes",
      },
    });

    expect(selection).toEqual(
      expect.objectContaining({
        marketGroupId: "main",
        marketType: "winner",
        line: undefined,
        period: "regulation",
        side: "yes",
        displayLabel: "Egypt regulation",
        contractSide: "yes",
        referenceSource: "polymarket",
        externalMarketId: "2793741",
        conditionId: "condition-egypt",
        referenceTokenId: "token-egypt-yes",
      }),
    );
    expect(selection.marketType).not.toBe("prop");
    expect(selection.marketType).not.toBe("match_winner_1x2");
  });
});
