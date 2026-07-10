import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");
const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio Google auth return contract", () => {
  test("shows a connected Portfolio state only after the Google auth return path", () => {
    const app = appSource();
    const portfolio = portfolioSource();

    expect(app).toContain("googleAuthReturnConnected");
    expect(app).toContain('url.includes("googleAuth=success")');
    expect(app).toContain("setGoogleAuthReturnConnected(true)");
    expect(app).toContain("setGoogleAuthReturnConnected(false)");
    expect(app).toContain("googleAuthConnected={googleAuthReturnConnected || forceAccountSignedIn || Boolean(accountSummary)}");

    expect(portfolio).toContain("googleAuthConnected = false");
    expect(portfolio).toContain("portfolio-account-google-connected");
    expect(portfolio).toContain("portfolio-google-login-connected-visible");
    expect(portfolio).toContain("Google connected");
    expect(portfolio).toContain("Server profile loaded");
    expect(portfolio).toContain("accountGoogleButtonConnected");
  });
});
