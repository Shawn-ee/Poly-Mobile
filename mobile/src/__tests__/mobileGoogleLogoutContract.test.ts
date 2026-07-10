import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");
const apiSource = () => readFileSync("mobile/src/api.ts", "utf8");
const accountSource = () => readFileSync("mobile/src/components/AccountScreen.tsx", "utf8");
const routeSource = () => readFileSync("src/app/api/auth/mobile/logout/route.ts", "utf8");
const proofSource = () => readFileSync("scripts/prove_mobile_google_auth_return_s23.ps1", "utf8");

describe("Mobile Google logout contract", () => {
  test("mobile clears persisted Holiwyn credential and resets connected state", () => {
    const app = appSource();
    const api = apiSource();
    const account = accountSource();

    expect(app).toContain("signOutGoogle");
    expect(app).toContain("logoutMobile().catch");
    expect(app).toContain("clearMobileAuthApiKey().catch");
    expect(app).toContain("setRuntimeApiKey(DEFAULT_API_KEY)");
    expect(app).toContain("setGoogleAuthReturnConnected(false)");
    expect(app).toContain("setForceAccountSignedIn(false)");
    expect(app).toContain("setAccountSummary(null)");
    expect(app).toContain("signOut={signOutGoogle}");
    expect(api).toContain("logoutMobile()");
    expect(api).toContain("/api/auth/mobile/logout");
    expect(account).toContain("account-sign-out-google");
    expect(account).toContain("onPress={signOut}");
  });

  test("backend mobile logout revokes the current API credential when present", () => {
    const route = routeSource();

    expect(route).toContain('requireCanonicalActor(request, ["account:write"])');
    expect(route).toContain("actor.apiCredentialId");
    expect(route).toContain("revokeApiCredential");
    expect(route).toContain("clearUserIdCookie");
    expect(route).toContain("revokedApiCredential");
  });

  test("S23 proof can verify sign-out after persisted auth return", () => {
    const proof = proofSource();

    expect(proof).toContain("[switch]$VerifyLogout");
    expect(proof).toContain("cycle-$Cycle-google-auth-account-connected.xml");
    expect(proof).toContain("cycle-$Cycle-google-auth-account-signed-out.xml");
    expect(proof).toContain("logoutClearsPersistedCredential");
    expect(proof).toContain("account-sign-out-google");
  });
});
