import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const scriptSource = () => readFileSync("mobile/scripts/google-auth-runtime-preflight.ps1", "utf8");
const packageSource = () => readFileSync("mobile/package.json", "utf8");

describe("Google auth runtime preflight contract", () => {
  test("checks live backend auth start route without exposing Google credentials", () => {
    const source = scriptSource();

    expect(source).toContain("GOOGLE_CLIENT_ID");
    expect(source).toContain("GOOGLE_CLIENT_SECRET");
    expect(source).toContain("NEXTAUTH_URL");
    expect(source).toContain("NextAuthUrl");
    expect(source).toContain("NextAuthUrl.Trim().TrimEnd");
    expect(source).toContain("/api/auth/google/start");
    expect(source).toContain("/api/auth/google/callback");
    expect(source).toContain("AllowAutoRedirect = $false");
    expect(source).toContain("accounts.google.com");
    expect(source).toContain("redirect_uri");
    expect(source).toContain("RequirePhysicalDeviceCallback");
    expect(source).toContain("SummaryPath");
    expect(source).toContain("readyForRuntimeStart");
    expect(source).toContain("failedChecks");
    expect(source).toContain("expectedCallback");
    expect(source).toContain("observedGoogleRedirectUri");
    expect(source).toContain("redirectUriOriginMatches");
    expect(source).toContain("redirectUriPathMatches");
    expect(source).toContain("redirectUriMatchesExpected");
    expect(source).toContain("Authorized redirect URIs");
    expect(source).toContain("holiwyn");
    expect(source).toContain("exp");
    expect(source).toContain("exps");
    expect(source).not.toContain("Write-Host $googleClientSecret");
    expect(source).not.toContain("Write-Host $googleClientId");
  });

  test("exposes strict and non-strict package scripts", () => {
    const pkg = packageSource();

    expect(pkg).toContain("check:google-auth-runtime");
    expect(pkg).toContain("check:google-auth-runtime:strict");
    expect(pkg).toContain("-RequireConfigured -RequirePhysicalDeviceCallback");
  });
});
