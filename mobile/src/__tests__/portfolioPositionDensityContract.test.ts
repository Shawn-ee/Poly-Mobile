import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio position density contract", () => {
  test("renders a Polymarket-like position row with metric strip and compact actions", () => {
    const source = portfolioSource();

    expect(source).toContain("portfolio-position-polymarket-row-parity");
    expect(source).toContain("portfolio-position-metric-strip");
    expect(source).toContain("portfolio-position-metric-strip-${position.id}");
    expect(source).toContain("positionSidePill");
    expect(source).toContain("positionMetricStrip");
    expect(source).toContain("Cost {position.probability}%");
    expect(source).toContain("Current {positionCurrentProbability(position)}%");
    expect(source).toContain("To win");
    expect(source).toContain("portfolioPositionValue(position)");
    expect(source).toContain("positionPotentialPayout(position)");
    expect(source).toContain("portfolio-position-cash-out-");
    expect(source).toContain("position-trade-buy-");
  });
});
