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
    expect(portfolio).toContain("portfolio-account-google-badge-visible");
    expect(portfolio).toContain("portfolio-avatar-google-badge");
    expect(portfolio).toContain("portfolio-account-entry-label");
    expect(portfolio).toContain("portfolio-account-google-login-label-visible");
    expect(portfolio).toContain("portfolio-google-login-button-visible");
    expect(portfolio).toContain("Account / Google login");
    expect(portfolio).toContain("Google login");
    expect(portfolio).toContain("\\u8d26\\u6237 / Google \\u767b\\u5f55");
    expect(portfolio).toContain("Google \\u767b\\u5f55");
    expect(portfolio).toContain("openAccount: () => void");
    expect(portfolio).toContain("PortfolioSparkline");
    expect(portfolio).toContain("portfolio-section-tabs");
  });
});
