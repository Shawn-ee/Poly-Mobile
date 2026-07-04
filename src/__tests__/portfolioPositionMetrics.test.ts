import { describe, expect, it } from "vitest";
import { estimatedPositionPnl, portfolioPositionValue } from "../domain/portfolioPositionMetrics";

describe("portfolio position metrics", () => {
  it("uses server current value and pnl when portfolio hydration provides them", () => {
    const position = {
      side: "buy" as const,
      amount: 210,
      probability: 42,
      currentValue: 255,
      pnl: 45,
    };

    expect(portfolioPositionValue(position)).toBe(255);
    expect(estimatedPositionPnl(position)).toBe(45);
  });

  it("falls back to demo price movement for local mock positions", () => {
    const position = {
      side: "buy" as const,
      amount: 100,
      probability: 50,
    };

    expect(portfolioPositionValue(position)).toBe(106);
    expect(estimatedPositionPnl(position)).toBe(6);
  });
});
