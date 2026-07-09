import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio history market context", () => {
  test("derives event and market context for backend titles shaped as event colon market", () => {
    const source = portfolioSource();

    expect(source).toContain("splitBackendMarketTitle");
    expect(source).toContain('title.split(":")');
    expect(source).toContain("portfolio-history-event-context-${activityEventSubline(activity)}");
    expect(source).toContain("portfolio-history-market-context-${activityMarketSubline(activity)}");
    expect(source).toContain("splitBackendMarketTitle(activity.title)?.marketTitle ?? \"Match Winner\"");
  });
});
