import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");
const accountCopySource = () => readFileSync("mobile/src/localization/appCopy.ts", "utf8");

describe("Portfolio funding hidden contract", () => {
  test("keeps deposit and withdraw out of the visible Local MVP Portfolio surface", () => {
    const portfolio = portfolioSource();
    const copy = accountCopySource();

    expect(portfolio).toContain("portfolio-funding-hidden-local-mvp");
    expect(portfolio).not.toContain('deposit: "Deposit"');
    expect(portfolio).not.toContain('withdraw: "Withdraw"');
    expect(portfolio).not.toContain("depositButton");
    expect(portfolio).not.toContain("withdrawButton");
    expect(copy).toContain("Fake-token trading balance for local MVP testing.");
    expect(copy).toContain("Fake-token trading is available without funding setup.");
    expect(copy).not.toContain("Deposits and withdrawals stay disabled");
    expect(copy).not.toContain("Deposits and withdrawals remain disabled");
  });
});
