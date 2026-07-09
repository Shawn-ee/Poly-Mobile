import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const searchSource = () => readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");

describe("Search result stats contract", () => {
  test("does not expose frontend-invented market stats or chat counts", () => {
    const search = searchSource();

    expect(search).not.toContain("8200 +");
    expect(search).not.toContain("4200 +");
    expect(search).not.toContain("outcomeCount *");
    expect(search).not.toContain("Chat {");
    expect(search).not.toContain("today</Text>");
    expect(search).not.toContain("t.volume");
    expect(search).not.toContain("t.liquidity");
    expect(search).toContain("Starts");
    expect(search).toContain("event.startsAt");
    expect(search).toContain("marketSourceSummary");
    expect(search).toContain("polymarketMarketCount");
    expect(search).toContain("contractFixtureMarketCount");
    expect(search).toContain("search-result-source-");
    expect(search).toContain("resultSourceHidden");
    expect(search).toContain("mixed-provider-holiwyn-lines");
    expect(search).toContain("holiwyn-lines");
    expect(search).not.toContain("Polymarket ${providerCount} markets");
    expect(search).not.toContain("Polymarket ${providerCount} / Holiwyn lines");
    expect(search).not.toContain("Source unavailable");
    expect(search).not.toContain("mixed-provider-test-lines");
    expect(search).not.toContain("test-lines");
    expect(search).toContain("save-event-");
    expect(search).toContain("search-result-");
  });
});
