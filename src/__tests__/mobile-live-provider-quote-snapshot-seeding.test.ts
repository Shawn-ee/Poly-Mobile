import { buildMobileLiveProviderQuoteSnapshotRows } from "@/server/services/mobileLiveProviderQuoteSnapshotSeeding";

describe("mobile live provider quote snapshot seeding", () => {
  test("builds backend-shaped provider quote rows for each market outcome", () => {
    const rows = buildMobileLiveProviderQuoteSnapshotRows(
      [
        {
          id: "market-main",
          externalSlug: "curacao-vs-cote-divoire",
          externalMarketId: "gamma-market-main",
          conditionId: "condition-main",
          outcomes: [
            { id: "home", name: "Curacao", referenceTokenId: "token-home" },
            { id: "draw", name: "Draw", referenceTokenId: "token-draw" },
            { id: "away", name: "Cote d'Ivoire", referenceTokenId: "token-away" },
          ],
        },
        {
          id: "market-total",
          outcomes: [
            { id: "over", name: "Over 2.5" },
            { id: "under", name: "Under 2.5" },
          ],
        },
      ],
      "2026-07-03T22:00:00.000Z",
    );

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({
      marketId: "market-main",
      outcomeId: "home",
      source: "polymarket",
      externalSlug: "curacao-vs-cote-divoire",
      externalMarketId: "gamma-market-main",
      conditionId: "condition-main",
      tokenId: "token-home",
      acceptingOrders: true,
      qualityStatus: "high_quality",
      mmEligible: true,
      fetchedAt: "2026-07-03T22:00:00.000Z",
    });
    expect(rows[0]!.bestBid).toBeLessThan(rows[0]!.bestAsk);
    expect(rows[3]).toMatchObject({
      marketId: "market-total",
      outcomeId: "over",
      tokenId: "mobile-provider-proof-market-total-over",
    });
    expect(rows.every((row) => row.marketId && row.outcomeId && row.tokenId)).toBe(true);
  });
});
