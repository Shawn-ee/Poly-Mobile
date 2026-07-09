import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const accountSource = () => readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const copySource = () => readFileSync("mobile/src/localization/appCopy.ts", "utf8");

describe("Account static row contract", () => {
  test("does not expose unsupported hardcoded settings rows", () => {
    const account = accountSource();
    const copy = copySource();

    expect(account).not.toContain("account-theme-row");
    expect(account).not.toContain(">Theme<");
    expect(account).not.toContain(">Dark<");
    expect(account).not.toContain("shield-checkmark-outline");
    expect(account).not.toContain("flask-outline");
    expect(account).not.toContain("t.security");
    expect(account).not.toContain("t.mockOnly");
    expect(account).not.toContain("account-more-menu");
    expect(account).not.toContain("account-menu-leaderboard");
    expect(account).not.toContain("account-menu-rewards");
    expect(account).not.toContain("account-menu-apis");
    expect(account).not.toContain("MVP disabled");
    expect(account).not.toContain("Leaderboard");
    expect(account).not.toContain("Rewards");
    expect(account).not.toContain("APIs");
    expect(copy).not.toContain("Security settings will appear after sign-in.");
    expect(copy).not.toContain("Fake-token mode only");
    expect(account).toContain("account-language-row");
    expect(account).toContain("account-trading-mode");
  });
});
