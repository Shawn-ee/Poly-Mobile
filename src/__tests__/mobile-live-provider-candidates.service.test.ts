import {
  buildProviderCandidateSearchQueries,
  buildLineDiscoverySummary,
  buildProviderCandidateManualSlugFallbacks,
  classifyProviderMarketFamily,
  deriveProviderEventSlugHints,
  expectedProviderMarketFamily,
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

  test("derives expected provider family from Holiwyn line market shape", () => {
    expect(expectedProviderMarketFamily({
      title: "Total goals 2.5",
      marketType: "total_goals",
      period: null,
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
    })).toBe("total_goals");
    expect(expectedProviderMarketFamily({
      title: "Colombia +1.5",
      marketType: "spread",
      period: null,
      marketGroupKey: "spreads",
      marketGroupTitle: "Spreads",
    })).toBe("spread");
  });

  test("rejects exact winner slugs for Holiwyn line markets with provider family mismatch", () => {
    const totalMarket = {
      ...compactMarket,
      id: "market-total",
      title: "Colombia vs Ghana total goals 2.5",
      marketType: "total_goals",
      line: { toString: () => "2.5" },
      outcomes: [
        { id: "over", name: "Over 2.5", side: "over", displayOrder: 0, referenceOutcomeLabel: "Over 2.5" },
        { id: "under", name: "Under 2.5", side: "under", displayOrder: 1, referenceOutcomeLabel: "Under 2.5" },
      ],
    };

    const ranked = rankProviderCandidates(totalMarket, [
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

    expect(ranked[0].attachReadiness).toEqual(expect.objectContaining({
      attachReady: false,
      expectedFamily: "total_goals",
      candidateFamily: "match_winner",
      reasons: expect.arrayContaining(["provider_family_mismatch"]),
    }));
  });

  test("allows exact line-family slugs when token shape and relevance match", () => {
    const totalMarket = {
      ...compactMarket,
      id: "market-total",
      title: "Colombia vs Ghana total goals 2.5",
      marketType: "total_goals",
      line: { toString: () => "2.5" },
      outcomes: [
        { id: "over", name: "Over 2.5", side: "over", displayOrder: 0, referenceOutcomeLabel: "Over 2.5" },
        { id: "under", name: "Under 2.5", side: "under", displayOrder: 1, referenceOutcomeLabel: "Under 2.5" },
      ],
    };

    const ranked = rankProviderCandidates(totalMarket, [
      {
        slug: "fifwc-col-gha-2026-07-03-total-goals-25",
        question: "Colombia vs Ghana total goals over 2.5?",
        externalMarketId: "gamma-market-total",
        conditionId: "condition-total",
        eventTitle: "Colombia vs. Ghana",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.48,
        bestAsk: 0.52,
        spread: 0.04,
        lastTradePrice: null,
        volume: null,
        volume24hr: null,
        liquidity: null,
        outcomes: [
          { name: "Over 2.5", tokenId: "token-over", outcomePrice: 0.5, displayOrder: 0 },
          { name: "Under 2.5", tokenId: "token-under", outcomePrice: 0.5, displayOrder: 1 },
        ],
        tags: ["soccer"],
        category: "Sports / Soccer",
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
    ]);

    expect(ranked[0].attachReadiness).toEqual(expect.objectContaining({
      attachReady: true,
      expectedFamily: "total_goals",
      candidateFamily: "total_goals",
      reasons: [],
    }));
  });

  test("rejects team outright winner candidates for event-specific match winner markets", () => {
    const argEgyptMarket = {
      id: "argentina-win",
      title: "Will Argentina win on 2026-07-07?",
      eventTitle: "Argentina vs. Egypt",
      marketType: "match_winner_1x2",
      period: "regulation",
      line: null,
      unit: null,
      marketGroupKey: "regulation-winner",
      marketGroupTitle: "Regulation Winner",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0, referenceOutcomeLabel: "Yes" },
        { id: "no", name: "No", side: "no", displayOrder: 1, referenceOutcomeLabel: "No" },
      ],
    };

    const ranked = rankProviderCandidates(argEgyptMarket, [
      {
        slug: "will-argentina-win-the-2026-fifa-world-cup-245",
        question: "Will Argentina win the 2026 FIFA World Cup?",
        externalMarketId: "gamma-arg-outright",
        conditionId: "condition-arg-outright",
        eventTitle: "2026 FIFA World Cup Winner",
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        bestBid: 0.08,
        bestAsk: 0.09,
        spread: 0.01,
        lastTradePrice: null,
        volume: null,
        volume24hr: null,
        liquidity: null,
        outcomes: [
          { name: "Yes", tokenId: "token-yes", outcomePrice: 0.08, displayOrder: 0 },
          { name: "No", tokenId: "token-no", outcomePrice: 0.92, displayOrder: 1 },
        ],
        tags: ["soccer", "fifa-world-cup"],
        category: "Sports / Soccer",
        score: 0,
        attachReadiness: { attachReady: false, reasons: ["not_ranked"] },
      },
    ]);

    expect(ranked[0].attachReadiness).toEqual(expect.objectContaining({
      attachReady: false,
      expectedFamily: "match_winner",
      candidateFamily: "match_winner",
      reasons: expect.arrayContaining(["insufficient_market_relevance"]),
      relevance: expect.objectContaining({
        matchedImportantTokens: expect.not.arrayContaining(["egypt"]),
      }),
    }));
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

  test("summarizes line discovery action separately from generic provider candidate counts", () => {
    const winnerCandidate = {
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
      attachReadiness: {
        attachReady: false,
        reasons: ["provider_family_mismatch"],
        expectedFamily: "total_goals",
        candidateFamily: "match_winner",
        relevance: { relevant: true },
      },
    };

    const summary = buildLineDiscoverySummary({
      targets: [
        {
          expectedProviderFamily: "match_winner",
          attachProposal: { attachReady: true },
          candidateCount: 3,
          candidates: [],
        },
        {
          expectedProviderFamily: "total_goals",
          attachProposal: { attachReady: false },
          candidateCount: 1,
          candidates: [winnerCandidate as any],
        },
      ],
      manualSlugFallbacks: [
        "fifwc-col-gha-2026-07-03-col",
        "fifwc-col-gha-2026-07-03-total-goals",
      ],
      manualSlugFallbackCandidates: [],
      sportsEventCandidates: [winnerCandidate as any],
    });

    expect(summary).toEqual(expect.objectContaining({
      lineTargetCount: 1,
      lineTargetFamilies: ["total_goals"],
      lineCandidateCount: 1,
      attachReadyLineTargetCount: 0,
      exactProviderLineCandidateCount: 0,
      manualLineSlugFallbackCount: 1,
      manualLineSlugFallbackCandidateCount: 0,
      nextRequiredAction: "provider_line_markets_not_found_keep_contract_fixtures_for_local_mvp",
    }));
    expect(summary.rejectedReasonSummary).toEqual(expect.objectContaining({
      provider_family_mismatch: 1,
    }));
  });

  test("builds compact market search queries", () => {
    expect(buildProviderCandidateSearchQueries(compactMarket)).toEqual(expect.arrayContaining([
      "Curacao vs Cote d'Ivoire Match Winner",
      "Curacao vs Cote dIvoire Match Winner",
      "Curacao vs Cote d'Ivoire Match Winner match winner 1x2",
    ]));
  });

  test("builds exact Polymarket match-winner slug fallbacks from normalized teams and draw", () => {
    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Will Colombia win on 2026-07-03?",
      marketType: "moneyline",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0 },
        { id: "no", name: "No", side: "no", displayOrder: 1 },
      ],
    }, ["https://polymarket.com/sports/world-cup/fifwc-col-gha-2026-07-03"])).toEqual([
      "fifwc-col-gha-2026-07-03-col",
    ]);

    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Will Colombia vs. Ghana end in a draw?",
      marketType: "moneyline",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0 },
        { id: "no", name: "No", side: "no", displayOrder: 1 },
      ],
    }, ["fifwc-col-gha-2026-07-03"])).toEqual([
      "fifwc-col-gha-2026-07-03-draw",
    ]);
  });

  test("builds exact Polymarket line-market slug fallbacks from event, family, teams, and line", () => {
    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Colombia +1.5",
      marketType: "spread",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0 },
        { id: "no", name: "No", side: "no", displayOrder: 1 },
      ],
    }, ["fifwc-col-gha-2026-07-03"])).toEqual(expect.arrayContaining([
      "fifwc-col-gha-2026-07-03-spread",
      "fifwc-col-gha-2026-07-03-handicap",
      "fifwc-col-gha-2026-07-03-col-spread",
      "fifwc-col-gha-2026-07-03-spread-1-5",
      "fifwc-col-gha-2026-07-03-col-handicap-15",
    ]));

    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Total goals 2.5",
      marketType: "total_goals",
      outcomes: [
        { id: "over", name: "Over 2.5", side: "over", displayOrder: 0 },
        { id: "under", name: "Under 2.5", side: "under", displayOrder: 1 },
      ],
    }, ["fifwc-col-gha-2026-07-03"])).toEqual(expect.arrayContaining([
      "fifwc-col-gha-2026-07-03-total-goals",
      "fifwc-col-gha-2026-07-03-over-under",
      "fifwc-col-gha-2026-07-03-total-goals-2-5",
      "fifwc-col-gha-2026-07-03-over-25",
    ]));

    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Ghana team total goals 1.5",
      marketType: "team_total_goals",
      outcomes: [
        { id: "over", name: "Over 1.5", side: "over", displayOrder: 0 },
        { id: "under", name: "Under 1.5", side: "under", displayOrder: 1 },
      ],
    }, ["fifwc-col-gha-2026-07-03"])).toEqual(expect.arrayContaining([
      "fifwc-col-gha-2026-07-03-team-total",
      "fifwc-col-gha-2026-07-03-gha-team-total",
      "fifwc-col-gha-2026-07-03-team-total-gha",
      "fifwc-col-gha-2026-07-03-gha-team-goals-1-5",
    ]));
  });

  test("builds exact fallback slugs for current World Cup team code coverage", () => {
    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Egypt +1.5",
      marketType: "spread",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0 },
        { id: "no", name: "No", side: "no", displayOrder: 1 },
      ],
    }, ["fifwc-arg-egy-2026-07-07"])).toEqual(expect.arrayContaining([
      "fifwc-arg-egy-2026-07-07-egy-spread",
      "fifwc-arg-egy-2026-07-07-egy-handicap-1-5",
    ]));

    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Paraguay team total goals 1.5",
      marketType: "team_total_goals",
      outcomes: [
        { id: "over", name: "Over 1.5", side: "over", displayOrder: 0 },
        { id: "under", name: "Under 1.5", side: "under", displayOrder: 1 },
      ],
    }, ["fifwc-par-fra-2026-07-04"])).toEqual(expect.arrayContaining([
      "fifwc-par-fra-2026-07-04-par-team-total",
      "fifwc-par-fra-2026-07-04-par-team-goals-1-5",
    ]));

    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Norway total goals 2.5",
      marketType: "team_total_goals",
      outcomes: [
        { id: "over", name: "Over 2.5", side: "over", displayOrder: 0 },
        { id: "under", name: "Under 2.5", side: "under", displayOrder: 1 },
      ],
    }, ["fifwc-bra-nor-2026-07-05"])).toEqual(expect.arrayContaining([
      "fifwc-bra-nor-2026-07-05-nor-team-total",
      "fifwc-bra-nor-2026-07-05-nor-team-goals-2-5",
    ]));

    expect(buildProviderCandidateManualSlugFallbacks({
      title: "Cote d'Ivoire +1.5",
      marketType: "spread",
      outcomes: [
        { id: "yes", name: "Yes", side: "yes", displayOrder: 0 },
        { id: "no", name: "No", side: "no", displayOrder: 1 },
      ],
    }, ["fifwc-cuw-civ-2026-06-25"])).toEqual(expect.arrayContaining([
      "fifwc-cuw-civ-2026-06-25-civ-spread",
      "fifwc-cuw-civ-2026-06-25-civ-handicap-1-5",
    ]));
  });

  test("adds normalized soccer event phrases to provider search queries", () => {
    expect(buildProviderCandidateSearchQueries({
      id: "market-col",
      title: "Colombia vs Ghana: Match Winner",
      marketType: "match_winner_1x2",
      period: null,
      line: null,
      unit: null,
      marketGroupKey: "main",
      marketGroupTitle: "Game Lines",
      outcomes: [
        { id: "home", name: "Colombia", side: "home", displayOrder: 0, referenceOutcomeLabel: "Colombia" },
        { id: "draw", name: "Draw", side: "draw", displayOrder: 1, referenceOutcomeLabel: "Draw" },
        { id: "away", name: "Ghana", side: "away", displayOrder: 2, referenceOutcomeLabel: "Ghana" },
      ],
    })).toEqual(expect.arrayContaining([
      "colombia ghana soccer",
      "colombia ghana world cup",
    ]));
  });

  test("prioritizes World Cup line-family search phrases before query cap", () => {
    const queries = buildProviderCandidateSearchQueries({
      id: "market-total",
      title: "Colombia vs Ghana total goals 2.5",
      eventTitle: "Colombia vs. Ghana",
      marketType: "total_goals",
      period: null,
      line: { toString: () => "2.5" },
      unit: "goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      outcomes: [
        { id: "over", name: "Over 2.5", side: "over", displayOrder: 0, referenceOutcomeLabel: "Over 2.5" },
        { id: "under", name: "Under 2.5", side: "under", displayOrder: 1, referenceOutcomeLabel: "Under 2.5" },
      ],
    });

    expect(queries.length).toBeLessThanOrEqual(12);
    expect(queries).toEqual(expect.arrayContaining([
      "colombia ghana total goals",
      "colombia ghana over under",
      "colombia ghana total goals 2-5",
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
