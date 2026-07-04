import { describe, expect, test } from "vitest";
import { normalizeMarket } from "../adapters/worldCupAdapter";
import type { Market } from "../types";

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
});
