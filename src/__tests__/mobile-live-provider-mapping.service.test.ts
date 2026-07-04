import { assessMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";

describe("mobile live provider mapping readiness", () => {
  test("flags fifa schedule compact markets as not provider refreshable", () => {
    const report = assessMobileLiveProviderMappingReadiness({
      eventSlug: "world-cup-live",
      compactMarkets: [
        {
          id: "market-1",
          title: "Curacao vs Cote d'Ivoire",
          status: "LIVE",
          referenceSource: "fifa_schedule",
          externalSlug: "world-cup-live-match-winner",
          externalMarketId: "12-match-winner",
          conditionId: null,
          marketGroupKey: "game-lines",
          marketGroupTitle: "Game Lines",
          displayOrder: 0,
          line: null,
          unit: null,
          period: "full-game",
          marketType: "match_winner_1x2",
          propCategory: null,
          outcomes: [
            {
              id: "home",
              name: "Curacao",
              side: "home",
              displayOrder: 0,
              isTradable: true,
              referenceTokenId: null,
              referenceOutcomeLabel: null,
            },
          ],
        },
      ],
    });

    expect(report).toEqual(expect.objectContaining({
      compactMarketCount: 1,
      providerRefreshableMarketCount: 0,
      providerRefreshableOutcomeCount: 0,
      unsupportedSourceMarketCount: 1,
      missingConditionIdMarketCount: 1,
      missingOutcomeTokenMarketCount: 1,
      isProviderRefreshReady: false,
      nextRequiredAction: "map_compact_markets_to_polymarket_provider_identity",
    }));
    expect(report.markets[0]).toEqual(expect.objectContaining({
      providerRefreshable: false,
      missingFields: ["referenceSource", "conditionId"],
      recommendedAction: "map_market_to_polymarket_provider_source",
    }));
  });

  test("passes only when market and outcomes have provider identity", () => {
    const report = assessMobileLiveProviderMappingReadiness({
      eventSlug: "world-cup-live",
      compactMarkets: [
        {
          id: "market-1",
          title: "Curacao vs Cote d'Ivoire",
          status: "LIVE",
          referenceSource: "polymarket",
          externalSlug: "curacao-vs-cote-divoire-match-winner",
          externalMarketId: "gamma-market-1",
          conditionId: "condition-1",
          marketGroupKey: "game-lines",
          marketGroupTitle: "Game Lines",
          displayOrder: 0,
          line: null,
          unit: null,
          period: "full-game",
          marketType: "match_winner_1x2",
          propCategory: null,
          outcomes: [
            {
              id: "home",
              name: "Curacao",
              side: "home",
              displayOrder: 0,
              isTradable: true,
              referenceTokenId: "token-home",
              referenceOutcomeLabel: "Curacao",
            },
          ],
        },
      ],
    });

    expect(report.providerRefreshableMarketCount).toBe(1);
    expect(report.providerRefreshableOutcomeCount).toBe(1);
    expect(report.isProviderRefreshReady).toBe(true);
    expect(report.nextRequiredAction).toBe("run_provider_refresh_without_contract_fallback");
  });
});
