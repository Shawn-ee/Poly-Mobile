import { validateMobileLiveProviderIdentityMappings } from "@/server/services/mobileLiveProviderIdentityAttach";

const compactMarkets = [
  {
    id: "market-1",
    title: "Curacao vs Cote d'Ivoire: Match Winner",
    status: "LIVE",
    referenceSource: "fifa_schedule",
    externalSlug: "local-slug",
    externalMarketId: "local-market",
    conditionId: null,
    marketGroupKey: "main",
    marketGroupTitle: "Main",
    displayOrder: 0,
    line: null,
    unit: null,
    period: null,
    marketType: "match_winner_1x2",
    propCategory: null,
    outcomes: [
      { id: "home", name: "Curacao", side: "home", displayOrder: 0, isTradable: true },
      { id: "draw", name: "Draw", side: "draw", displayOrder: 1, isTradable: true },
      { id: "away", name: "Cote d'Ivoire", side: "away", displayOrder: 2, isTradable: true },
    ],
  },
];

describe("mobile live provider identity validation", () => {
  test("accepts a complete provider mapping for every compact market outcome", () => {
    const validation = validateMobileLiveProviderIdentityMappings({
      compactMarkets,
      mappings: [
        {
          marketId: "market-1",
          referenceSource: "polymarket",
          externalSlug: "curacao-cote-divoire-match-winner",
          externalMarketId: "gamma-market-1",
          conditionId: "condition-1",
          outcomes: [
            { outcomeId: "home", referenceTokenId: "token-home", referenceOutcomeLabel: "Curacao" },
            { outcomeId: "draw", referenceTokenId: "token-draw", referenceOutcomeLabel: "Draw" },
            { outcomeId: "away", referenceTokenId: "token-away", referenceOutcomeLabel: "Cote d'Ivoire" },
          ],
        },
      ],
    });

    expect(validation).toEqual({
      valid: true,
      compactMarketCount: 1,
      requestedMarketCount: 1,
      errors: [],
    });
  });

  test("rejects incomplete or non-compact mappings", () => {
    const validation = validateMobileLiveProviderIdentityMappings({
      compactMarkets,
      mappings: [
        {
          marketId: "unknown-market",
          referenceSource: "polymarket",
          externalSlug: "",
          externalMarketId: "gamma-market-1",
          conditionId: "condition-1",
          outcomes: [],
        },
        {
          marketId: "market-1",
          referenceSource: "fifa_schedule",
          externalSlug: "curacao-cote-divoire-match-winner",
          externalMarketId: "gamma-market-1",
          conditionId: "",
          outcomes: [
            { outcomeId: "home", referenceTokenId: "token-home", referenceOutcomeLabel: "Curacao" },
          ],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ marketId: "unknown-market", reason: "market_not_in_compact_live_event" }),
      expect.objectContaining({ marketId: "market-1", field: "referenceSource", reason: "unsupported_provider_source" }),
      expect.objectContaining({ marketId: "market-1", field: "conditionId", reason: "required_field_missing" }),
      expect.objectContaining({ marketId: "market-1", reason: "mapping_must_include_every_compact_market_outcome" }),
    ]));
  });
});
