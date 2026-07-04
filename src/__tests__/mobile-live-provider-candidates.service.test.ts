import {
  buildProviderCandidateSearchQueries,
  fetchProviderCandidatesForQueries,
  fetchProviderCandidatesForSlugs,
  rankProviderCandidates,
} from "@/server/services/mobileLiveProviderCandidates";

const compactMarket = {
  id: "market-1",
  title: "Curacao vs Cote d'Ivoire: Match Winner",
  marketType: "match_winner_1x2",
  period: null,
  line: null,
  unit: null,
  marketGroupKey: "main",
  marketGroupTitle: "Main",
  outcomes: [
    { id: "home", name: "Curacao", side: "home", displayOrder: 0, referenceOutcomeLabel: "Curacao" },
    { id: "draw", name: "Draw", side: "draw", displayOrder: 1, referenceOutcomeLabel: "Draw" },
    { id: "away", name: "Cote d'Ivoire", side: "away", displayOrder: 2, referenceOutcomeLabel: "Cote d'Ivoire" },
  ],
};

describe("mobile live provider candidates", () => {
  test("builds compact market search queries", () => {
    expect(buildProviderCandidateSearchQueries(compactMarket)).toEqual(expect.arrayContaining([
      "Curacao vs Cote d'Ivoire Match Winner",
      "Curacao vs Cote d'Ivoire Match Winner match winner 1x2",
    ]));
  });

  test("fetches and normalizes provider candidates from Gamma-style responses", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          slug: "curacao-cote-divoire-match-winner",
          question: "Curacao vs Cote d'Ivoire Match Winner",
          id: "gamma-market-1",
          conditionId: "condition-1",
          outcomes: JSON.stringify(["Curacao", "Draw", "Cote d'Ivoire"]),
          clobTokenIds: JSON.stringify(["token-home", "token-draw", "token-away"]),
          outcomePrices: JSON.stringify([0.2, 0.3, 0.5]),
          active: true,
          closed: false,
          archived: false,
          acceptingOrders: true,
          bestBid: 0.2,
          bestAsk: 0.24,
          spread: 0.04,
          events: [{ title: "Curacao vs Cote d'Ivoire" }],
          tags: [{ label: "Soccer" }],
        },
      ],
    });

    const candidates = await fetchProviderCandidatesForQueries(["curacao cote divoire"], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const ranked = rankProviderCandidates(compactMarket, candidates);

    expect(fetchImpl).toHaveBeenCalled();
    expect(ranked[0]).toEqual(expect.objectContaining({
      slug: "curacao-cote-divoire-match-winner",
      externalMarketId: "gamma-market-1",
      conditionId: "condition-1",
      attachReadiness: { attachReady: true, reasons: [] },
    }));
    expect(ranked[0].outcomes.map((outcome) => outcome.tokenId)).toEqual([
      "token-home",
      "token-draw",
      "token-away",
    ]);
  });

  test("marks candidates without token IDs as not attach-ready", () => {
    const ranked = rankProviderCandidates(compactMarket, [
      {
        slug: "candidate",
        question: "Curacao vs Cote d'Ivoire Match Winner",
        externalMarketId: "gamma-market-1",
        conditionId: "condition-1",
        eventTitle: "Curacao vs Cote d'Ivoire",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.2,
        bestAsk: 0.24,
        spread: 0.04,
        lastTradePrice: null,
        volume: null,
        volume24hr: null,
        liquidity: null,
        outcomes: [
          { name: "Curacao", tokenId: null, outcomePrice: 0.2, displayOrder: 0 },
          { name: "Draw", tokenId: null, outcomePrice: 0.3, displayOrder: 1 },
          { name: "Cote d'Ivoire", tokenId: null, outcomePrice: 0.5, displayOrder: 2 },
        ],
        tags: [],
        category: null,
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
    ]);

    expect(ranked[0].attachReadiness).toEqual({
      attachReady: false,
      reasons: ["missing_reference_token_id"],
    });
  });

  test("fetches exact manual slug previews from Gamma-style responses", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          slug: "curacao-cote-divoire-match-winner",
          question: "Curacao vs Cote d'Ivoire Match Winner",
          id: "gamma-market-1",
          conditionId: "condition-1",
          outcomes: JSON.stringify(["Curacao", "Draw", "Cote d'Ivoire"]),
          clobTokenIds: JSON.stringify(["token-home", "token-draw", "token-away"]),
          active: true,
          closed: false,
          archived: false,
          acceptingOrders: true,
        },
      ],
    });

    const candidates = await fetchProviderCandidatesForSlugs(["https://polymarket.com/event/foo/curacao-cote-divoire-match-winner"], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("slug=curacao-cote-divoire-match-winner"),
      expect.any(Object),
    );
    expect(candidates[0]).toEqual(expect.objectContaining({
      slug: "curacao-cote-divoire-match-winner",
      conditionId: "condition-1",
    }));
  });
});
