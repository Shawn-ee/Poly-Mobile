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
    expect(portfolio).toContain("portfolio-account-settings-gear");
    expect(portfolio).toContain("portfolio-account-entry-google");
    expect(portfolio).toContain("portfolio-account-google-direct-signin");
    expect(portfolio).toContain("portfolio-google-login-row-visible");
    expect(portfolio).toContain("portfolio-account-google-badge-visible");
    expect(portfolio).toContain("portfolio-avatar-google-badge");
    expect(portfolio).toContain("portfolio-account-entry-label");
    expect(portfolio).toContain("portfolio-account-google-login-label-visible");
    expect(portfolio).toContain("portfolio-google-login-button-visible");
    expect(portfolio).toContain("Continue with Google");
    expect(portfolio).toContain("Load your server profile");
    expect(portfolio).toContain("\\u4f7f\\u7528 Google \\u7ee7\\u7eed");
    expect(portfolio).toContain("\\u52a0\\u8f7d\\u670d\\u52a1\\u5668\\u4e2a\\u4eba\\u8d44\\u6599");
    expect(portfolio).toContain("openAccount: () => void");
    expect(portfolio).toContain("openGoogleSignIn: () => void");
    expect(portfolio).toContain("onPress={openGoogleSignIn}");
    expect(portfolio).toContain("PortfolioSparkline");
    expect(portfolio).toContain("portfolio-section-tabs");
  });
});
