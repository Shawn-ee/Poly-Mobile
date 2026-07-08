import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio source badges", () => {
  test("shows provider/local source labels from order-time selection snapshots", () => {
    const source = portfolioSource();

    expect(source).toContain("portfolioSourceBadge");
    expect(source).toContain("selection?.referenceSource");
    expect(source).toContain("portfolio-position-source-badge");
    expect(source).toContain("open-order-source-badge");
    expect(source).toContain("open-order-source-note");
    expect(source).toContain("portfolio-history-source-badge");
    expect(source).toContain("portfolio-source-badge-provider");
    expect(source).toContain("portfolio-source-badge-local");
    expect(source).toContain("Provider");
    expect(source).toContain("Local");
    expect(source).toContain("portfolioSourceSummary");
    expect(source).toContain("portfolio-selection-source-summary");
    expect(source).toContain("portfolio-source-summary-local-lines");
    expect(source).toContain("portfolio-local-line-count-");
  });
});
