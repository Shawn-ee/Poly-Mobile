import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const marketListsSource = () => readFileSync("mobile/src/components/MarketLists.tsx", "utf8");

describe("MarketList source readiness markers", () => {
  test("keeps source readiness hidden from retail card text while preserving audit markers", () => {
    const source = marketListsSource();

    expect(source).toContain('const rawEventSourceReadiness');
    expect(source).toContain('export const eventSourceReadiness');
    expect(source).toContain("home-card-source-provider-winner-local-lines");
    expect(source).toContain("home-card-source-provider-backed");
    expect(source).toContain("home-card-source-local-lines");
    expect(source).toContain("sourceReadinessHidden");
    expect(source).not.toContain("Winner: Polymarket / Holiwyn lines");
    expect(source).not.toContain("Markets: Polymarket");
    expect(source).not.toContain("Holiwyn lines");
  });
});
