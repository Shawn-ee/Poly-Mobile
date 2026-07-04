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
      liquidity: "4500",
      orderbookDepth: [{ outcomeId: "aus", side: "bid", price: 0.58, shares: 100, total: 58 }],
      outcomes: [
        {
          id: "aus",
          name: "Australia +0.5",
          label: "Australia +0.5",
          side: "home",
          price: 0.6,
          bestBid: 0.58,
          bestAsk: 0.62,
          isTradable: true,
        },
      ],
    });

    expect(normalized).toMatchObject({
      marketGroupId: "aus-egy-live-game-lines",
      marketType: "spread",
      period: "regulation",
      line: "+0.5",
      liquidity: 4500,
      orderbookDepth: [{ outcomeId: "aus", side: "bid", price: 0.58, shares: 100, total: 58 }],
      outcomes: [{ id: "aus", side: "home", bestBid: 0.58, bestAsk: 0.62 }],
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
});
