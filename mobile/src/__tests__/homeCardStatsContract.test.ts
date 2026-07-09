import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const homeSource = () => readFileSync("mobile/src/components/HomeScreen.tsx", "utf8");
const marketListsSource = () => readFileSync("mobile/src/components/MarketLists.tsx", "utf8");

describe("Home card stats contract", () => {
  test("does not attach frontend-invented volume or liquidity stats to match cards", () => {
    const home = homeSource();
    const marketLists = marketListsSource();

    expect(marketLists).not.toContain("marketCardStats");
    expect(marketLists).not.toContain("event-card-stats-hidden-local-mvp");
    expect(marketLists).not.toContain("event-card-volume-");
    expect(marketLists).not.toContain("event-card-liquidity-");
    expect(home).not.toContain("statsCopy={{ volume: t.volume, liquidity: t.liquidity }}");
    expect(home).not.toContain("volume: string");
    expect(home).not.toContain("liquidity: string");
    expect(marketLists).toContain("homeCardMarket(event)");
    expect(marketLists).toContain("event-card-retail-outcome-rail");
    expect(marketLists).toContain("eventSourceReadiness(event, locale)");
    expect(marketLists).toContain("home-card-source-provider-winner-local-lines");
    expect(marketLists).toContain("Winner: Polymarket / local lines");
  });
});
