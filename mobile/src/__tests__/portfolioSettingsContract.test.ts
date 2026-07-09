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
    expect(portfolio).toContain("portfolio-account-entry-opens-account");
    expect(portfolio).toContain("portfolio-account-entry-top-left");
    expect(portfolio).toContain("portfolio-account-entry-google");
    expect(portfolio).toContain("portfolio-account-entry-label");
    expect(portfolio).toContain("Account & login");
    expect(portfolio).toContain("Sign in with Google");
    expect(portfolio).toContain("\\u4f7f\\u7528 Google \\u767b\\u5f55");
    expect(portfolio).toContain("openAccount: () => void");
    expect(portfolio).toContain("PortfolioSparkline");
    expect(portfolio).toContain("portfolio-section-tabs");
  });
});
