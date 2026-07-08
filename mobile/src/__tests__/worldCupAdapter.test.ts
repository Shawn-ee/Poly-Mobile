import { describe, expect, test } from "vitest";
import { normalizeEventDetail, normalizeMarket } from "../adapters/worldCupAdapter";
import type { EventDetail, Market } from "../types";

const baseMarket: Market = {
  id: "world-cup-futures",
  title: "Fixture World Cup futures",
  description: null,
  status: "OPEN",
  event: null,
  rulesText: null,
  marketGroupTitle: "World Cup futures",
  marketGroupKey: null,
  marketGroupId: null,
  marketType: null,
  period: null,
  line: null,
  liquidity: null,
  orderbookDepth: [],
  propCategory: "future",
  outcomes: [],
};

describe("world cup adapter", () => {
  test("uses positive bid ask midpoint when backend outcome price is zero", () => {
    const normalized = normalizeMarket({
      ...baseMarket,
      outcomes: [
        {
          id: "yes",
          name: "YES",
          label: "YES",
          side: "yes",
          price: 0,
          bestBid: "0.01",
          bestAsk: "0.04",
          bestBidSize: "120",
          bestAskSize: "90",
          isTradable: true,
        },
      ],
    });

    expect(normalized.outcomes[0]).toMatchObject({
      id: "yes",
      label: "YES",
      probability: 3,
      side: "yes",
      bestBid: 0.01,
      bestAsk: 0.04,
      bestBidSize: 120,
      bestAskSize: 90,
    });
  });

  test("preserves backend-shaped live market contract fields", () => {
    const normalized = normalizeMarket({
      ...baseMarket,
      title: "Australia +0.5",
      marketGroupKey: "aus-egy-live-game-lines",
      marketGroupId: "aus-egy-live-game-lines",
      marketGroupTitle: "Game Lines",
      marketType: "spread",
      period: "regulation",
      line: "+0.5",
      referenceSource: "polymarket",
      externalSlug: "australia-egypt-spread",
      externalMarketId: "gamma-spread-1",
      conditionId: "condition-spread-1",
      liquidity: "4500",
      orderbookDepth: [{ outcomeId: "aus", side: "bid", price: 0.58, shares: 100, total: 58 }],
      availability: {
        source: "market-source-updated-at",
        status: "stale",
        marketStatus: "LIVE",
        lastUpdated: "2026-07-03T22:00:10.000Z",
        stalenessSeconds: 121,
        staleAfterSeconds: 90,
        isStale: true,
        isSuspended: false,
        isDelayed: false,
        reason: "Latest market update is older than 90 seconds.",
      },
      outcomes: [
        {
          id: "aus",
          name: "Australia +0.5",
          label: "Australia +0.5",
          side: "home",
          referenceTokenId: "token-aus-spread",
          referenceOutcomeLabel: "Australia +0.5",
          price: 0.6,
          bestBid: 0.58,
          bestAsk: 0.62,
          isTradable: true,
        },
      ],
    });

    expect(normalized).toMatchObject({
      type: "game-line",
      marketGroupId: "aus-egy-live-game-lines",
      marketType: "spread",
      period: "regulation",
      line: "+0.5",
      referenceSource: "polymarket",
      externalSlug: "australia-egypt-spread",
      externalMarketId: "gamma-spread-1",
      conditionId: "condition-spread-1",
      liquidity: 4500,
      orderbookDepth: [{ outcomeId: "aus", side: "bid", price: 0.58, shares: 100, total: 58 }],
      availability: {
        source: "market-source-updated-at",
        status: "stale",
        marketStatus: "LIVE",
        stalenessSeconds: 121,
        staleAfterSeconds: 90,
        isStale: true,
      },
      outcomes: [{
        id: "aus",
        side: "home",
        referenceTokenId: "token-aus-spread",
        referenceOutcomeLabel: "Australia +0.5",
        bestBid: 0.58,
        bestAsk: 0.62,
      }],
    });
  });

  test("maps backend team total goals market type to the mobile team-total contract", () => {
    const normalized = normalizeMarket({
      ...baseMarket,
      title: "Curacao goals 1.5",
      marketGroupKey: "team-totals",
      marketGroupTitle: "Team totals",
      marketType: "team_total_goals",
      line: "1.5",
      outcomes: [
        {
          id: "over",
          name: "Over 1.5",
          label: "Over 1.5",
          side: "over",
          price: 0.59,
          bestBid: 0.57,
          bestAsk: 0.65,
          isTradable: true,
        },
      ],
    });

    expect(normalized).toMatchObject({
      type: "game-line",
      marketType: "team-total",
      line: "1.5",
      outcomes: [{ id: "over", side: "over", bestBid: 0.57, bestAsk: 0.65 }],
    });
  });

  test("preserves live data freshness contract from backend event detail", () => {
    const detail: EventDetail = {
      event: {
        id: "event-1",
        slug: "world-cup-live",
        title: "Curacao vs Cote d'Ivoire",
        description: null,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Curacao",
        awayTeamName: "Cote d'Ivoire",
        startTime: "2026-06-25T20:00:00.000Z",
        status: "LIVE",
        liveStatus: "in_progress",
        period: "2H",
        clock: "67'",
        homeScore: 0,
        awayScore: 1,
        imageUrl: null,
        marketCount: 1,
        activeMarketCount: 1,
        liveDataStatus: {
          source: "provider-feed",
          status: "stale",
          lastUpdated: "2026-07-03T22:00:10.000Z",
          stalenessSeconds: 121,
          staleAfterSeconds: 90,
          isStale: true,
          isSuspended: false,
          isDelayed: false,
          reason: "Latest provider update is older than 90 seconds.",
        },
      },
      markets: [{
        ...baseMarket,
        id: "market-main",
        marketGroupTitle: "Match Winner",
        outcomes: [{
          id: "home",
          name: "Curacao",
          label: "Curacao",
          side: "home",
          price: 0.58,
          bestBid: 0.57,
          bestAsk: 0.61,
          isTradable: true,
        }],
      }],
    };

    expect(normalizeEventDetail(detail)?.liveDataStatus).toMatchObject({
      source: "provider-feed",
      status: "stale",
      stalenessSeconds: 121,
      staleAfterSeconds: 90,
      isStale: true,
    });
  });

  test("preserves backend market source summary for honest line-market UI", () => {
    const detail: EventDetail = {
      event: {
        id: "event-source-summary",
        slug: "argentina-vs-egypt",
        title: "Argentina vs. Egypt",
        description: null,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Argentina",
        awayTeamName: "Egypt",
        startTime: "2026-07-07T20:00:00.000Z",
        status: "LIVE",
        liveStatus: "in_progress",
        period: "Regulation",
        clock: "23'",
        homeScore: 0,
        awayScore: 0,
        imageUrl: null,
        marketCount: 7,
        activeMarketCount: 7,
        marketSourceSummary: {
          totalMarketCount: 7,
          sourceBreakdown: { polymarket: 3, "contract-fixture": 4 },
          polymarketMarketCount: 3,
          contractFixtureMarketCount: 4,
          unknownSourceMarketCount: 0,
          regulationWinner: {
            totalCount: 3,
            polymarketCount: 3,
            contractFixtureCount: 0,
            status: "provider-backed",
          },
          lineMarkets: {
            totalCount: 4,
            polymarketCount: 0,
            contractFixtureCount: 4,
            status: "contract-fixture",
            families: ["spread", "total_goals", "team_total_goals"],
            familyReadiness: [
              {
                family: "spread",
                totalCount: 1,
                polymarketCount: 0,
                contractFixtureCount: 1,
                status: "contract-fixture",
                reason: "spread is served by Local MVP contract fixtures for this event.",
              },
              {
                family: "total",
                totalCount: 1,
                polymarketCount: 0,
                contractFixtureCount: 1,
                status: "contract-fixture",
                reason: "total is served by Local MVP contract fixtures for this event.",
              },
            ],
            providerAvailability: {
              source: "polymarket-gamma",
              status: "unavailable",
              providerBackedLineMarketCount: 0,
              contractFixtureLineMarketCount: 4,
              reason: "No route-visible provider-backed Polymarket line markets are attached; Local MVP uses contract fixtures.",
            },
            reason: "Line markets are Local MVP contract fixtures until Polymarket exposes attach-ready line markets.",
          },
        },
      },
      markets: [{
        ...baseMarket,
        id: "arg-egy-spread",
        title: "Argentina vs. Egypt: Egypt +1.5",
        marketGroupTitle: "Game Lines",
        marketType: "spread",
        line: "1.5",
        referenceSource: "contract-fixture",
        outcomes: [{
          id: "yes",
          name: "Egypt +1.5",
          label: "Egypt +1.5",
          side: "yes",
          price: 0.52,
          bestBid: 0.5,
          bestAsk: 0.54,
          isTradable: true,
        }],
      }],
    };

    expect(normalizeEventDetail(detail)?.marketSourceSummary).toMatchObject({
      regulationWinner: { status: "provider-backed", polymarketCount: 3 },
      lineMarkets: {
        status: "contract-fixture",
        polymarketCount: 0,
        contractFixtureCount: 4,
        familyReadiness: [
          expect.objectContaining({ family: "spread", status: "contract-fixture" }),
          expect.objectContaining({ family: "total", status: "contract-fixture" }),
        ],
        providerAvailability: {
          source: "polymarket-gamma",
          status: "unavailable",
          providerBackedLineMarketCount: 0,
          contractFixtureLineMarketCount: 4,
        },
      },
    });
  });

  test("does not label stale provider-dated detail pages as live", () => {
    const detail: EventDetail = {
      event: {
        id: "event-1",
        slug: "world-cup-provider-ended",
        title: "Colombia vs. Ghana",
        description: null,
        category: "Sports / Soccer",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Colombia",
        awayTeamName: "Ghana",
        startTime: null,
        externalSlug: "fifwc-col-gha-2026-07-03",
        status: "live",
        liveStatus: "ENDED",
        period: "Final",
        clock: "FT",
        homeScore: 1,
        awayScore: 0,
        imageUrl: null,
        marketCount: 1,
        activeMarketCount: 1,
        liveDataStatus: {
          source: "polymarket-gamma",
          status: "stale",
          lastUpdated: "2026-07-04T03:50:04.000Z",
          stalenessSeconds: 900,
          staleAfterSeconds: 90,
          isStale: true,
          isSuspended: false,
          isDelayed: false,
          reason: "Provider event is closed/resolved.",
        },
      },
      markets: [{
        ...baseMarket,
        id: "market-main",
        marketGroupTitle: "Match Winner",
        outcomes: [{
          id: "home",
          name: "Colombia",
          label: "Colombia",
          side: "home",
          price: 0.99,
          bestBid: 0.99,
          bestAsk: 1,
          isTradable: true,
        }],
      }],
    };

    const normalized = normalizeEventDetail(detail);

    expect(normalized?.status).toBe("future");
    expect(normalized?.startsAt).toBe("Time TBD");
    expect(normalized?.liveDataStatus?.status).toBe("stale");
  });

  test("preserves backend event market rules instead of deriving from local market heuristics", () => {
    const detail: EventDetail = {
      event: {
        id: "event-rules-1",
        slug: "backend-rule-owned",
        title: "Backend Rules Home vs Backend Rules Away",
        description: "Backend-provided market rules should win.",
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Backend Rules Home",
        awayTeamName: "Backend Rules Away",
        startTime: "2026-07-10T20:00:00.000Z",
        status: "upcoming",
        liveStatus: null,
        period: null,
        clock: null,
        homeScore: null,
        awayScore: null,
        imageUrl: null,
        marketCount: 1,
        activeMarketCount: 1,
        marketProfile: "full_match_with_overtime",
        resultMode: "no_draw",
        gameRules: {
          allowDraw: false,
          includesOvertime: true,
          description: "Full match including overtime has no draw outcome.",
        },
        supportedMarketTypes: ["full_match_with_overtime", "to_advance"],
      },
      markets: [{
        ...baseMarket,
        id: "misleading-regulation-market",
        title: "Misleading 90 Minute Winner",
        marketGroupTitle: "Regulation Time Winner",
        marketType: "moneyline",
        period: "regulation",
        outcomes: [
          { id: "home", name: "Home", label: "Home", side: "home", price: 0.4, bestBid: 0.39, bestAsk: 0.41, isTradable: true },
          { id: "tie", name: "Tie", label: "Tie", side: "draw", price: 0.3, bestBid: 0.29, bestAsk: 0.31, isTradable: true },
          { id: "away", name: "Away", label: "Away", side: "away", price: 0.3, bestBid: 0.29, bestAsk: 0.31, isTradable: true },
        ],
      }],
    };

    const normalized = normalizeEventDetail(detail);

    expect(normalized?.marketProfile).toBe("full_match_with_overtime");
    expect(normalized?.resultMode).toBe("no_draw");
    expect(normalized?.gameRules).toMatchObject({
      allowDraw: false,
      includesOvertime: true,
      description: "Full match including overtime has no draw outcome.",
    });
    expect(normalized?.supportedMarketTypes).toEqual(["full_match_with_overtime", "to_advance"]);
  });

  test("normalizes backend outright events without exposing the binary No leg as a game line", () => {
    const detail: EventDetail = {
      event: {
        id: "world-cup-winner",
        slug: "world-cup-winner",
        title: "World Cup Winner",
        description: "Tournament outright winner.",
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "future",
        homeTeamName: null,
        awayTeamName: null,
        startTime: null,
        status: "OPEN",
        liveStatus: null,
        period: null,
        clock: null,
        homeScore: null,
        awayScore: null,
        imageUrl: null,
        marketCount: 2,
        activeMarketCount: 2,
        marketProfile: "outright",
        resultMode: "one_winner",
        gameRules: {
          allowDraw: false,
          includesOvertime: false,
          description: "Tournament outright winner market.",
        },
        supportedMarketTypes: ["outright"],
      },
      markets: [
        {
          ...baseMarket,
          id: "argentina-market",
          title: "Argentina",
          marketGroupTitle: "Outrights",
          marketGroupKey: "outrights",
          marketGroupId: "outrights",
          marketType: "outright",
          propCategory: null,
          outcomes: [
            { id: "argentina-yes", name: "YES", label: "Argentina", side: "yes", price: 0.17, bestBid: 0.16, bestAsk: 0.18, isTradable: true },
            { id: "argentina-no", name: "NO", label: "No", side: "no", price: 0.83, bestBid: 0.82, bestAsk: 0.84, isTradable: true },
          ],
        },
        {
          ...baseMarket,
          id: "france-market",
          title: "France",
          marketGroupTitle: "Outrights",
          marketGroupKey: "outrights",
          marketGroupId: "outrights",
          marketType: "outright",
          propCategory: null,
          outcomes: [
            { id: "france-yes", name: "YES", label: "France", side: "yes", price: 0.15, bestBid: 0.14, bestAsk: 0.16, isTradable: true },
            { id: "france-no", name: "NO", label: "No", side: "no", price: 0.85, bestBid: 0.84, bestAsk: 0.86, isTradable: true },
          ],
        },
      ],
    };

    const normalized = normalizeEventDetail(detail);

    expect(normalized?.marketProfile).toBe("outright");
    expect(normalized?.resultMode).toBe("one_winner");
    expect(normalized?.supportedMarketTypes).toEqual(["outright"]);
    expect(normalized?.markets).toHaveLength(2);
    expect(normalized?.markets.every((market) => market.type === "future")).toBe(true);
    expect(normalized?.markets.map((market) => market.marketType)).toEqual(["future", "future"]);
    expect(normalized?.markets.map((market) => market.outcomes[0].label)).toEqual(["Argentina", "France"]);
    expect(normalized?.markets.map((market) => market.outcomes[1].label)).toEqual(["No", "No"]);
  });
});
