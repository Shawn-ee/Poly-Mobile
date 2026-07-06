import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio settings contract", () => {
  test("does not expose a duplicate local-only account settings sheet", () => {
    const portfolio = portfolioSource();

    expect(portfolio).not.toContain("portfolio-settings");
    expect(portfolio).not.toContain("portfolio-settings-sheet");
    expect(portfolio).not.toContain("local-mvp-account-sheet");
    expect(portfolio).not.toContain("portfolio-settings-fake-token-mode");
    expect(portfolio).not.toContain("portfolio-settings-funding-disabled-local-mvp");
    expect(portfolio).not.toContain("Account settings");
    expect(portfolio).toContain("portfolio-account-entry-display-only");
    expect(portfolio).toContain("PortfolioSparkline");
    expect(portfolio).toContain("portfolio-section-tabs");
  });
});
