import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const accountSource = () => readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const appCopySource = () => readFileSync("mobile/src/localization/appCopy.ts", "utf8");

describe("Account auth visibility contract", () => {
  test("does not expose local mock login or logout actions", () => {
    const account = accountSource();
    const copy = appCopySource();

    expect(account).not.toContain("AsyncStorage");
    expect(account).not.toContain("holiwyn.accountSignedIn.v1");
    expect(account).not.toContain("account-login-phone");
    expect(account).not.toContain("account-login-email");
    expect(account).not.toContain("account-sign-out");
    expect(account).not.toContain("updateSignedIn");
    expect(account).toContain("const signedIn = Boolean(forceSignedIn)");
    expect(account).toContain("account-login-google");
    expect(account).toContain("account-login-google-connected");
    expect(account).toContain("openGoogleSignIn");
    expect(account).toContain("account-login-unavailable");
    expect(copy).not.toContain("Mock login active");
    expect(copy).not.toContain("Mock login ready");
    expect(copy).toContain("Continue with Google");
    expect(copy).toContain("Google connected");
    expect(copy).toContain("Server profile loaded");
    expect(copy).toContain("Deposits and withdrawals remain disabled");
  });
});
