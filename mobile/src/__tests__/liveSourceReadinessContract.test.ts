import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = (path: string) => readFileSync(path, "utf8");

describe("Live source readiness contract", () => {
  test("shares backend source readiness between Home cards and Live page", () => {
    const live = source("mobile/src/components/LiveScreen.tsx");
    const marketLists = source("mobile/src/components/MarketLists.tsx");

    expect(marketLists).toContain("export const eventSourceReadiness");
    expect(marketLists).toContain("Winner: Polymarket / test lines");
    expect(marketLists).toContain("home-card-source-provider-winner-local-lines");
    expect(live).toContain("live-source-readiness");
    expect(live).toContain("eventSourceReadiness(event, locale)");
  });
});
