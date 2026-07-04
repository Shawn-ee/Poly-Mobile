import {
  buildProviderCandidateSearchQueries,
  classifyProviderMarketFamily,
  deriveProviderEventSlugHints,
  fetchProviderCandidatesFromSportsEvents,
  fetchProviderCandidatesForQueries,
  fetchProviderCandidatesForSlugs,
  rankProviderCandidates,
  summarizeProviderCandidateFamilies,
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
  test("derives exact provider event slugs from event fields and metadata", () => {
    expect(deriveProviderEventSlugHints({
      externalSlug: "https://polymarket.com/sports/world-cup/fifwc-col-gha-2026-07-03",
      externalEventId: null,
      source: "polymarket",
      metadata: {
        provider: {
          eventSlug: "fifwc-col-gha-2026-07-03",
        },
      },
    })).toEqual(["fifwc-col-gha-2026-07-03"]);
  });

  test("request provider event slugs override event-derived hints", () => {
    expect(deriveProviderEventSlugHints({
      externalSlug: "fifwc-col-gha-2026-07-03",
      externalEventId: null,
      source: "polymarket",
      metadata: null,
    }, ["https://polymarket.com/sports/world-cup/fifwc-por-cro-2026-07-02"])).toEqual([
      "fifwc-por-cro-2026-07-02",
    ]);
  });

  test("classifies provider market families for line availability diagnostics", () => {
    const base = {
      eventTitle: "Colombia vs. Ghana",
      tags: ["soccer", "fifa-world-cup"],
    };

    expect(classifyProviderMarketFamily({
      ...base,
      slug: "fifwc-col-gha-2026-07-03-col",
      question: "Will Colombia win on 2026-07-03?",
    })).toBe("match_winner");
    expect(classifyProviderMarketFamily({
      ...base,
      slug: "colombia-ghana-over-25",
      question: "Colombia vs Ghana total goals over 2.5?",
    })).toBe("total_goals");
    expect(classifyProviderMarketFamily({
      ...base,
      slug: "colombia-ghana-team-total",
      question: "Will Ghana team total goals be over 1.5?",
    })).toBe("team_total_goals");
    expect(classifyProviderMarketFamily({
      ...base,
      slug: "colombia-ghana-handicap",
      question: "Will Colombia cover the +1.5 handicap?",
    })).toBe("spread");
    expect(classifyProviderMarketFamily({
      ...base,
      slug: "colombia-ghana-corners",
      question: "Colombia vs Ghana corners over 8.5?",
    })).toBe("corners");
  });

  test("summarizes exact event provider families with explicit zero line buckets", () => {
    const summary = summarizeProviderCandidateFamilies([
      {
        slug: "fifwc-col-gha-2026-07-03-col",
        question: "Will Colombia win on 2026-07-03?",
        externalMarketId: "gamma-market-col",
        conditionId: "condition-col",
        eventTitle: "Colombia vs. Ghana",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.8,
        bestAsk: 0.82,
        spread: 0.02,
        lastTradePrice: null,
        volume: null,
        volume24hr: null,
        liquidity: null,
        outcomes: [
          { name: "Yes", tokenId: "token-yes", outcomePrice: 0.8, displayOrder: 0 },
          { name: "No", tokenId: "token-no", outcomePrice: 0.2, displayOrder: 1 },
        ],
        tags: ["soccer"],
        category: "Sports / Soccer",
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
    ]);

    expect(summary).toEqual(expect.objectContaining({
      match_winner: 1,
      spread: 0,
      total_goals: 0,
      team_total_goals: 0,
      corners: 0,
    }));
  });

  test("builds compact market search queries", () => {
    expect(buildProviderCandidateSearchQueries(compactMarket)).toEqual(expect.arrayContaining([
      "Curacao vs Cote d'Ivoire Match Winner",
      "Curacao vs Cote dIvoire Match Winner",
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
      attachReadiness: expect.objectContaining({ attachReady: true, reasons: [] }),
    }));
    expect(ranked[0].attachReadiness.relevance).toEqual(expect.objectContaining({
      relevant: true,
      outcomeNameMatches: 2,
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

    expect(ranked[0].attachReadiness).toEqual(expect.objectContaining({
      attachReady: false,
      reasons: ["missing_reference_token_id"],
    }));
  });

  test("rejects token-complete unrelated provider candidates as not attach-ready", () => {
    const ranked = rankProviderCandidates(compactMarket, [
      {
        slug: "new-rhianna-album-before-gta-vi-926",
        question: "New Rihanna Album before GTA VI?",
        externalMarketId: "540817",
        conditionId: "0xcondition",
        eventTitle: "What will happen before GTA VI?",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.51,
        bestAsk: 0.52,
        spread: 0.01,
        lastTradePrice: null,
        volume: 847445,
        volume24hr: 2000,
        liquidity: 15894,
        outcomes: [
          { name: "Yes", tokenId: "token-yes", outcomePrice: 0.51, displayOrder: 0 },
          { name: "No", tokenId: "token-no", outcomePrice: 0.49, displayOrder: 1 },
          { name: "Maybe", tokenId: "token-maybe", outcomePrice: 0.0, displayOrder: 2 },
        ],
        tags: ["Music"],
        category: "Pop culture",
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
    ]);

    expect(ranked[0].attachReadiness).toEqual(expect.objectContaining({
      attachReady: false,
      reasons: expect.arrayContaining(["insufficient_market_relevance"]),
    }));
    expect(ranked[0].attachReadiness.relevance).toEqual(expect.objectContaining({
      relevant: false,
      outcomeNameMatches: 0,
    }));
  });

  test("accepts same-question binary soccer markets without weakening unrelated rejection", () => {
    const binaryMarket = {
      ...compactMarket,
      id: "market-colombia",
      title: "Will Colombia win on 2026-07-03?",
      marketType: "moneyline",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0, referenceOutcomeLabel: "Yes" },
        { id: "no", name: "No", side: "no", displayOrder: 1, referenceOutcomeLabel: "No" },
      ],
    };

    const ranked = rankProviderCandidates(binaryMarket, [
      {
        slug: "will-africa-win-the-2026-fifa-world-cup",
        question: "Will Africa (CAF) win the 2026 FIFA World Cup?",
        externalMarketId: "gamma-market-africa",
        conditionId: "condition-africa",
        eventTitle: "Which continent will win the World Cup?",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.12,
        bestAsk: 0.13,
        spread: 0.01,
        lastTradePrice: null,
        volume: 900000,
        volume24hr: 9000,
        liquidity: 5000,
        outcomes: [
          { name: "Yes", tokenId: "token-africa-yes", outcomePrice: 0.12, displayOrder: 0 },
          { name: "No", tokenId: "token-africa-no", outcomePrice: 0.88, displayOrder: 1 },
        ],
        tags: ["sports", "soccer", "fifa-world-cup"],
        category: "Sports / Soccer",
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
      {
        slug: "fifwc-col-gha-2026-07-03-col",
        question: "Will Colombia win on 2026-07-03?",
        externalMarketId: "gamma-market-col",
        conditionId: "condition-col",
        eventTitle: "Colombia vs. Ghana",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.8,
        bestAsk: 0.82,
        spread: 0.02,
        lastTradePrice: null,
        volume: 2000,
        volume24hr: 500,
        liquidity: 1000,
        outcomes: [
          { name: "Yes", tokenId: "token-col-yes", outcomePrice: 0.8, displayOrder: 0 },
          { name: "No", tokenId: "token-col-no", outcomePrice: 0.2, displayOrder: 1 },
        ],
        tags: ["sports", "soccer", "fifa-world-cup"],
        category: "Sports / Soccer",
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
    ]);

    expect(ranked[0].attachReadiness).toEqual(expect.objectContaining({
      attachReady: true,
      reasons: [],
    }));
    expect(ranked[0].slug).toBe("fifwc-col-gha-2026-07-03-col");
    expect(ranked[0].attachReadiness.relevance).toEqual(expect.objectContaining({
      relevant: true,
      binaryQuestionRelevant: true,
      outcomeNameMatches: 0,
    }));
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

  test("fetches provider candidates from sports event market payloads", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          title: "World Cup Winner",
          category: "sports",
          tags: [{ slug: "sports" }, { slug: "soccer" }, { slug: "fifa-world-cup" }],
          markets: [
            {
              slug: "will-spain-win-the-2026-fifa-world-cup-963",
              question: "Will Spain win the 2026 FIFA World Cup?",
              id: "558934",
              conditionId: "condition-spain",
              outcomes: JSON.stringify(["Yes", "No"]),
              clobTokenIds: JSON.stringify(["token-yes", "token-no"]),
              outcomePrices: JSON.stringify([0.18, 0.82]),
              active: true,
              closed: false,
              archived: false,
              acceptingOrders: true,
            },
          ],
        },
      ],
    });

    const candidates = await fetchProviderCandidatesFromSportsEvents({
      tagSlugs: ["fifa-world-cup"],
      eventLimitPerTag: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("tag_slug=fifa-world-cup"),
      expect.any(Object),
    );
    expect(candidates[0]).toEqual(expect.objectContaining({
      slug: "will-spain-win-the-2026-fifa-world-cup-963",
      eventTitle: "World Cup Winner",
      category: "sports",
      tags: expect.arrayContaining(["sports", "soccer", "fifa-world-cup"]),
    }));
    expect(candidates[0].outcomes.map((outcome) => outcome.tokenId)).toEqual(["token-yes", "token-no"]);
  });

  test("fetches provider candidates from exact sports event slugs before tag discovery", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            title: "Colombia vs. Ghana",
            category: "sports",
            tags: [{ slug: "sports" }, { slug: "soccer" }, { slug: "fifa-world-cup" }],
            markets: [
              {
                slug: "fifwc-col-gha-2026-07-03-col",
                question: "Will Colombia win on 2026-07-03?",
                id: "558001",
                conditionId: "condition-col",
                outcomes: JSON.stringify(["Yes", "No"]),
                clobTokenIds: JSON.stringify(["token-col-yes", "token-col-no"]),
                active: true,
                closed: false,
                archived: false,
                acceptingOrders: true,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    const candidates = await fetchProviderCandidatesFromSportsEvents({
      eventSlugs: ["fifwc-col-gha-2026-07-03"],
      tagSlugs: ["fifa-world-cup"],
      eventLimitPerTag: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("slug=fifwc-col-gha-2026-07-03"),
      expect.any(Object),
    );
    expect(candidates[0]).toEqual(expect.objectContaining({
      slug: "fifwc-col-gha-2026-07-03-col",
      eventTitle: "Colombia vs. Ghana",
    }));
  });
});
