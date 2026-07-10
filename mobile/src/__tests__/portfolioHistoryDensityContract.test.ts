import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio history density contract", () => {
  test("renders a Polymarket-like history row with compact metric strip", () => {
    const source = portfolioSource();

    expect(source).toContain("portfolio-history-polymarket-row-parity");
    expect(source).toContain("portfolio-history-metric-strip");
    expect(source).toContain("portfolio-history-metric-strip-${activity.id}");
    expect(source).toContain("activityPrimaryMetricLabel(activity, locale)");
    expect(source).toContain('"Proceeds"');
    expect(source).toContain('"Cost"');
    expect(source).toContain("activityPrimaryMetricValue(activity)");
    expect(source).toContain("activityShares(activity).toFixed(2)");
    expect(source).toContain("activityPriceMetricValue(activity)");
    expect(source).toContain("activityMetricStrip");
    expect(source).toContain("activityMetricItemRight");
  });
});
