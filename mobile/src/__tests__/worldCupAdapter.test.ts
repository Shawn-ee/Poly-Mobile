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
          price: 0,
          bestBid: "0.01",
          bestAsk: "0.04",
          isTradable: true,
        },
      ],
    });

    expect(normalized.outcomes[0]).toMatchObject({
      id: "yes",
      label: "YES",
      probability: 3,
    });
  });
});
